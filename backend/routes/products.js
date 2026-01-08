const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products - Obtener todos los productos publicados
router.get('/', async (req, res) => {
  try {
    const filters = {
      tipo: req.query.tipo,
      search: req.query.search,
      precioMin: req.query.precioMin,
      precioMax: req.query.precioMax
    };

    const products = await Product.getAll(filters);
    
    res.json({
      success: true,
      count: products.length,
      products: products
    });
  } catch (error) {
    console.error('Error en GET /api/products:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/products/types - Obtener tipos de productos
router.get('/types', async (req, res) => {
  try {
    const types = await Product.getTypes();
    res.json({
      success: true,
      types: types
    });
  } catch (error) {
    console.error('Error en GET /api/products/types:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/products/featured - Obtener productos destacados
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const products = await Product.getFeatured(limit);
    res.json({
      success: true,
      count: products.length,
      products: products
    });
  } catch (error) {
    console.error('Error en GET /api/products/featured:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos destacados',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/products/:id - Obtener un producto por ID
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

    res.json({
      success: true,
      product: product
    });
  } catch (error) {
    console.error('Error en GET /api/products/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
