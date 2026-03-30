// =============================================
// backend/routes/auth.js
// Autenticación de usuarios normales
// JWT + rutas protegidas con verifyToken
// =============================================

const express     = require('express');
const router      = express.Router();
const bcrypt      = require('bcrypt');
const jwt         = require('jsonwebtoken');
const db          = require('../config/database');
const verifyToken = require('../middleware/verifyToken');

const SALT_ROUNDS = 12;

// Helper para generar JWT
function generarToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, nombre: user.nombre },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}


// -----------------------------------------------
// POST /api/auth/registro
// Body: { nombre, apellido, email, password, genero? }
// -----------------------------------------------
router.post('/registro', async (req, res) => {
    const { nombre, apellido, email, password, genero } = req.body;

    if (!nombre || !apellido || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Nombre, apellido, email y contraseña son obligatorios.'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 8 caracteres.'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'El correo electrónico no es válido.'
        });
    }

    try {
        const existe = await db.query(
            'SELECT id FROM usuarios WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existe.rows.length > 0) {
            return res.status(409).json({
                success: false,
                code:    'EMAIL_DUPLICADO',
                message: 'Este correo ya está registrado.'
            });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Buscar si ya existía como cliente histórico (Jumpseller)
        const historial = await db.query(
            'SELECT nombre, apellido FROM clientes_historial WHERE email = $1',
            [email.toLowerCase().trim()]
        );
        const esClienteRecurrente = historial.rows.length > 0;

        // Usar nombre del historial solo si el usuario no proporcionó uno propio
        const nombreFinal   = nombre.trim()   || (esClienteRecurrente ? historial.rows[0].nombre   : '');
        const apellidoFinal = apellido.trim()  || (esClienteRecurrente ? historial.rows[0].apellido : '');

        const result = await db.query(
            `INSERT INTO usuarios (nombre, apellido, email, genero, password_hash)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, nombre, apellido, email, genero, fecha_creacion`,
            [
                nombreFinal,
                apellidoFinal,
                email.toLowerCase().trim(),
                genero || null,
                passwordHash
            ]
        );

        const user  = result.rows[0];
        const token = generarToken(user);

        return res.status(201).json({
            success:             true,
            message:             esClienteRecurrente
                                   ? '¡Bienvenida de vuelta! Cuenta creada exitosamente.'
                                   : 'Cuenta creada exitosamente.',
            cliente_recurrente:  esClienteRecurrente,
            token,
            user: {
                id:       user.id,
                nombre:   user.nombre,
                apellido: user.apellido,
                email:    user.email,
                genero:   user.genero
            }
        });

    } catch (error) {
        console.error('❌ Error en POST /api/auth/registro:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});


// -----------------------------------------------
// POST /api/auth/login
// Body: { email, password }
// -----------------------------------------------
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email y contraseña son obligatorios.'
        });
    }

    try {
        const result = await db.query(
            'SELECT * FROM usuarios WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                code:    'CREDENCIALES_INVALIDAS',
                message: 'El correo o la contraseña son incorrectos.'
            });
        }

        const user = result.rows[0];

        if (!user.password_hash) {
            return res.status(401).json({
                success: false,
                code:    'LOGIN_SOCIAL',
                message: 'Esta cuenta fue creada con Google o Facebook. Inicia sesión con esa opción.'
            });
        }

        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({
                success: false,
                code:    'CREDENCIALES_INVALIDAS',
                message: 'El correo o la contraseña son incorrectos.'
            });
        }

        const token = generarToken(user);

        return res.json({
            success: true,
            token,
            user: {
                id:       user.id,
                nombre:   user.nombre,
                apellido: user.apellido,
                email:    user.email,
                genero:   user.genero
            }
        });

    } catch (error) {
        console.error('❌ Error en POST /api/auth/login:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});


// -----------------------------------------------
// GET /api/auth/perfil
// PROTEGIDA — el id viene del JWT, no de la URL
// -----------------------------------------------
router.get('/perfil', verifyToken, async (req, res) => {
    const id = req.usuario.id;

    try {
        const result = await db.query(
            'SELECT id, nombre, apellido, email, genero, fecha_creacion FROM usuarios WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        return res.json({ success: true, user: result.rows[0] });

    } catch (error) {
        console.error('❌ Error en GET /api/auth/perfil:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});


// -----------------------------------------------
// PUT /api/auth/perfil
// PROTEGIDA — actualiza nombre y apellido
// -----------------------------------------------
router.put('/perfil', verifyToken, async (req, res) => {
    const id               = req.usuario.id;
    const { nombre, apellido } = req.body;

    if (!nombre || !apellido) {
        return res.status(400).json({ success: false, message: 'Nombre y apellido son obligatorios.' });
    }

    try {
        await db.query(
            'UPDATE usuarios SET nombre = $1, apellido = $2 WHERE id = $3',
            [nombre.trim(), apellido.trim(), id]
        );
        return res.json({ success: true, message: 'Perfil actualizado.' });

    } catch (error) {
        console.error('❌ Error en PUT /api/auth/perfil:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});


// -----------------------------------------------
// DELETE /api/auth/perfil
// PROTEGIDA — elimina la cuenta
// -----------------------------------------------
router.delete('/perfil', verifyToken, async (req, res) => {
    const id = req.usuario.id;

    try {
        await db.query('DELETE FROM usuarios WHERE id = $1', [id]);
        return res.json({ success: true, message: 'Cuenta eliminada.' });

    } catch (error) {
        console.error('❌ Error en DELETE /api/auth/perfil:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});


// -----------------------------------------------
// PUT /api/auth/cambiar-password
// PROTEGIDA — cambia la contraseña
// -----------------------------------------------
router.put('/cambiar-password', verifyToken, async (req, res) => {
    const id = req.usuario.id;
    const { passwordActual, passwordNueva } = req.body;

    if (!passwordActual || !passwordNueva) {
        return res.status(400).json({ success: false, message: 'Ambas contraseñas son obligatorias.' });
    }

    if (passwordNueva.length < 8) {
        return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    }

    try {
        const result = await db.query(
            'SELECT password_hash FROM usuarios WHERE id = $1', [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        const { password_hash } = result.rows[0];

        if (!password_hash) {
            return res.status(400).json({
                success: false,
                code:    'SIN_PASSWORD',
                message: 'Esta cuenta no tiene contraseña porque fue creada con Google o Facebook.'
            });
        }

        const match = await bcrypt.compare(passwordActual, password_hash);
        if (!match) {
            return res.status(401).json({
                success: false,
                code:    'PASSWORD_INCORRECTO',
                message: 'La contraseña actual es incorrecta.'
            });
        }

        const misma = await bcrypt.compare(passwordNueva, password_hash);
        if (misma) {
            return res.status(400).json({
                success: false,
                message: 'La nueva contraseña debe ser diferente a la actual.'
            });
        }

        const nuevoHash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
        await db.query(
            'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
            [nuevoHash, id]
        );

        return res.json({ success: true, message: 'Contraseña actualizada correctamente.' });

    } catch (error) {
        console.error('❌ Error en PUT /api/auth/cambiar-password:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// =============================================
// AGREGAR AL FINAL DE routes/auth.js
// Justo antes de: module.exports = router;
// =============================================

const passport = require('../config/passport');

// -----------------------------------------------
// GET /api/auth/google
// Inicia el flujo OAuth — redirige a Google
// -----------------------------------------------
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false   // No usamos sesión de Passport, usamos JWT
    })
);

// -----------------------------------------------
// GET /api/auth/google/callback
// Google redirige aquí tras autenticación exitosa
// -----------------------------------------------
router.get('/google/callback',
    passport.authenticate('google', {
        session:      false,
        failureRedirect: `${process.env.FRONTEND_URL}/frontend/pages/registro.html?error=google_failed`
    }),
    (req, res) => {
        // req.user viene del strategy de Passport
        const token = generarToken(req.user);

        // Redirigimos al frontend con el token en la URL
        // El JS del frontend lo captura y lo guarda en localStorage
        res.redirect(
            `${process.env.FRONTEND_URL}/index.html?token=${token}&nombre=${encodeURIComponent(req.user.nombre)}&id=${req.user.id}`
        );
    }
);

// -----------------------------------------------
// POST /api/auth/crear-password
// PROTEGIDA — Para usuarios OAuth que quieren
// agregar una contraseña a su cuenta
// -----------------------------------------------
router.post('/crear-password', verifyToken, async (req, res) => {
    const id              = req.usuario.id;
    const { passwordNueva } = req.body;

    if (!passwordNueva) {
        return res.status(400).json({ success: false, message: 'La contraseña es obligatoria.' });
    }

    if (passwordNueva.length < 8) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    try {
        const result = await db.query(
            'SELECT password_hash FROM usuarios WHERE id = $1', [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        if (result.rows[0].password_hash) {
            return res.status(400).json({
                success: false,
                code:    'YA_TIENE_PASSWORD',
                message: 'Esta cuenta ya tiene contraseña. Usa cambiar-password en su lugar.'
            });
        }

        const nuevoHash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
        await db.query(
            'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
            [nuevoHash, id]
        );

        return res.json({ success: true, message: 'Contraseña creada correctamente. Ya puedes iniciar sesión con email y contraseña.' });

    } catch (error) {
        console.error('❌ Error en POST /api/auth/crear-password:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// =============================================
// AGREGAR AL FINAL DE routes/auth.js
// Debajo de las rutas de Google ya existentes
// Justo antes de: module.exports = router;
// =============================================

// -----------------------------------------------
// GET /api/auth/facebook
// Inicia el flujo OAuth — redirige a Facebook
// -----------------------------------------------
router.get('/facebook',
    passport.authenticate('facebook', {
        scope:   ['email'],   // Pedir email explícitamente
        session: false
    })
);

// -----------------------------------------------
// GET /api/auth/facebook/callback
// Facebook redirige aquí tras autenticación
// -----------------------------------------------
router.get('/facebook/callback',
    passport.authenticate('facebook', {
        session:         false,
        failureRedirect: `${process.env.FRONTEND_URL}/frontend/pages/registro.html?error=facebook_failed`
    }),
    (req, res) => {
        const token = generarToken(req.user);
        res.redirect(
            `${process.env.FRONTEND_URL}/index.html?token=${token}&nombre=${encodeURIComponent(req.user.nombre)}&id=${req.user.id}`
        );
    }
);

// =============================================
// AGREGAR AL FINAL DE routes/auth.js
// Antes de: module.exports = router;
// =============================================

const crypto                   = require('crypto');
const { enviarEmailResetPassword } = require('../config/mailer');


// -----------------------------------------------
// POST /api/auth/forgot-password
// Body: { email }
// Genera token y envía email de recuperación
// -----------------------------------------------
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'El email es obligatorio.'
        });
    }

    try {
        // Buscar usuario — respuesta genérica siempre para no revelar
        // si el email existe o no (seguridad)
        const result = await db.query(
            'SELECT id, nombre, email FROM usuarios WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        // Respuesta genérica aunque no exista el usuario
        if (result.rows.length === 0) {
            return res.json({
                success: true,
                message: 'Si ese correo está registrado, recibirás un enlace en breve.'
            });
        }

        const usuario = result.rows[0];

        // Invalidar tokens anteriores del usuario
        await db.query(
            'UPDATE password_reset_tokens SET usado = true WHERE usuario_id = $1 AND usado = false',
            [usuario.id]
        );

        // Generar token seguro
        const token    = crypto.randomBytes(32).toString('hex');
        const expiraEn = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

        await db.query(
            `INSERT INTO password_reset_tokens (usuario_id, token, expira_en)
             VALUES ($1, $2, $3)`,
            [usuario.id, token, expiraEn]
        );

        // Construir URL de reset
        const resetUrl = `${process.env.FRONTEND_URL}/frontend/pages/reset-password.html?token=${token}`;

        // Enviar email
        await enviarEmailResetPassword(usuario.email, usuario.nombre, resetUrl);

        return res.json({
            success: true,
            message: 'Si ese correo está registrado, recibirás un enlace en breve.'
        });

    } catch (error) {
        console.error('❌ Error en POST /api/auth/forgot-password:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
});


// -----------------------------------------------
// POST /api/auth/reset-password
// Body: { token, passwordNueva }
// Valida el token y actualiza la contraseña
// -----------------------------------------------
router.post('/reset-password', async (req, res) => {
    const { token, passwordNueva } = req.body;

    if (!token || !passwordNueva) {
        return res.status(400).json({
            success: false,
            message: 'Token y nueva contraseña son obligatorios.'
        });
    }

    if (passwordNueva.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'La contraseña debe tener al menos 8 caracteres.'
        });
    }

    try {
        // Buscar token válido, no usado y no expirado
        const result = await db.query(
            `SELECT prt.id, prt.usuario_id, u.email, u.nombre
             FROM password_reset_tokens prt
             JOIN usuarios u ON u.id = prt.usuario_id
             WHERE prt.token = $1
               AND prt.usado = false
               AND prt.expira_en > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                code:    'TOKEN_INVALIDO',
                message: 'El enlace no es válido o ya expiró. Solicita uno nuevo.'
            });
        }

        const { id: tokenId, usuario_id, nombre } = result.rows[0];

        // Hashear nueva contraseña
        const nuevoHash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);

        // Actualizar contraseña
        await db.query(
            'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
            [nuevoHash, usuario_id]
        );

        // Marcar token como usado
        await db.query(
            'UPDATE password_reset_tokens SET usado = true WHERE id = $1',
            [tokenId]
        );

        console.log(`✅ Contraseña reseteada para usuario ${usuario_id} (${nombre})`);

        return res.json({
            success: true,
            message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.'
        });

    } catch (error) {
        console.error('❌ Error en POST /api/auth/reset-password:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
});

module.exports = router;