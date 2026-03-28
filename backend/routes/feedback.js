// =============================================
// backend/routes/feedback.js
// =============================================

const express     = require('express');
const router      = express.Router();
const db          = require('../config/database');
const verifyToken = require('../middleware/verifyToken');

// -----------------------------------------------
// POST /api/feedback
// PROTEGIDA — solo usuarios con sesión activa
// Body: {
//   puntuacion_recomendacion,
//   claridad_especificaciones,
//   facilidad_info_tienda,
//   comentarios_adicionales,
//   dispositivo
// }
// -----------------------------------------------
router.post('/', verifyToken, async (req, res) => {
    const usuario_id = req.usuario.id;

    const {
        puntuacion_recomendacion,
        claridad_especificaciones,
        facilidad_info_tienda,
        comentarios_adicionales,
        dispositivo
    } = req.body;

    // ── Validaciones ──
    if (puntuacion_recomendacion === undefined || puntuacion_recomendacion === null) {
        return res.status(400).json({
            success: false,
            message: 'La puntuación de recomendación es obligatoria.'
        });
    }

    const puntuacion = parseInt(puntuacion_recomendacion);
    if (isNaN(puntuacion) || puntuacion < 0 || puntuacion > 10) {
        return res.status(400).json({
            success: false,
            message: 'La puntuación debe ser un número entre 0 y 10.'
        });
    }

    const claridades_validas = ['claras', 'no-claras', 'no-sabia', 'no-aplica'];
    if (!claridad_especificaciones || !claridades_validas.includes(claridad_especificaciones)) {
        return res.status(400).json({
            success: false,
            message: 'Selecciona una opción válida para claridad de especificaciones.'
        });
    }

    const facilidades_validas = ['facil', 'dificil', 'no-encontre', 'no-aplica'];
    if (!facilidad_info_tienda || !facilidades_validas.includes(facilidad_info_tienda)) {
        return res.status(400).json({
            success: false,
            message: 'Selecciona una opción válida para facilidad de información.'
        });
    }

    const dispositivos_validos = ['mobile', 'tablet', 'desktop'];
    const dispositivoFinal = dispositivos_validos.includes(dispositivo) ? dispositivo : 'desktop';

    try {
        await db.query(
            `INSERT INTO feedback (
                usuario_id,
                puntuacion_recomendacion,
                claridad_especificaciones,
                facilidad_info_tienda,
                comentarios_adicionales,
                dispositivo
             ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                usuario_id,
                puntuacion,
                claridad_especificaciones,
                facilidad_info_tienda,
                comentarios_adicionales || null,
                dispositivoFinal
            ]
        );

        return res.status(201).json({
            success: true,
            message: '¡Gracias por tu feedback! Tu opinión nos ayuda a mejorar.'
        });

    } catch (error) {
        console.error('❌ Error en POST /api/feedback:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
});

module.exports = router;