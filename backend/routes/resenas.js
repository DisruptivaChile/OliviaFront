// =============================================
// backend/routes/resenas.js
// Solo compradores verificados pueden reseñar
// Columnas correctas según DBML:
//   zapato_resenas: estrellas, fecha
//   pedido_detalles (no pedido_items)
// =============================================

const express     = require('express');
const router      = express.Router();
const db          = require('../config/database');
const verifyToken = require('../middleware/verifyToken');


// -----------------------------------------------
// GET /api/resenas/:zapato_id
// Pública — obtiene todas las reseñas de un zapato
// -----------------------------------------------
router.get('/:zapato_id', async (req, res) => {
    const zapato_id = parseInt(req.params.zapato_id);

    if (isNaN(zapato_id)) {
        return res.status(400).json({ success: false, message: 'ID de zapato inválido.' });
    }

    try {
        const result = await db.query(
            `SELECT
                r.id,
                r.estrellas,
                r.comentario,
                r.fecha,
                u.nombre,
                u.apellido
             FROM zapato_resenas r
             JOIN usuarios u ON u.id = r.usuario_id
             WHERE r.zapato_id = $1
             ORDER BY r.fecha DESC`,
            [zapato_id]
        );

        return res.json({
            success: true,
            total:   result.rows.length,
            resenas: result.rows
        });

    } catch (error) {
        console.error('❌ Error en GET /api/resenas/:zapato_id:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});


// -----------------------------------------------
// GET /api/resenas/:zapato_id/puede-resenar
// PROTEGIDA — verifica si el usuario puede reseñar
// -----------------------------------------------
router.get('/:zapato_id/puede-resenar', verifyToken, async (req, res) => {
    const zapato_id  = parseInt(req.params.zapato_id);
    const usuario_id = req.usuario.id;

    if (isNaN(zapato_id)) {
        return res.status(400).json({ success: false, message: 'ID inválido.' });
    }

    try {
        // ¿Ya reseñó?
        const yaReseno = await db.query(
            'SELECT id FROM zapato_resenas WHERE usuario_id = $1 AND zapato_id = $2',
            [usuario_id, zapato_id]
        );

        if (yaReseno.rows.length > 0) {
            return res.json({ success: true, puede: false, razon: 'YA_RESENO' });
        }

        // ¿Compró y recibió? — tabla correcta: pedido_detalles
        const compro = await db.query(
            `SELECT p.id
             FROM pedidos p
             JOIN pedido_detalles pd ON pd.pedido_id = p.id
             WHERE p.usuario_id = $1
               AND pd.zapato_id = $2
               AND p.estado_id  = (
                   SELECT id FROM estados_pedido WHERE nombre = 'entregado'
               )
             LIMIT 1`,
            [usuario_id, zapato_id]
        );

        return res.json({
            success: true,
            puede:   compro.rows.length > 0,
            razon:   compro.rows.length > 0 ? null : 'NO_COMPRADOR'
        });

    } catch (error) {
        console.error('❌ Error en GET /api/resenas/:zapato_id/puede-resenar:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});


// -----------------------------------------------
// POST /api/resenas/:zapato_id
// PROTEGIDA — solo compradores verificados
// Body: { estrellas, comentario }
// -----------------------------------------------
router.post('/:zapato_id', verifyToken, async (req, res) => {
    const zapato_id  = parseInt(req.params.zapato_id);
    const usuario_id = req.usuario.id;
    const { estrellas, comentario } = req.body;

    if (isNaN(zapato_id)) {
        return res.status(400).json({ success: false, message: 'ID de zapato inválido.' });
    }

    const cal = parseInt(estrellas);
    if (!cal || cal < 1 || cal > 5) {
        return res.status(400).json({
            success: false,
            message: 'La calificación debe ser entre 1 y 5 estrellas.'
        });
    }

    if (!comentario || comentario.trim().length < 5) {
        return res.status(400).json({
            success: false,
            message: 'El comentario debe tener al menos 5 caracteres.'
        });
    }

    try {
        // ── Verificar compra entregada ──
        const pedidoResult = await db.query(
            `SELECT p.id
             FROM pedidos p
             JOIN pedido_detalles pd ON pd.pedido_id = p.id
             WHERE p.usuario_id = $1
               AND pd.zapato_id = $2
               AND p.estado_id  = (
                   SELECT id FROM estados_pedido WHERE nombre = 'entregado'
               )
             LIMIT 1`,
            [usuario_id, zapato_id]
        );

        if (pedidoResult.rows.length === 0) {
            return res.status(403).json({
                success: false,
                code:    'NO_COMPRADOR',
                message: 'Solo puedes reseñar productos que hayas comprado y recibido.'
            });
        }

        const pedido_id = pedidoResult.rows[0].id;

        // ── Verificar que no haya reseñado antes ──
        const yaReseno = await db.query(
            'SELECT id FROM zapato_resenas WHERE usuario_id = $1 AND zapato_id = $2',
            [usuario_id, zapato_id]
        );

        if (yaReseno.rows.length > 0) {
            return res.status(409).json({
                success: false,
                code:    'YA_RESENO',
                message: 'Ya has dejado una reseña para este producto.'
            });
        }

        // ── Insertar reseña ──
        const result = await db.query(
            `INSERT INTO zapato_resenas (usuario_id, zapato_id, pedido_id, estrellas, comentario)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, estrellas, comentario, fecha`,
            [usuario_id, zapato_id, pedido_id, cal, comentario.trim()]
        );

        const usuarioResult = await db.query(
            'SELECT nombre, apellido FROM usuarios WHERE id = $1',
            [usuario_id]
        );

        const usuario = usuarioResult.rows[0];
        const resena  = result.rows[0];

        return res.status(201).json({
            success: true,
            message: '¡Gracias por tu reseña!',
            resena: {
                id:       resena.id,
                estrellas: resena.estrellas,
                comentario: resena.comentario,
                fecha:    resena.fecha,
                nombre:   usuario.nombre,
                apellido: usuario.apellido
            }
        });

    } catch (error) {
        console.error('❌ Error en POST /api/resenas/:zapato_id:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

module.exports = router;