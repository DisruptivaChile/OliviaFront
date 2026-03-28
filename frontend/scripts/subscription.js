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

// ── Apertura y cierre del pop-up modal ───────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    const giftFloatBtn         = document.getElementById('giftFloatBtn');
    const subscriptionModal    = document.getElementById('subscriptionModal');
    const subscriptionOverlay  = document.getElementById('subscriptionModalOverlay');
    const closeSubscriptionBtn = document.getElementById('closeSubscriptionBtn');

    function abrirModal() {
        if (!subscriptionModal) return;
        subscriptionModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function cerrarModal() {
        if (!subscriptionModal) return;
        subscriptionModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (giftFloatBtn)         giftFloatBtn.addEventListener('click', abrirModal);
    if (closeSubscriptionBtn) closeSubscriptionBtn.addEventListener('click', cerrarModal);
    if (subscriptionOverlay)  subscriptionOverlay.addEventListener('click', cerrarModal);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && subscriptionModal?.classList.contains('active')) {
            cerrarModal();
        }
    });
    
});

// ── Envío del formulario del pop-up modal ─────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    const subscriptionForm = document.getElementById('subscriptionForm');
    if (!subscriptionForm) return;

    subscriptionForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const nombre   = subscriptionForm.querySelector('input[placeholder="Nombres"]')?.value.trim()   || null;
        const apellido = subscriptionForm.querySelector('input[placeholder="Apellidos"]')?.value.trim() || null;
        const email    = subscriptionForm.querySelector('input[type="email"]')?.value.trim()            || '';
        const genero   = subscriptionForm.querySelector('.subscription-select')?.value                  || null;
        const acepto   = subscriptionForm.querySelector('input[type="checkbox"]')?.checked;
        const btnEnviar = subscriptionForm.querySelector('.subscription-submit-btn');

        // Limpiar error anterior
        const errorExistente = subscriptionForm.querySelector('.subscription-error');
        if (errorExistente) errorExistente.remove();

        if (!email) {
            mostrarErrorModal(subscriptionForm, 'El correo electrónico es obligatorio.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            mostrarErrorModal(subscriptionForm, 'Ingresa un correo electrónico válido.');
            return;
        }

        if (!acepto) {
            mostrarErrorModal(subscriptionForm, 'Debes aceptar las políticas de privacidad.');
            return;
        }

        const textoOriginal   = btnEnviar.textContent;
        btnEnviar.disabled    = true;
        btnEnviar.textContent = 'Enviando...';

        try {
            const res  = await fetch(SUSCRIPCION_API, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email, nombre, apellido, genero })
            });
            const data = await res.json();

            if (data.success || data.code === 'YA_SUSCRITO') {
                const modal = document.getElementById('subscriptionModal');
                if (modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
                subscriptionForm.reset();
                mostrarToastSuscripcion(
                    data.code === 'YA_SUSCRITO'
                        ? '¡Ya estás suscrito a nuestro newsletter!'
                        : '¡Gracias por suscribirte! Pronto recibirás nuestras novedades.',
                    data.code === 'YA_SUSCRITO' ? 'info' : 'success'
                );
            } else {
                mostrarErrorModal(subscriptionForm, data.message || 'Ocurrió un error. Intenta de nuevo.');
            }

        } catch (err) {
            console.error('❌ Error al suscribirse (modal):', err);
            mostrarErrorModal(subscriptionForm, 'No se pudo conectar con el servidor.');
        } finally {
            btnEnviar.disabled    = false;
            btnEnviar.textContent = textoOriginal;
        }
    });
});

function mostrarErrorModal(form, mensaje) {
    const err = document.createElement('p');
    err.className   = 'subscription-error';
    err.textContent = mensaje;
    err.style.cssText =
        'color:#c0392b;font-size:0.82rem;text-align:center;margin:0 0 0.75rem;' +
        'padding:0.5rem 0.75rem;background:#fdecea;border-radius:4px;' +
        'border:1px solid #f5c6c2;';
    const btn = form.querySelector('.subscription-submit-btn');
    if (btn) btn.insertAdjacentElement('beforebegin', err);
}

function mostrarToastSuscripcion(mensaje, tipo) {
    tipo = tipo || 'success';
    const colores = { success: '#2d6a4f', error: '#c0392b', info: '#856404' };
    const toast = document.createElement('div');
    toast.textContent = mensaje;
    toast.style.cssText =
        'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);' +
        'background:' + (colores[tipo] || colores.success) + ';' +
        'color:white;padding:1rem 2rem;border-radius:8px;' +
        'font-family:Poppins,sans-serif;font-size:0.9rem;' +
        'z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);' +
        'max-width:90%;text-align:center;';
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 4000);
}