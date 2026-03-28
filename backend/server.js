const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const bcrypt   = require('bcrypt');
const session  = require('express-session');   // ← NUEVO
const passport = require('./config/passport'); // ← NUEVO
require('dotenv').config();
const rateLimit = require('express-rate-limit');

const db             = require('./config/database');
const productsRoutes = require('./routes/products');
const adminRoutes    = require('./routes/admin');
const authRoutes     = require('./routes/auth');
const suscripcionesRoutes = require('./routes/suscripciones');
const feedbackRoutes      = require('./routes/feedback');
const resenasRoutes = require('./routes/resenas');


// ========================================
// RATE LIMITING
// ========================================

const authLimiter = rateLimit({
    windowMs:         15 * 60 * 1000,
    max:              10,
    standardHeaders:  true,
    legacyHeaders:    false,
    message: {
        success: false,
        code:    'DEMASIADOS_INTENTOS',
        message: 'Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.'
    }
});

const apiLimiter = rateLimit({
    windowMs:        60 * 1000,
    max:             100,
    standardHeaders: true,
    legacyHeaders:   false,
    message: {
        success: false,
        code:    'LIMITE_EXCEDIDO',
        message: 'Demasiadas peticiones. Intenta en unos segundos.'
    }
});

const app  = express();
const PORT = process.env.PORT || 3000;


// ========================================
// SECCIÓN 1: MIDDLEWARES
// ========================================

app.use(helmet());

app.use(cors({
    origin:         process.env.FRONTEND_URL || 'http://127.0.0.1:5500',
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:    true   // ← NECESARIO para que el redirect OAuth funcione
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session (requerida por Passport para el flujo de redirect OAuth) ──
// Solo se usa durante el handshake OAuth; el resto de la app usa JWT.
app.use(session({
    secret:            process.env.SESSION_SECRET || 'olivia_session_fallback',
    resave:            false,
    saveUninitialized: false,
    cookie: {
        secure:   false,  // cambiar a true en producción con HTTPS
        httpOnly: true,
        maxAge:   5 * 60 * 1000  // 5 minutos — solo para el flujo OAuth
    }
}));

// ── Passport ──
app.use(passport.initialize());
// NO usamos passport.session() porque la app usa JWT, no sesiones persistentes

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});


// ========================================
// SECCIÓN 2: RUTAS BASE
// ========================================

app.get('/', (req, res) => {
    res.json({
        message:  '🎉 API Olivia Merino funcionando correctamente',
        version:  '1.0.0',
        endpoints: {
            login:        'POST /api/login',
            products:     'GET  /api/products',
            productById:  'GET  /api/products/:id',
            filters:      'GET  /api/products/filters',
            featured:     'GET  /api/products/featured',
            zapatos:      'POST /api/zapatos',
            googleOAuth:  'GET  /api/auth/google',
        }
    });
});

app.get('/health', async (req, res) => {
    try {
        await db.query('SELECT NOW()');
        res.json({ status: 'OK', database: 'Connected', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(503).json({ status: 'ERROR', database: 'Disconnected', error: error.message });
    }
});


// ========================================
// SECCIÓN 3: AUTENTICACIÓN ADMIN
// ========================================

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios' });
    }

    try {
        const result = await db.query(
            'SELECT * FROM usuarios_admin WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }

        const user  = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (match) {
            return res.json({
                success: true,
                user: { id: user.id, nombre: user.nombre, email: user.email }
            });
        } else {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }

    } catch (error) {
        console.error('❌ Error en /api/login:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});


// ========================================
// SECCIÓN 4: RUTAS DE ZAPATOS
// ========================================

app.post('/api/zapatos', async (req, res) => {
    const { nombre, tipo_id, precio, temporada_id, es_a_pedido, descripcion, publicado } = req.body;

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
        return res.status(500).json({ success: false, message: 'Error al guardar en la base de datos' });
    }
});


// ========================================
// SECCIÓN 5: RUTAS DE PRODUCTOS Y AUTH
// ========================================

app.use('/api/products', productsRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/auth',     authLimiter, authRoutes);
app.use('/api',          apiLimiter);
app.use('/api/suscripciones', suscripcionesRoutes);
app.use('/api/feedback',      feedbackRoutes);
app.use('/api/resenas', resenasRoutes);


// ========================================
// SECCIÓN 6: MANEJO DE ERRORES
// ========================================

app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint no encontrado', path: req.url });
});

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
    console.log(`🔐 Google OAuth: http://localhost:${PORT}/api/auth/google`);
    console.log('========================================\n');
});

process.on('SIGTERM', () => {
    console.log('⚠️  SIGTERM recibido. Cerrando servidor...');
    db.pool.end(() => {
        console.log('✅ Pool de PostgreSQL cerrado');
        process.exit(0);
    });
});