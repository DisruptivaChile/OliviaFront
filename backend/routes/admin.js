// =============================================
// backend/routes/admin.js
// Rutas exclusivas del panel de administración
// Sin filtro de publicado=TRUE — el admin
// necesita ver todos los productos
// =============================================

const express = require('express');
const router  = express.Router();
const db      = require('../config/database');


// -----------------------------------------------
// GET /api/admin/products
// Devuelve TODOS los productos (publicados y no)
// con imagen_principal para la grilla del admin
// -----------------------------------------------
router.get('/products', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT
                z.id,
                z.nombre,
                z.precio,
                z.publicado,
                z.es_a_pedido,
                t.nombre  AS tipo,
                te.nombre AS temporada,
                (
                    SELECT ruta_imagen
                    FROM zapato_imagenes
                    WHERE zapato_id = z.id AND es_principal = TRUE
                    LIMIT 1
                ) AS imagen_principal
            FROM zapatos z
            LEFT JOIN tipos_zapato t  ON z.tipo_id      = t.id
            LEFT JOIN temporadas   te ON z.temporada_id = te.id
            ORDER BY z.id DESC
        `);

        return res.json({
            success:  true,
            count:    result.rows.length,
            products: result.rows
        });

    } catch (error) {
        console.error('❌ Error en GET /api/admin/products:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener productos' });
    }
});


// -----------------------------------------------
// GET /api/admin/products/:id
// Devuelve un producto completo para edición
// (incluye imágenes, tallas, todos los campos)
// -----------------------------------------------
router.get('/products/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

    try {
        const result = await db.query(`
            SELECT
                z.id,
                z.nombre,
                z.precio,
                z.descripcion,
                z.materiales,
                z.historia,
                z.musica_url,
                z.publicado,
                z.es_a_pedido,
                z.tipo_id,
                z.temporada_id,
                t.nombre  AS tipo,
                te.nombre AS temporada,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'id',           zi.id,
                            'url',          zi.ruta_imagen,
                            'es_principal', zi.es_principal,
                            'orden',        zi.orden_display
                        )
                    ) FILTER (WHERE zi.id IS NOT NULL),
                    '[]'
                ) AS imagenes,
                COALESCE(
                    json_agg(
                        DISTINCT jsonb_build_object(
                            'talla', ta.numero_talla,
                            'stock', zt.stock
                        )
                    ) FILTER (WHERE ta.id IS NOT NULL),
                    '[]'
                ) AS tallas
            FROM zapatos z
            LEFT JOIN tipos_zapato    t  ON z.tipo_id      = t.id
            LEFT JOIN temporadas      te ON z.temporada_id = te.id
            LEFT JOIN zapato_imagenes zi ON z.id           = zi.zapato_id
            LEFT JOIN zapato_tallas   zt ON z.id           = zt.zapato_id
            LEFT JOIN tallas          ta ON zt.talla_id    = ta.id
            WHERE z.id = $1
            GROUP BY z.id, t.nombre, te.nombre, z.tipo_id, z.temporada_id
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }

        return res.json({ success: true, product: result.rows[0] });

    } catch (error) {
        console.error('❌ Error en GET /api/admin/products/:id:', error);
        return res.status(500).json({ success: false, message: 'Error al obtener producto' });
    }
});


// -----------------------------------------------
// PATCH /api/admin/products/:id/publicado
// Publica o despublica un producto
// -----------------------------------------------
router.patch('/products/:id/publicado', async (req, res) => {
    const id        = parseInt(req.params.id);
    const { publicado } = req.body;

    if (isNaN(id) || publicado === undefined) {
        return res.status(400).json({ success: false, message: 'Parámetros inválidos' });
    }

    try {
        await db.query(
            'UPDATE zapatos SET publicado = $1 WHERE id = $2',
            [publicado, id]
        );
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ Error en PATCH publicado:', error);
        return res.status(500).json({ success: false, message: 'Error al actualizar' });
    }
});


// -----------------------------------------------
// PATCH /api/admin/products/:id/a-pedido
// Cambia entre producto normal y a pedido
// -----------------------------------------------
router.patch('/products/:id/a-pedido', async (req, res) => {
    const id            = parseInt(req.params.id);
    const { es_a_pedido } = req.body;

    if (isNaN(id) || es_a_pedido === undefined) {
        return res.status(400).json({ success: false, message: 'Parámetros inválidos' });
    }

    try {
        await db.query(
            'UPDATE zapatos SET es_a_pedido = $1 WHERE id = $2',
            [es_a_pedido, id]
        );
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ Error en PATCH a-pedido:', error);
        return res.status(500).json({ success: false, message: 'Error al actualizar' });
    }
});


// -----------------------------------------------
// PUT /api/admin/products/:id
// Actualiza todos los datos de un producto
// (usado por edit-product.html)
// -----------------------------------------------
router.put('/products/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

    const {
        nombre, tipo_id, precio, temporada_id,
        es_a_pedido, publicado, descripcion,
        materiales, historia, musica_url
    } = req.body;

    if (!nombre || !tipo_id || !precio) {
        return res.status(400).json({ success: false, message: 'nombre, tipo_id y precio son obligatorios' });
    }

    try {
        await db.query(
            `UPDATE zapatos SET
                nombre       = $1,
                tipo_id      = $2,
                precio       = $3,
                temporada_id = $4,
                es_a_pedido  = $5,
                publicado    = $6,
                descripcion  = $7,
                materiales   = $8,
                historia     = $9,
                musica_url   = $10
             WHERE id = $11`,
            [
                nombre, tipo_id, precio,
                temporada_id || null,
                es_a_pedido  || false,
                publicado    || false,
                descripcion  || null,
                materiales   || null,
                historia     || null,
                musica_url   || null,
                id
            ]
        );
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ Error en PUT /api/admin/products/:id:', error);
        return res.status(500).json({ success: false, message: 'Error al actualizar producto' });
    }
});




// -----------------------------------------------
// DELETE /api/admin/products/:id/imagenes/:imgId
// Elimina una imagen de un zapato
// -----------------------------------------------
router.delete('/products/:id/imagenes/:imgId', async (req, res) => {
    const imgId = parseInt(req.params.imgId);
    if (isNaN(imgId)) return res.status(400).json({ success: false, message: 'ID inválido' });

    try {
        await db.query('DELETE FROM zapato_imagenes WHERE id = $1', [imgId]);
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ Error en DELETE imagen:', error);
        return res.status(500).json({ success: false, message: 'Error al eliminar imagen' });
    }
});


// -----------------------------------------------
// PATCH /api/admin/products/:id/imagenes/:imgId/principal
// Marca una imagen como principal (desmarca el resto)
// -----------------------------------------------
router.patch('/products/:id/imagenes/:imgId/principal', async (req, res) => {
    const zapatoId = parseInt(req.params.id);
    const imgId    = parseInt(req.params.imgId);

    if (isNaN(zapatoId) || isNaN(imgId)) {
        return res.status(400).json({ success: false, message: 'IDs inválidos' });
    }

    try {
        // Desmarcar todas las imágenes del zapato
        await db.query(
            'UPDATE zapato_imagenes SET es_principal = FALSE WHERE zapato_id = $1',
            [zapatoId]
        );
        // Marcar la seleccionada
        await db.query(
            'UPDATE zapato_imagenes SET es_principal = TRUE WHERE id = $1',
            [imgId]
        );
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ Error en PATCH principal:', error);
        return res.status(500).json({ success: false, message: 'Error al actualizar imagen principal' });
    }
});


// -----------------------------------------------
// DELETE /api/admin/imagenes/:id
// Elimina una imagen de la BD
// -----------------------------------------------
router.delete('/imagenes/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

    try {
        await db.query('DELETE FROM zapato_imagenes WHERE id = $1', [id]);
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ Error en DELETE /api/admin/imagenes/:id:', error);
        return res.status(500).json({ success: false, message: 'Error al eliminar imagen' });
    }
});


// -----------------------------------------------
// PATCH /api/admin/products/:id/imagen-principal
// Cambia qué imagen es la principal del zapato
// -----------------------------------------------
// PATCH /api/admin/products/:id/imagenes/principal
router.patch('/products/:id/imagenes/principal', async (req, res) => {
    const zapatoId  = parseInt(req.params.id);
    const { imagen_id } = req.body;

    if (isNaN(zapatoId) || !imagen_id) {
        return res.status(400).json({ success: false, message: 'Parámetros inválidos' });
    }

    try {
        await db.query(
            'UPDATE zapato_imagenes SET es_principal = FALSE WHERE zapato_id = $1',
            [zapatoId]
        );
        await db.query(
            'UPDATE zapato_imagenes SET es_principal = TRUE WHERE id = $1 AND zapato_id = $2',
            [imagen_id, zapatoId]
        );
        return res.json({ success: true });
    } catch (error) {
        console.error('❌ Error actualizando imagen principal:', error);
        return res.status(500).json({ success: false, message: 'Error al actualizar' });
    }
});


module.exports = router;