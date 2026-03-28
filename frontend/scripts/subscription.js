// =============================================
// frontend/scripts/subscription.js
// Conecta el input del footer con la BD
// =============================================

const SUSCRIPCION_API = 'http://localhost:3000/api/suscripciones';

document.addEventListener('DOMContentLoaded', function() {

    // ── Suscripción desde el footer ───────────────────────────────────
    // Seleccionamos la sección del newsletter en el footer
    const newsletterForms = document.querySelectorAll('.newsletter-form');

    newsletterForms.forEach(function(form) {
        const input = form.querySelector('.newsletter-input');
        const btn   = form.querySelector('.btn-primary');

        if (!input || !btn) return;

        btn.addEventListener('click', async function() {
            await enviarSuscripcion(input, btn);
        });

        // También al presionar Enter en el input
        input.addEventListener('keydown', async function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                await enviarSuscripcion(input, btn);
            }
        });
    });
});


async function enviarSuscripcion(input, btn) {
    const email = input.value.trim();

    // Limpiar estado anterior
    limpiarMensajeNewsletter(input);

    // Validación básica en frontend
    if (!email) {
        mostrarMensajeNewsletter(input, 'Por favor ingresa tu correo electrónico.', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mostrarMensajeNewsletter(input, 'Ingresa un correo electrónico válido.', 'error');
        return;
    }

    // Estado de carga
    const textoOriginal = btn.textContent;
    btn.disabled    = true;
    btn.textContent = 'Enviando...';

    try {
        const res  = await fetch(SUSCRIPCION_API, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email })
        });

        const data = await res.json();

        if (data.success) {
            mostrarMensajeNewsletter(input, data.message, 'success');
            input.value = '';
        } else if (data.code === 'YA_SUSCRITO') {
            mostrarMensajeNewsletter(input, 'Este correo ya está suscrito. ¡Gracias!', 'info');
        } else {
            mostrarMensajeNewsletter(input, data.message || 'Ocurrió un error. Intenta de nuevo.', 'error');
        }

    } catch (err) {
        console.error('❌ Error al suscribirse:', err);
        mostrarMensajeNewsletter(input, 'No se pudo conectar con el servidor.', 'error');
    } finally {
        btn.disabled    = false;
        btn.textContent = textoOriginal;
    }
}


// ── Helpers de mensajes ───────────────────────────────────────────────

function mostrarMensajeNewsletter(input, mensaje, tipo) {
    limpiarMensajeNewsletter(input);

    const colores = {
        success: { bg: '#edf7f1 !important', border: '#b7dfc8 !important', text: '#2d6a4f !important' },
        error:   { bg: '#fdecea !important', border: '#f5c6c2 !important', text: '#c0392b !important' },
        info:    { bg: '#fef9ec !important', border: '#f5e4a0 !important', text: '#856404 !important' }
    };

    const c = colores[tipo] || colores.info;

    const msg = document.createElement('p');
    msg.className = 'newsletter-msg';
    msg.textContent = mensaje;
    msg.style.cssText =
        'margin:8px 0 0;font-size:0.8rem;padding:0.5rem 0.75rem;border-radius:4px;' +
        'border:1px solid ' + c.border + ';' +
        'background:' + c.bg + ';' +
        'color:' + c.text + ';' +
        'line-height:1.4;';

    input.parentElement.appendChild(msg);

    // Auto-eliminar después de 5 segundos
    setTimeout(function() { msg.remove(); }, 5000);
}

function limpiarMensajeNewsletter(input) {
    var msg = input.parentElement.querySelector('.newsletter-msg');
    if (msg) msg.remove();
}
