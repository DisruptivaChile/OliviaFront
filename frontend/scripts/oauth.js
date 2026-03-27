// =============================================
// frontend/scripts/oauth.js
// Maneja el flujo OAuth Google en el frontend
// =============================================

const OAUTH_API_URL = 'http://localhost:3000/api';

// ── 1. Capturar token OAuth al volver de Google ───────────────────────
// Google redirige a: index.html?token=xxx&nombre=yyy&id=zzz
(function capturarTokenOAuth() {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const nombre = params.get('nombre');
    const id     = params.get('id');
    const error  = params.get('error');

    if (error) {
        console.warn('⚠️ OAuth falló:', error);
        limpiarURLParams();
        mostrarToastOAuth('No se pudo iniciar sesión con Google. Intenta de nuevo.', 'error');
        return;
    }

    if (token && nombre && id) {
        // Guardar con el mismo formato que usa index.js
        sessionStorage.setItem('userToken',  token);
        sessionStorage.setItem('userNombre', decodeURIComponent(nombre));
        sessionStorage.setItem('userId',     id);

        limpiarURLParams();

        // Actualizar navbar si la función existe (definida en index.js)
        if (typeof actualizarNavbarUsuario === 'function') {
            actualizarNavbarUsuario(decodeURIComponent(nombre));
        }

        mostrarToastOAuth('¡Bienvenido, ' + decodeURIComponent(nombre) + '!', 'success');
    }
})();


// ── 2. Conectar botón Google al flujo OAuth ───────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const btnGoogle = document.querySelector('.btn-google');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', () => {
            window.location.href = OAUTH_API_URL + '/auth/google';
        });
    }
});


// ── 3. Helpers ────────────────────────────────────────────────────────
function limpiarURLParams() {
    window.history.replaceState({}, document.title, window.location.pathname);
}

function mostrarToastOAuth(mensaje, tipo) {
    tipo = tipo || 'success';
    const toast = document.createElement('div');
    toast.textContent = mensaje;
    toast.style.cssText =
        'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);' +
        'background:' + (tipo === 'success' ? '#2d6a4f' : '#c0392b') + ';' +
        'color:white;padding:1rem 2rem;border-radius:8px;' +
        'font-family:Poppins,sans-serif;font-size:0.95rem;' +
        'z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);';
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 4000);
}