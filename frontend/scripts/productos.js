document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. VARIABLES Y MOTOR DE SEGURIDAD (Código Importante)
    // ==========================================
    const TIMEOUT_INACTIVITY = 3 * 60 * 1000; // 3 minutos

    function logout() {
        if (sessionStorage.getItem('adminToken')) {
            sessionStorage.clear();
            alert("Sesión cerrada por inactividad o cierre de pestaña.");
            window.location.href = 'index.html'; 
        }
    }

    function checkInactivity() {
        const lastActivity = sessionStorage.getItem('lastActivity');
        const token = sessionStorage.getItem('adminToken');

        if (token && lastActivity) {
            if (Date.now() - lastActivity > TIMEOUT_INACTIVITY) {
                logout();
            }
        }
    }

    function resetActivityTimer() {
        if (sessionStorage.getItem('adminToken')) {
            sessionStorage.setItem('lastActivity', Date.now());
        }
    }

    // Iniciar monitoreo
    setInterval(checkInactivity, 10000); 
    window.addEventListener('mousemove', resetActivityTimer);
    window.addEventListener('keypress', resetActivityTimer);
    window.addEventListener('click', resetActivityTimer);


    // ==========================================
    // 2. LÓGICA DEL MENÚ NAVEGACIÓN
    // ==========================================
    const mainNav = document.getElementById('mainNav');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');

    if (mobileMenuBtn && mainNav && closeMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            mainNav.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        closeMenuBtn.addEventListener('click', () => {
            mainNav.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }


    // ==========================================
    // 3. LÓGICA DEL LOGIN MODAL
    // ==========================================
    const loginModal = document.getElementById('loginModal');
    const userBtn = document.getElementById('userBtn');
    const closeLogin = document.getElementById('closeLogin');
    const loginModalOverlay = document.getElementById('loginModalOverlay');
    const loginTabs = document.querySelectorAll('.login-tab');
    const loginForm = document.getElementById('loginForm');

    if (userBtn && loginModal) {
        userBtn.addEventListener('click', () => {
            loginModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if(mainNav) mainNav.classList.remove('active');
        });
    }

    function closeLoginModal() {
        if (loginModal) {
            loginModal.classList.remove('active');
            // Solo devolvemos el scroll si el menú móvil no está abierto
            if (mainNav && !mainNav.classList.contains('active')) {
                document.body.style.overflow = 'auto';
            }
        }
    }

    if (closeLogin) closeLogin.addEventListener('click', closeLoginModal);
    if (loginModalOverlay) loginModalOverlay.addEventListener('click', closeLoginModal);

    // Cambio de Tabs dinámico
    loginTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            loginTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
                    
            const tabType = tab.dataset.tab;
            const emailInput = document.getElementById('loginEmail');
            if (emailInput) {
                emailInput.placeholder = (tabType === 'admin') ? 'admin@olivia.com' : 'tu@email.com';
            }
        });
    });


    // ==========================================
    // 4. CONEXIÓN AL BACKEND (Código Importante)
    // ==========================================
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const activeTab = document.querySelector('.login-tab.active').dataset.tab;

            if (activeTab === 'admin') {
                try {
                    const response = await fetch('http://localhost:3000/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });

                    const data = await response.json();

                    if (data.success) {
                        // Guardar estado de sesión
                        sessionStorage.setItem('adminToken', 'active');
                        sessionStorage.setItem('adminName', data.user.nombre);
                        sessionStorage.setItem('lastActivity', Date.now());

                        alert(data.message);
                                
                        // Redirección al panel
                        window.location.href = 'admin-panel.html';
                        closeLoginModal();
                    } else {
                        alert(data.message);
                    }
                } catch (error) {
                    console.error('Error en la conexión:', error);
                    alert('Error: No se pudo conectar con el servidor backend');
                }
            } else {
                alert('La lógica para usuarios normales aún no está conectada.');
            }
        });
    }
});

// Submit form
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const activeTab = document.querySelector('.login-tab.active').dataset.tab;
        
        if (activeTab === 'admin') {
            if (email === 'admin@olivia.com' || email === 'olivia') {
                alert('Bienvenido Admin');
                closeLoginModal();
            } else {
                alert('Esperando conexión con el backend para validación de admin...');
            }
        } else {
            alert(`Login usuario: ${email}`);
            closeLoginModal();
        }
    });
}