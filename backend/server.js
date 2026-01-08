const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const db = require('./config/database');
const productsRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// MIDDLEWARES
// ========================================

// Seguridad
app.use(helmet());

// CORS - Permitir peticiones desde el frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ========================================
// RUTAS
// ========================================

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: '🎉 API Olivia Merino funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      productById: '/api/products/:id',
      productTypes: '/api/products/types',
      featured: '/api/products/featured'
    }
  });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await db.query('SELECT NOW()');
    res.json({
      status: 'OK',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      database: 'Disconnected',
      error: error.message
    });
  }
});

// Rutas de productos
app.use('/api/products', productsRoutes);

// ========================================
// MANEJO DE ERRORES
// ========================================

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.url
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('🚀 Servidor Olivia Merino Backend');
  console.log('========================================');
  console.log(`📡 Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Base de datos: ${process.env.DB_NAME}`);
  console.log('========================================\n');
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido. Cerrando servidor...');
  db.pool.end(() => {
    console.log('✅ Pool de PostgreSQL cerrado');
    process.exit(0);
  });
});
