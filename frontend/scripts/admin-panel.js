// PROTECCIÓN — redirige si no hay sesión activa
if (!sessionStorage.getItem('adminToken')) {
    window.location.href = '../../index.html';
}

// Mostrar el nombre del admin
document.getElementById('adminName').textContent = sessionStorage.getItem('adminName') || 'Administrador';

// Logout
document.getElementById('btnLogout').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = '../../index.html';
});

// --- MOTOR DE SEGURIDAD ---
const TIMEOUT_INACTIVITY = 3 * 60 * 1000;

function checkInactivity() {
    const lastActivity = sessionStorage.getItem('lastActivity');
    const token = sessionStorage.getItem('adminToken');

    if (token && lastActivity) {
        if (Date.now() - lastActivity > TIMEOUT_INACTIVITY) {
            sessionStorage.clear();
            window.location.href = '../../index.html';
        }
    }
}

function resetActivityTimer() {
    if (sessionStorage.getItem('adminToken')) {
        sessionStorage.setItem('lastActivity', Date.now());
    }
}

setInterval(checkInactivity, 5000);
window.addEventListener('mousemove', resetActivityTimer);
window.addEventListener('keypress', resetActivityTimer);
window.addEventListener('click', resetActivityTimer);