// =============================================
// backend/config/mailer.js
// Servicio de envío de emails con Nodemailer
// =============================================

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

// ── Verificar conexión al iniciar ──
transporter.verify((error) => {
    if (error) {
        console.error('❌ Error en configuración de email:', error.message);
    } else {
        console.log('✅ Servicio de email listo');
    }
});


// ── Template del email de recuperación ───────────────────────────────
function templateResetPassword(nombre, resetUrl) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
            <tr>
                <td align="center">
                    <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:4px;overflow:hidden;">

                        <!-- Header -->
                        <tr>
                            <td style="background:#1a1a1a;padding:36px 48px;text-align:center;">
                                <p style="margin:0;font-size:11px;letter-spacing:4px;color:#c9a96e;text-transform:uppercase;">Olivia Merino</p>
                                <h1 style="margin:8px 0 0;font-size:26px;font-weight:300;color:#ffffff;letter-spacing:2px;">OLIVIA MERINO</h1>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding:48px 48px 32px;">
                                <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">
                                    Hola <strong style="color:#1a1a1a;">${nombre}</strong>,
                                </p>
                                <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.6;">
                                    Recibimos una solicitud para restablecer la contraseña de tu cuenta en Olivia Merino.
                                </p>
                                <p style="margin:0 0 32px;font-size:15px;color:#555;line-height:1.6;">
                                    Haz clic en el botón para crear una nueva contraseña. Este enlace es válido por <strong>30 minutos</strong>.
                                </p>

                                <!-- CTA Button -->
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <a href="${resetUrl}"
                                               style="display:inline-block;background:#1a1a1a;color:#ffffff;
                                                      text-decoration:none;padding:14px 40px;
                                                      font-size:13px;letter-spacing:2px;text-transform:uppercase;
                                                      border-radius:2px;">
                                                Restablecer contraseña
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin:32px 0 0;font-size:13px;color:#999;line-height:1.6;">
                                    Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá siendo la misma.
                                </p>
                            </td>
                        </tr>

                        <!-- URL de respaldo -->
                        <tr>
                            <td style="padding:0 48px 32px;">
                                <p style="margin:0;font-size:12px;color:#bbb;">
                                    Si el botón no funciona, copia y pega este enlace en tu navegador:
                                </p>
                                <p style="margin:6px 0 0;font-size:12px;color:#c9a96e;word-break:break-all;">
                                    ${resetUrl}
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background:#f9f9f7;padding:24px 48px;border-top:1px solid #eee;text-align:center;">
                                <p style="margin:0;font-size:12px;color:#bbb;letter-spacing:1px;">
                                    © 2025 OLIVIA MERINO · Todos los derechos reservados
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}


// ── Función principal de envío ────────────────────────────────────────
async function enviarEmailResetPassword(destinatario, nombre, resetUrl) {
    const mailOptions = {
        from:    process.env.EMAIL_FROM || `"Olivia Merino" <${process.env.EMAIL_USER}>`,
        to:      destinatario,
        subject: 'Restablecer contraseña — Olivia Merino',
        html:    templateResetPassword(nombre, resetUrl),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de reset enviado a ${destinatario} [${info.messageId}]`);
    return info;
}

module.exports = { enviarEmailResetPassword };