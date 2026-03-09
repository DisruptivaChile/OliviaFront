const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const bcrypt  = require('bcrypt');
require('dotenv').config();

const db            = require('./config/database');
const productsRoutes = require('./routes/products');

const app  = express();
const PORT = process.env.PORT || 3000;


// ========================================
// SECCIÓN 1: MIDDLEWARES
// (Siempre antes de las rutas)
// ========================================

// Seguridad HTTP
app.use(helmet());

// CORS — Permite peticiones desde el frontend
app.use(cors({
  origin:         process.env.FRONTEND_URL || '*',
  methods:        ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers — Permiten leer req.body en todas las rutas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});


// ========================================
// SECCIÓN 2: RUTAS BASE
// ========================================

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message:  '🎉 API Olivia Merino funcionando correctamente',
    version:  '1.0.0',
    endpoints: {
      login:       'POST /api/login',
      products:    'GET  /api/products',
      productById: 'GET  /api/products/:id',
      zapatos:     'POST /api/zapatos',
    }
  });
});

// Health check — Verifica conexión a la BD
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT NOW()');
    res.json({
      status:    'OK',
      database:  'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status:   'ERROR',
      database: 'Disconnected',
      error:    error.message
    });
  }
});


// ========================================
// SECCIÓN 3: AUTENTICACIÓN
// ========================================

// POST /api/login
// Login de administrador con email + contraseña
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // Validación básica de campos
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email y contraseña son obligatorios'
    });
  }

  try {
    // 1. Buscar el admin por email
    const result = await db.query(
      'SELECT * FROM usuarios_admin WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Usamos el mismo mensaje para no revelar si el email existe o no
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    const user = result.rows[0];

    // 2. Comparar la contraseña con el hash guardado en la BD
    // Nota: el hash debe haber sido generado con bcrypt desde Node.js
    // (no con pgcrypto). Ejecuta scripts/crearAdmin.js para regenerarlo.
    const match = await bcrypt.compare(password, user.password_hash);

    if (match) {
      // 3. Login exitoso
      return res.json({
        success: true,
        user: {
          id:     user.id,
          nombre: user.nombre,
          email:  user.email
        }
      });
    } else {
      // 4. Contraseña incorrecta
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

  } catch (error) {
    console.error('❌ Error en /api/login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});


// ========================================
// SECCIÓN 4: RUTAS DE ZAPATOS
// ========================================

// POST /api/zapatos
// Crea un nuevo zapato en la BD
/** app.post('/api/zapatos', async (req, res) => {
  const { nombre, tipo_id, precio, temporada_id, es_a_pedido, descripcion, publicado } = req.body;

  // Validación básica de campos obligatorios
  if (!nombre || !tipo_id || !precio) {
    return res.status(400).json({
      success: false,
      message: 'Los campos nombre, tipo_id y precio son obligatorios'
    });
  }

  try {
    const result = await db.query(
      `INSERT INTO zapatos (nombre, tipo_id, precio, temporada_id, es_a_pedido, descripcion, publicado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [nombre, tipo_id, precio, temporada_id || null, es_a_pedido || false, descripcion || null, publicado || false]
    );

    return res.status(201).json({
      success:  true,
      message:  'Zapato creado exitosamente',
      zapatoId: result.rows[0].id
    });

  } catch (error) {
    console.error('❌ Error en POST /api/zapatos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al guardar en la base de datos'
    });
  }
}); **/


// ========================================
// SECCIÓN 5: RUTAS EXTERNAS
// ========================================

app.use('/api/products', productsRoutes);


// ========================================
// SECCIÓN 6: MANEJO DE ERRORES
// ========================================

// Ruta no encontrada (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path:    req.url
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error:   process.env.NODE_ENV === 'development' ? err : undefined
  });
});


// ========================================
// SECCIÓN 7: INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('🚀 Servidor Olivia Merino Backend');
  console.log('========================================');
  console.log(`📡 Puerto:      http://localhost:${PORT}`);
  console.log(`🌍 Entorno:     ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Base datos:  ${process.env.DB_NAME}`);
  console.log('========================================\n');
});

// Cierre graceful al recibir señal de apagado
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido. Cerrando servidor...');
  db.pool.end(() => {
    console.log('✅ Pool de PostgreSQL cerrado');
    process.exit(0);
  });
});
