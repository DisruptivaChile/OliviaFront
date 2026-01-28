// Mostrar el nombre del admin guardado en el login
document.getElementById('adminName').textContent = sessionStorage.getItem('adminName') || 'Administrador';

// Lógica del botón de Logout
document.getElementById('btnLogout').addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = '../../index.html';
});
// --- MOTOR DE SEGURIDAD PARA EL PANEL ---
const TIMEOUT_INACTIVITY = 3 * 60 * 1000; // 3 minutos

function checkInactivity() {
    const lastActivity = sessionStorage.getItem('lastActivity');
    const token = sessionStorage.getItem('adminToken');

    if (token && lastActivity) {
        if (Date.now() - lastActivity > TIMEOUT_INACTIVITY) {
            sessionStorage.clear();
            alert("Sesión cerrada por inactividad.");
            window.location.href = '../../index.html'; 
        }
    }
}

function resetActivityTimer() {
    if (sessionStorage.getItem('adminToken')) {
        sessionStorage.setItem('lastActivity', Date.now());
    }
}

// Revisar cada 5 segundos
setInterval(checkInactivity, 5000); 

// Escuchar actividad en el panel
window.addEventListener('mousemove', resetActivityTimer);
window.addEventListener('keypress', resetActivityTimer);
window.addEventListener('click', resetActivityTimer);