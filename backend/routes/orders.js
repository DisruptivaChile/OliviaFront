// =============================================
// backend/routes/orders.js
// Gestión de órdenes + integración MercadoPago
// =============================================

const express    = require('express');
const router     = express.Router();
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const db         = require('../config/database');
const verifyToken = require('../middleware/verifyToken');

// Inicializar MercadoPago
const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || '',
});

// =============================================
// Generar código único de orden
// =============================================
function generarCodigo() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'OLV-';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// =============================================
// POST /api/orders — Crear orden + preferencia MP
// =============================================
router.post('/', async (req, res) => {
    const {
        items,              // [{ zapato_id, nombre, precio, talla, cantidad }]
        nombre_cliente,
        email_cliente,
        telefono_cliente,
        direccion,
        ciudad,
        region,
        pais,
        notas
    } = req.body;

    // Validación básica
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'El carrito está vacío' });
    }
    if (!nombre_cliente || !email_cliente || !direccion || !ciudad) {
        return res.status(400).json({ success: false, message: 'Faltan datos de contacto y envío' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_cliente)) {
        return res.status(400).json({ success: false, message: 'Email inválido' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // Verificar stock para cada item
        for (const item of items) {
            const stockResult = await client.query(
                `SELECT zt.stock FROM zapato_tallas zt
                 JOIN tallas t ON t.id = zt.talla_id
                 WHERE zt.zapato_id = $1 AND t.numero_talla = $2`,
                [item.zapato_id, String(item.talla)]
            );
            if (stockResult.rows.length === 0 || stockResult.rows[0].stock < item.cantidad) {
                await client.query('ROLLBACK');
                return res.status(409).json({
                    success: false,
                    message: `Sin stock suficiente para "${item.nombre}" talla ${item.talla}`
                });
            }
        }

        // Calcular total
        const total = items.reduce((sum, i) => sum + (parseFloat(i.precio) * parseInt(i.cantidad)), 0);

        // Generar código único
        let codigo;
        let existe = true;
        while (existe) {
            codigo = generarCodigo();
            const check = await client.query('SELECT id FROM ordenes WHERE codigo = $1', [codigo]);
            existe = check.rows.length > 0;
        }

        // Obtener usuario_id si está autenticado (opcional)
        let usuario_id = null;
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
                usuario_id = decoded.id || null;
            } catch (_) { /* invitado */ }
        }

        // Insertar orden
        const ordenResult = await client.query(
            `INSERT INTO ordenes
             (codigo, usuario_id, total, nombre_cliente, email_cliente, telefono_cliente,
              direccion, ciudad, region, pais, notas)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
             RETURNING id, codigo`,
            [codigo, usuario_id, total, nombre_cliente, email_cliente,
             telefono_cliente || null, direccion, ciudad, region || null,
             pais || 'Chile', notas || null]
        );
        const orden = ordenResult.rows[0];

        // Insertar items y descontar stock
        for (const item of items) {
            await client.query(
                `INSERT INTO orden_items (orden_id, zapato_id, talla, cantidad, precio_unit)
                 VALUES ($1, $2, $3, $4, $5)`,
                [orden.id, item.zapato_id, String(item.talla), parseInt(item.cantidad), parseFloat(item.precio)]
            );
            await client.query(
                `UPDATE zapato_tallas SET stock = stock - $1
                 WHERE zapato_id = $2 AND talla_id = (
                     SELECT id FROM tallas WHERE numero_talla = $3
                 )`,
                [parseInt(item.cantidad), item.zapato_id, String(item.talla)]
            );
        }

        await client.query('COMMIT');

        // Crear preferencia MercadoPago
        const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5500';
        const preference = new Preference(mpClient);

        const mpItems = items.map(i => ({
            id:          String(i.zapato_id),
            title:       `${i.nombre} - Talla ${i.talla}`,
            quantity:    parseInt(i.cantidad),
            unit_price:  parseFloat(i.precio),
            currency_id: 'CLP',
        }));

        const prefData = await preference.create({
            body: {
                items: mpItems,
                payer: {
                    name:  nombre_cliente,
                    email: email_cliente,
                    phone: telefono_cliente ? { number: telefono_cliente } : undefined,
                },
                external_reference: orden.codigo,
                back_urls: {
                    success: `${frontendUrl}/checkout-resultado.html?estado=exitoso&orden=${orden.codigo}`,
                    failure: `${frontendUrl}/checkout-resultado.html?estado=fallido&orden=${orden.codigo}`,
                    pending: `${frontendUrl}/checkout-resultado.html?estado=pendiente&orden=${orden.codigo}`,
                },
                auto_return:        'approved',
                statement_descriptor: 'OLIVIA MERINO',
                notification_url:   `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/orders/webhook`,
            }
        });

        // Guardar preference_id en la orden
        await db.query(
            'UPDATE ordenes SET mp_preference_id = $1 WHERE id = $2',
            [prefData.id, orden.id]
        );

        return res.status(201).json({
            success:       true,
            orden_codigo:  orden.codigo,
            orden_id:      orden.id,
            mp_init_point: prefData.init_point,  // URL de pago MP
            sandbox_url:   prefData.sandbox_init_point,
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error al crear orden:', error);
        return res.status(500).json({ success: false, message: 'Error al procesar el pedido' });
    } finally {
        client.release();
    }
});

// =============================================
// GET /api/orders/:codigo — Estado de una orden
// =============================================
router.get('/:codigo', async (req, res) => {
    const { codigo } = req.params;

    try {
        const result = await db.query(
            `SELECT o.id, o.codigo, o.estado, o.total, o.nombre_cliente, o.email_cliente,
                    o.direccion, o.ciudad, o.region, o.pais, o.creado_en, o.mp_status,
                    json_agg(json_build_object(
                        'nombre',     z.nombre,
                        'talla',      oi.talla,
                        'cantidad',   oi.cantidad,
                        'precio_unit',oi.precio_unit,
                        'subtotal',   oi.subtotal
                    )) AS items
             FROM ordenes o
             JOIN orden_items oi ON oi.orden_id = o.id
             JOIN zapatos z ON z.id = oi.zapato_id
             WHERE o.codigo = $1
             GROUP BY o.id`,
            [codigo]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Orden no encontrada' });
        }

        return res.json({ success: true, orden: result.rows[0] });
    } catch (error) {
        console.error('❌ Error al obtener orden:', error);
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
});

// =============================================
// GET /api/orders/mis-ordenes — Historial (requiere login)
// =============================================
router.get('/mis-ordenes/historial', verifyToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT o.id, o.codigo, o.estado, o.total, o.creado_en,
                    COUNT(oi.id) AS cantidad_productos
             FROM ordenes o
             LEFT JOIN orden_items oi ON oi.orden_id = o.id
             WHERE o.usuario_id = $1
             GROUP BY o.id
             ORDER BY o.creado_en DESC`,
            [req.user.id]
        );
        return res.json({ success: true, ordenes: result.rows });
    } catch (error) {
        console.error('❌ Error al obtener historial:', error);
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
});

// =============================================
// POST /api/orders/webhook — Notificaciones MP
// =============================================
router.post('/webhook', async (req, res) => {
    const { type, data } = req.body;

    if (type !== 'payment') {
        return res.sendStatus(200);
    }

    try {
        const payment = new Payment(mpClient);
        const paymentInfo = await payment.get({ id: data.id });

        const { external_reference, status, id: payment_id } = paymentInfo;

        let nuevoEstado = 'pendiente';
        if (status === 'approved')  nuevoEstado = 'pagado';
        if (status === 'rejected')  nuevoEstado = 'cancelado';

        await db.query(
            `UPDATE ordenes
             SET estado = $1, mp_payment_id = $2, mp_status = $3, actualizado_en = NOW()
             WHERE codigo = $4`,
            [nuevoEstado, String(payment_id), status, external_reference]
        );

        return res.sendStatus(200);
    } catch (error) {
        console.error('❌ Error en webhook MP:', error);
        return res.sendStatus(500);
    }
});

// =============================================
// GET /api/admin/orders — Ver todas las órdenes (admin)
// =============================================
router.get('/admin/lista', async (req, res) => {
    // Protección simple por token admin via query param o header
    const adminToken = req.headers['x-admin-token'];
    if (adminToken !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    try {
        const result = await db.query(
            `SELECT o.id, o.codigo, o.estado, o.total, o.nombre_cliente,
                    o.email_cliente, o.ciudad, o.pais, o.creado_en
             FROM ordenes o
             ORDER BY o.creado_en DESC
             LIMIT 100`
        );
        return res.json({ success: true, ordenes: result.rows });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
});

module.exports = router;
