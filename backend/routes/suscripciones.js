// =============================================
// backend/routes/suscripciones.js
// =============================================

const express  = require('express');
const router   = express.Router();
const db       = require('../config/database');
const { enviarEmailResetPassword } = require('../config/mailer');
const verifyAdminToken = require('../middleware/verifyAdminToken');


// ── Template email de bienvenida ──────────────────────────────────────
function templateBienvenida(email) {
    const cancelUrl = `http://localhost:3000/api/suscripciones/cancelar?email=${encodeURIComponent(email)}`;
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
            <tr><td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:4px;overflow:hidden;">
                    <tr>
                        <td style="background:#1a1a1a;padding:36px 48px;text-align:center;">
                            <p style="margin:0;font-size:11px;letter-spacing:4px;color:#c9a96e;text-transform:uppercase;">Olivia Merino</p>
                            <h1 style="margin:8px 0 0;font-size:26px;font-weight:300;color:#fff;letter-spacing:2px;">OLIVIA MERINO</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:48px 48px 32px;">
                            <h2 style="font-size:22px;font-weight:300;color:#1a1a1a;margin:0 0 20px;">¡Gracias por suscribirte!</h2>
                            <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 16px;">
                                Ya eres parte de nuestra comunidad. Serás el primero en enterarte de:
                            </p>
                            <ul style="font-size:15px;color:#555;line-height:1.8;padding-left:20px;margin:0 0 32px;">
                                <li>Nuevas colecciones y lanzamientos</li>
                                <li>Descuentos y promociones exclusivas</li>
                                <li>Historias detrás de cada diseño</li>
                            </ul>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr><td align="center">
                                    <a href="${process.env.FRONTEND_URL}"
                                       style="display:inline-block;background:#1a1a1a;color:#fff;
                                              text-decoration:none;padding:14px 40px;
                                              font-size:13px;letter-spacing:2px;text-transform:uppercase;border-radius:2px;">
                                        Ver colección
                                    </a>
                                </td></tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f9f9f7;padding:20px 48px;border-top:1px solid #eee;text-align:center;">
                            <p style="margin:0;font-size:11px;color:#bbb;">
                                © 2025 OLIVIA MERINO · 
                                <a href="${cancelUrl}" style="color:#bbb;">Cancelar suscripción</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td></tr>
        </table>
    </body>
    </html>`;
}

// ── Template newsletter manual ────────────────────────────────────────
function templateNewsletter(asunto, contenido, email) {
    const cancelUrl = `http://localhost:3000/api/suscripciones/cancelar?email=${encodeURIComponent(email)}`;
    // Convertir saltos de línea en párrafos HTML
    const contenidoHtml = contenido
        .split('\n')
        .filter(l => l.trim())
        .map(l => `<p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 12px;">${l}</p>`)
        .join('');

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
            <tr><td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:4px;overflow:hidden;">
                    <tr>
                        <td style="background:#1a1a1a;padding:36px 48px;text-align:center;">
                            <p style="margin:0;font-size:11px;letter-spacing:4px;color:#c9a96e;text-transform:uppercase;">Olivia Merino</p>
                            <h1 style="margin:8px 0 0;font-size:26px;font-weight:300;color:#fff;letter-spacing:2px;">OLIVIA MERINO</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:48px 48px 32px;">
                            <h2 style="font-size:20px;font-weight:400;color:#1a1a1a;margin:0 0 24px;">${asunto}</h2>
                            ${contenidoHtml}
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                                <tr><td align="center">
                                    <a href="${process.env.FRONTEND_URL}"
                                       style="display:inline-block;background:#1a1a1a;color:#fff;
                                              text-decoration:none;padding:14px 40px;
                                              font-size:13px;letter-spacing:2px;text-transform:uppercase;border-radius:2px;">
                                        Visitar tienda
                                    </a>
                                </td></tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f9f9f7;padding:20px 48px;border-top:1px solid #eee;text-align:center;">
                            <p style="margin:0;font-size:11px;color:#bbb;">
                                © 2025 OLIVIA MERINO · 
                                <a href="${cancelUrl}" style="color:#bbb;">Cancelar suscripción</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td></tr>
        </table>
    </body>
    </html>`;
}


// -----------------------------------------------
// POST /api/suscripciones
// Suscribe un email y envía bienvenida
// -----------------------------------------------
router.post('/', async (req, res) => {
    const { email, nombre, apellido, genero } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'El email es obligatorio.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'El correo electrónico no es válido.' });
    }

    try {
        const existe = await db.query(
            'SELECT id, activo FROM suscriptores_email WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (existe.rows.length > 0) {
            if (!existe.rows[0].activo) {
                // Reactivar y actualizar datos opcionales si vienen
                await db.query(
                    `UPDATE suscriptores_email
                     SET activo   = true,
                         nombre   = COALESCE($2, nombre),
                         apellido = COALESCE($3, apellido),
                         genero   = COALESCE($4, genero)
                     WHERE id = $1`,
                    [existe.rows[0].id, nombre || null, apellido || null, genero || null]
                );
                enviarBienvenida(email).catch(err =>
                    console.error('❌ Error enviando bienvenida (reactivado):', err.message)
                );
                return res.json({ success: true, message: '¡Bienvenido de vuelta! Tu suscripción ha sido reactivada.' });
            }
            return res.status(409).json({ success: false, code: 'YA_SUSCRITO', message: 'Este correo ya está suscrito.' });
        }

        // Insertar con campos opcionales
        await db.query(
            `INSERT INTO suscriptores_email (email, nombre, apellido, genero)
             VALUES ($1, $2, $3, $4)`,
            [
                email.toLowerCase().trim(),
                nombre   ? nombre.trim()   : null,
                apellido ? apellido.trim() : null,
                genero   || null
            ]
        );

        enviarBienvenida(email).catch(err =>
            console.error('❌ Error enviando bienvenida:', err.message)
        );

        return res.status(201).json({
            success: true,
            message: '¡Gracias por suscribirte! Pronto recibirás nuestras novedades.'
        });

    } catch (error) {
        console.error('❌ Error en POST /api/suscripciones:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

async function enviarBienvenida(email) {
    const transporter = require('../config/mailer').transporter ||
                        require('../config/mailer');

    // Reutilizamos el transporter de mailer.js directamente
    const nodemailer = require('nodemailer');
    const t = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await t.sendMail({
        from:    process.env.EMAIL_FROM || `"Olivia Merino" <${process.env.EMAIL_USER}>`,
        to:      email,
        subject: '¡Bienvenida a Olivia Merino! 🎉',
        html:    templateBienvenida(email)
    });

    console.log(`✅ Email de bienvenida enviado a ${email}`);
}


// -----------------------------------------------
// GET /api/suscripciones/stats
// PROTEGIDA (admin) — total de suscriptores activos
// -----------------------------------------------
router.get('/stats', verifyAdminToken, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT COUNT(*) AS total FROM suscriptores_email WHERE activo = true'
        );
        return res.json({ success: true, total: parseInt(result.rows[0].total) });
    } catch (error) {
        console.error('❌ Error en GET /api/suscripciones/stats:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});


// -----------------------------------------------
// POST /api/suscripciones/enviar-newsletter
// PROTEGIDA (admin) — envío masivo
// Body: { asunto, contenido }
// -----------------------------------------------
router.post('/enviar-newsletter', verifyAdminToken, async (req, res) => {
    const { asunto, contenido } = req.body;

    if (!asunto || !contenido) {
        return res.status(400).json({ success: false, message: 'Asunto y contenido son obligatorios.' });
    }

    try {
        const result = await db.query(
            'SELECT email FROM suscriptores_email WHERE activo = true'
        );

        const suscriptores = result.rows.map(r => r.email);

        if (suscriptores.length === 0) {
            return res.json({ success: true, enviados: 0, fallidos: 0, message: 'No hay suscriptores activos.' });
        }

        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        let enviados = 0;
        let fallidos = 0;

        // Envío secuencial para no saturar Gmail
        for (const email of suscriptores) {
            try {
                await transporter.sendMail({
                    from:    process.env.EMAIL_FROM || `"Olivia Merino" <${process.env.EMAIL_USER}>`,
                    to:      email,
                    subject: asunto,
                    html:    templateNewsletter(asunto, contenido, email)
                });
                enviados++;
                // Pequeña pausa entre emails para evitar límites de Gmail
                await new Promise(r => setTimeout(r, 300));
            } catch (err) {
                console.error(`❌ Fallo al enviar a ${email}:`, err.message);
                fallidos++;
            }
        }

        console.log(`✅ Newsletter enviado: ${enviados} OK, ${fallidos} fallidos`);

        return res.json({
            success:  true,
            enviados,
            fallidos,
            message:  `Newsletter enviado a ${enviados} suscriptor(es).`
        });

    } catch (error) {
        console.error('❌ Error en POST /api/suscripciones/enviar-newsletter:', error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});


// -----------------------------------------------
// GET /api/suscripciones/cancelar?email=xxx
// Pública — desde el link del email
// -----------------------------------------------
router.get('/cancelar', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).send(`
            <html><body style="font-family:sans-serif;text-align:center;padding:3rem;">
                <h2>Enlace inválido</h2><p>El enlace no contiene un correo válido.</p>
            </body></html>`);
    }

    try {
        const result = await db.query(
            'UPDATE suscriptores_email SET activo = false WHERE email = $1 AND activo = true RETURNING id',
            [email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
            return res.send(`
                <html><body style="font-family:sans-serif;text-align:center;padding:3rem;color:#555;">
                    <h2 style="color:#1a1a1a;">Sin cambios</h2>
                    <p>Este correo ya no estaba suscrito a nuestro newsletter.</p>
                </body></html>`);
        }

        return res.send(`
            <html><body style="font-family:sans-serif;text-align:center;padding:3rem;color:#555;">
                <h2 style="color:#1a1a1a;">Suscripción cancelada</h2>
                <p>Tu correo <strong>${email}</strong> ha sido eliminado de nuestra lista.</p>
                <p style="font-size:0.9rem;margin-top:2rem;">
                    Si fue un error, puedes volverte a suscribir desde nuestra tienda.
                </p>
            </body></html>`);

    } catch (error) {
        console.error('❌ Error en GET /api/suscripciones/cancelar:', error);
        return res.status(500).send(`
            <html><body style="font-family:sans-serif;text-align:center;padding:3rem;">
                <h2>Error</h2><p>Ocurrió un error. Por favor intenta más tarde.</p>
            </body></html>`);
    }
});

module.exports = router;