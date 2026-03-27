// =============================================
// backend/routes/auth.js
// Autenticación de usuarios normales
// Registro, login, sesión
// =============================================

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const db      = require('../config/database');

const SALT_ROUNDS = 12;


// -----------------------------------------------
// POST /api/auth/registro
// Crea un nuevo usuario
// Body: { nombre, apellido, email, password, genero? }
// -----------------------------------------------
router.post('/registro', async (req, res) => {
    const { nombre, apellido, email, password, genero } = req.body;

    // Validaciones básicas del servidor
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
        // Verificar si el email ya existe
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

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Insertar usuario
        const result = await db.query(
            `INSERT INTO usuarios (nombre, apellido, email, genero, password_hash)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, nombre, apellido, email, genero, fecha_creacion`,
            [
                nombre.trim(),
                apellido.trim(),
                email.toLowerCase().trim(),
                genero || null,
                passwordHash
            ]
        );

        const user = result.rows[0];

        // Token simple de sesión (en producción usar JWT)
        const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

        return res.status(201).json({
            success: true,
            message: 'Cuenta creada exitosamente.',
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
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
});


// -----------------------------------------------
// POST /api/auth/login
// Inicia sesión de usuario normal
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

        // Usuario OAuth sin contraseña
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

        const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

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
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
});


module.exports = router;