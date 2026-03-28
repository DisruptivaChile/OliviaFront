// =============================================
// frontend/scripts/feedback.js
// Feedback modal — solo usuarios con sesión
// Detecta dispositivo automáticamente
// =============================================

const FEEDBACK_API = 'http://localhost:3000/api/feedback';

// ── Detectar dispositivo ──────────────────────────────────────────────
function detectarDispositivo() {
    var w = window.innerWidth;
    if (w <= 768)  return 'mobile';
    if (w <= 1024) return 'tablet';
    return 'desktop';
}

// ── Verificar si el usuario tiene sesión activa ───────────────────────
function usuarioLogueado() {
    return !!sessionStorage.getItem('userToken');
}

document.addEventListener('DOMContentLoaded', function() {
    var contactFloatBtn  = document.getElementById('contactFloatBtn');
    var feedbackModal    = document.getElementById('feedbackModal');
    var feedbackCloseBtn = document.getElementById('feedbackCloseBtn');
    var ratingBtns       = document.querySelectorAll('.rating-btn');
    var feedbackSubmitBtn = document.querySelector('.feedback-submit-btn');

    // ── Abrir modal ───────────────────────────────────────────────────
    if (contactFloatBtn) {
        contactFloatBtn.addEventListener('click', function() {
            if (!usuarioLogueado()) {
                mostrarToastFeedback(
                    'Debes iniciar sesión para dejar tu feedback.',
                    'error'
                );
                return;
            }
            if (feedbackModal) feedbackModal.classList.add('active');
        });
    }

    // ── Cerrar modal ──────────────────────────────────────────────────
    if (feedbackCloseBtn) {
        feedbackCloseBtn.addEventListener('click', function() {
            feedbackModal.classList.remove('active');
        });
    }

    if (feedbackModal) {
        feedbackModal.addEventListener('click', function(e) {
            if (e.target === feedbackModal) feedbackModal.classList.remove('active');
        });
    }

    // ── Selección de rating ───────────────────────────────────────────
    ratingBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            ratingBtns.forEach(function(b) { b.classList.remove('selected'); });
            btn.classList.add('selected');
        });
    });

    // ── Enviar feedback ───────────────────────────────────────────────
    if (feedbackSubmitBtn) {
        feedbackSubmitBtn.addEventListener('click', async function() {
            // Doble chequeo de sesión al momento de enviar
            if (!usuarioLogueado()) {
                mostrarToastFeedback('Debes iniciar sesión para enviar feedback.', 'error');
                return;
            }

            var selectedRating        = document.querySelector('.rating-btn.selected');
            var selectedSpecification = document.querySelector('input[name="specifications"]:checked');
            var selectedStoreInfo     = document.querySelector('input[name="store-info"]:checked');
            var feedbackText          = document.querySelector('.feedback-textarea');

            // Validaciones con mensajes en el modal (sin alert)
            if (!selectedRating) {
                mostrarErrorFeedback('Por favor selecciona una puntuación.');
                return;
            }
            if (!selectedSpecification) {
                mostrarErrorFeedback('Por favor selecciona una opción de claridad en especificaciones.');
                return;
            }
            if (!selectedStoreInfo) {
                mostrarErrorFeedback('Por favor selecciona una opción de facilidad para encontrar información.');
                return;
            }

            // Construir payload
            var payload = {
                puntuacion_recomendacion: parseInt(selectedRating.dataset.value),
                claridad_especificaciones: selectedSpecification.value,
                facilidad_info_tienda:     selectedStoreInfo.value,
                comentarios_adicionales:   feedbackText ? feedbackText.value.trim() || null : null,
                dispositivo:               detectarDispositivo()
            };

            // Estado de carga
            feedbackSubmitBtn.disabled    = true;
            feedbackSubmitBtn.textContent = 'Enviando...';
            limpiarErrorFeedback();

            try {
                var token = sessionStorage.getItem('userToken');

                var res = await fetch(FEEDBACK_API, {
                    method:  'POST',
                    headers: {
                        'Content-Type':  'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(payload)
                });

                var data = await res.json();

                if (data.success) {
                    // Cerrar modal y mostrar toast de éxito
                    feedbackModal.classList.remove('active');
                    mostrarToastFeedback('¡Gracias por tu feedback! Tu opinión nos ayuda a mejorar.', 'success');
                    limpiarFormularioFeedback(ratingBtns, feedbackText);
                } else {
                    mostrarErrorFeedback(data.message || 'Ocurrió un error. Intenta de nuevo.');
                }

            } catch (err) {
                console.error('❌ Error al enviar feedback:', err);
                mostrarErrorFeedback('No se pudo conectar con el servidor.');
            } finally {
                feedbackSubmitBtn.disabled    = false;
                feedbackSubmitBtn.textContent = 'Enviar Feedback';
            }
        });
    }
});


// ── Helpers ───────────────────────────────────────────────────────────

function mostrarErrorFeedback(mensaje) {
    limpiarErrorFeedback();

    var submitBtn = document.querySelector('.feedback-submit-btn');
    if (!submitBtn) return;

    var errorEl = document.createElement('p');
    errorEl.id = 'feedbackErrorMsg';
    errorEl.textContent = mensaje;
    errorEl.style.cssText =
        'color:#c0392b;font-size:0.82rem;text-align:center;margin:0 0 0.75rem;' +
        'padding:0.5rem 0.75rem;background:#fdecea;border-radius:4px;' +
        'border:1px solid #f5c6c2;';

    submitBtn.insertAdjacentElement('beforebegin', errorEl);
}

function limpiarErrorFeedback() {
    var el = document.getElementById('feedbackErrorMsg');
    if (el) el.remove();
}

function limpiarFormularioFeedback(ratingBtns, textarea) {
    ratingBtns.forEach(function(b) { b.classList.remove('selected'); });
    document.querySelectorAll('input[name="specifications"]').forEach(function(r) { r.checked = false; });
    document.querySelectorAll('input[name="store-info"]').forEach(function(r) { r.checked = false; });
    if (textarea) textarea.value = '';
}

function mostrarToastFeedback(mensaje, tipo) {
    tipo = tipo || 'success';
    var toast = document.createElement('div');
    toast.textContent = mensaje;
    toast.style.cssText =
        'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);' +
        'background:' + (tipo === 'success' ? '#2d6a4f' : '#c0392b') + ';' +
        'color:white;padding:1rem 2rem;border-radius:8px;' +
        'font-family:Poppins,sans-serif;font-size:0.9rem;' +
        'z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);' +
        'max-width:90%;text-align:center;';
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 4000);
}