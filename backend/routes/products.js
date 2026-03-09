// =============================================
// backend/routes/products.js
// Rutas de productos — usa el modelo Product
// =============================================

const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');


// -----------------------------------------------
// GET /api/products
// Parámetros opcionales:
//   ?es_a_pedido=false   → catálogo normal
//   ?es_a_pedido=true    → preorden / a pedido
//   ?tipo_id=1
//   ?temporada_id=2
//   ?talla=37
//   ?precioMin=0&precioMax=100
//   ?search=sandalia
// -----------------------------------------------
router.get('/', async (req, res) => {
    try {
        const filters = {
            es_a_pedido:  req.query.es_a_pedido !== undefined
                            ? req.query.es_a_pedido === 'true'
                            : undefined,
            tipo_id:      req.query.tipo_id,
            temporada_id: req.query.temporada_id,
            talla:        req.query.talla,
            search:       req.query.search,
            precioMin:    req.query.precioMin,
            precioMax:    req.query.precioMax
        };

        const products = await Product.getAll(filters);

        return res.json({
            success: true,
            count:   products.length,
            products
        });

    } catch (error) {
        console.error('❌ Error en GET /api/products:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error:   process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});


// -----------------------------------------------
// GET /api/products/filters
// Devuelve tipos y temporadas para los selects
// -----------------------------------------------
router.get('/filters', async (req, res) => {
    try {
        const [tipos, temporadas] = await Promise.all([
            Product.getTypes(),
            Product.getTemporadas()
        ]);

        return res.json({
            success: true,
            tipos,
            temporadas
        });

    } catch (error) {
        console.error('❌ Error en GET /api/products/filters:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener filtros'
        });
    }
});


// -----------------------------------------------
// GET /api/products/featured
// -----------------------------------------------
router.get('/featured', async (req, res) => {
    try {
        const limit    = parseInt(req.query.limit) || 6;
        const products = await Product.getFeatured(limit);

        return res.json({
            success: true,
            count:   products.length,
            products
        });

    } catch (error) {
        console.error('❌ Error en GET /api/products/featured:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener productos destacados'
        });
    }
});


// -----------------------------------------------
// GET /api/products/:id
// -----------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);

        if (isNaN(productId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de producto inválido'
            });
        }

        const product = await Product.getById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        return res.json({ success: true, product });

    } catch (error) {
        console.error('❌ Error en GET /api/products/:id:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener producto'
        });
    }
});

// -----------------------------------------------
// POST /api/products
// Crea un nuevo zapato en la BD.
// Movido desde server.js para mantener modularidad.
// Acepta todos los campos de la tabla zapatos.
// -----------------------------------------------
router.post('/', async (req, res) => {
    const {
        nombre,
        tipo_id,
        precio,
        temporada_id,
        es_a_pedido,
        descripcion,
        publicado,
        materiales,
        historia,
        musica_url
    } = req.body;

    if (!nombre || !tipo_id || !precio) {
        return res.status(400).json({
            success: false,
            message: 'Los campos nombre, tipo_id y precio son obligatorios'
        });
    }

    try {
        const result = await db.query(
            `INSERT INTO zapatos
                (nombre, tipo_id, precio, temporada_id, es_a_pedido,
                 descripcion, publicado, materiales, historia, musica_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [
                nombre,
                tipo_id,
                precio,
                temporada_id || null,
                es_a_pedido  || false,
                descripcion  || null,
                publicado    || false,
                materiales   || null,
                historia     || null,
                musica_url   || null
            ]
        );

        return res.status(201).json({
            success:  true,
            message:  'Zapato creado exitosamente',
            zapatoId: result.rows[0].id
        });

    } catch (error) {
        console.error('❌ Error en POST /api/products:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al guardar en la base de datos'
        });
    }
});


module.exports = router;