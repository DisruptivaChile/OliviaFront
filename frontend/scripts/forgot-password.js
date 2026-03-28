// =============================================
// AGREGAR AL FINAL DE frontend/scripts/index.js
// Maneja el modal "¿Olvidaste tu contraseña?"
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    var forgotLink = document.querySelector('.forgot-link');
    if (!forgotLink) return;

    forgotLink.addEventListener('click', function(e) {
        e.preventDefault();
        mostrarModalForgot();
    });
});

function mostrarModalForgot() {
    // Crear modal dinámico
    var overlay = document.createElement('div');
    overlay.id = 'forgotOverlay';
    overlay.style.cssText =
        'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9000;' +
        'display:flex;align-items:center;justify-content:center;padding:1rem;';

    overlay.innerHTML = `
        <div style="background:#fff;border-radius:4px;padding:2.5rem;width:100%;max-width:420px;position:relative;">
            <button id="closeForgot" style="position:absolute;top:1rem;right:1rem;background:none;border:none;font-size:1.2rem;cursor:pointer;color:#888;">
                <i class="fas fa-times"></i>
            </button>

            <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;font-weight:400;color:#1a1a1a;margin:0 0 0.5rem;">
                Recuperar contraseña
            </h2>
            <p style="font-size:0.88rem;color:#888;margin:0 0 1.5rem;line-height:1.6;">
                Escribe tu correo y te enviaremos un enlace para crear una nueva contraseña.
            </p>

            <div style="margin-bottom:1rem;">
                <label style="display:block;font-size:0.82rem;font-weight:500;color:#444;margin-bottom:0.4rem;">
                    <i class="fas fa-envelope" style="margin-right:6px;color:#c9a96e;"></i>Correo electrónico
                </label>
                <input type="email" id="forgotEmail" placeholder="tu@email.com"
                    style="width:100%;padding:0.75rem 1rem;border:1px solid #ddd;border-radius:3px;
                           font-size:0.9rem;font-family:inherit;box-sizing:border-box;outline:none;">
            </div>

            <p id="forgotError" style="display:none;color:#c0392b;font-size:0.82rem;margin:0 0 1rem;
                padding:0.5rem 0.75rem;background:#fdecea;border-radius:4px;border:1px solid #f5c6c2;"></p>

            <p id="forgotSuccess" style="display:none;color:#2d6a4f;font-size:0.85rem;margin:0 0 1rem;
                padding:0.75rem;background:#edf7f1;border-radius:4px;border:1px solid #b7dfc8;
                line-height:1.5;"></p>

            <button id="forgotSubmit"
                style="width:100%;padding:0.85rem;background:#1a1a1a;color:#fff;border:none;
                       border-radius:3px;font-size:0.82rem;letter-spacing:2px;text-transform:uppercase;
                       cursor:pointer;font-family:inherit;">
                Enviar enlace
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    // Cerrar
    document.getElementById('closeForgot').addEventListener('click', function() {
        overlay.remove();
    });
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });

    // Submit
    document.getElementById('forgotSubmit').addEventListener('click', async function() {
        var email      = document.getElementById('forgotEmail').value.trim();
        var errorEl    = document.getElementById('forgotError');
        var successEl  = document.getElementById('forgotSuccess');
        var btn        = document.getElementById('forgotSubmit');

        errorEl.style.display   = 'none';
        successEl.style.display = 'none';

        if (!email) {
            errorEl.textContent    = 'Por favor ingresa tu correo electrónico.';
            errorEl.style.display  = 'block';
            return;
        }

        btn.disabled     = true;
        btn.textContent  = 'Enviando...';

        try {
            var res  = await fetch('http://localhost:3000/api/auth/forgot-password', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ email: email })
            });

            var data = await res.json();

            if (data.success) {
                successEl.textContent  = 'Si ese correo está registrado, recibirás un enlace en tu bandeja de entrada en los próximos minutos.';
                successEl.style.display = 'block';
                btn.textContent = 'Enviado ✓';
            } else {
                errorEl.textContent   = data.message || 'Ocurrió un error. Intenta de nuevo.';
                errorEl.style.display = 'block';
                btn.disabled    = false;
                btn.textContent = 'Enviar enlace';
            }

        } catch (err) {
            console.error('Error forgot password:', err);
            errorEl.textContent   = 'No se pudo conectar con el servidor.';
            errorEl.style.display = 'block';
            btn.disabled    = false;
            btn.textContent = 'Enviar enlace';
        }
    });

    // Focus automático
    setTimeout(function() {
        var input = document.getElementById('forgotEmail');
        if (input) input.focus();
    }, 100);
}