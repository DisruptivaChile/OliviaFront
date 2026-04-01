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
    // --- LÓGICA DEL LOGIN MODAL ---
    const loginModal        = document.getElementById('loginModal');
    const userBtn           = document.getElementById('userBtn');
    const closeLogin        = document.getElementById('closeLogin');
    const loginModalOverlay = document.getElementById('loginModalOverlay');
    const loginTabs         = document.querySelectorAll('.login-tab');
    const loginForm         = document.getElementById('loginForm');
 
    if (userBtn && loginModal) {
        userBtn.addEventListener('click', () => {
            loginModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (mainNav) mainNav.classList.remove('active');
        });
    }
 
    function closeLoginModal() {
        if (!loginModal) return;
        loginModal.classList.remove('active');
        if (mainNav && !mainNav.classList.contains('active')) {
            document.body.style.overflow = 'auto';
        }
        // Limpiar errores al cerrar
        ocultarErrorLogin();
        if (loginForm) loginForm.reset();
    }
 
    if (closeLogin)        closeLogin.addEventListener('click', closeLoginModal);
    if (loginModalOverlay) loginModalOverlay.addEventListener('click', closeLoginModal);
 
    // Cambio de tabs — limpia el error al cambiar
    loginTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            loginTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            ocultarErrorLogin();
 
            const emailInput = document.getElementById('loginEmail');
            if (emailInput) {
                emailInput.placeholder = (tab.dataset.tab === 'admin')
                    ? 'admin@olivia.com'
                    : 'tu@email.com';
            }
        });
    });
 
    // ── Mostrar / ocultar error debajo del botón ──
    function mostrarErrorLogin(mensaje) {
        let errorEl = document.getElementById('loginErrorMsg');
 
        // Crear el elemento si no existe
        if (!errorEl) {
            errorEl = document.createElement('p');
            errorEl.id = 'loginErrorMsg';
            errorEl.style.cssText = `
                color: #c0392b;
                font-size: 0.82rem;
                font-weight: 500;
                text-align: center;
                margin-top: 0.6rem;
                padding: 0.5rem 0.75rem;
                background: #fdecea;
                border-radius: 6px;
                border: 1px solid #f5c6c2;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.4rem;
                animation: fadeIn 0.2s ease;
            `;
 
            // Insertarlo después del botón submit
            const submitBtn = loginForm.querySelector('.login-submit');
            if (submitBtn) submitBtn.insertAdjacentElement('afterend', errorEl);
            else loginForm.appendChild(errorEl);
        }
 
        errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
        errorEl.style.display = 'flex';
    }
 
    function ocultarErrorLogin() {
        const errorEl = document.getElementById('loginErrorMsg');
        if (errorEl) errorEl.style.display = 'none';
    }
 
    // ── Bloquear / desbloquear botón submit ──
    function setLoginLoading(loading) {
        const btn = loginForm.querySelector('.login-submit');
        if (!btn) return;
        if (loading) {
            btn.disabled = true;
            btn.dataset.originalText = btn.textContent;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        } else {
            btn.disabled = false;
            btn.textContent = btn.dataset.originalText || 'Iniciar Sesión';
        }
    }
 
    // ── Submit único y definitivo ──
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            ocultarErrorLogin();
 
            const email     = document.getElementById('loginEmail').value.trim();
            const password  = document.getElementById('loginPassword').value;
            const activeTab = document.querySelector('.login-tab.active')?.dataset.tab;
 
            // Validación básica antes de llamar al backend
            if (!email || !password) {
                mostrarErrorLogin('Por favor completa todos los campos.');
                return;
            }
 
            setLoginLoading(true);
 
            // ── TAB ADMIN ──
            if (activeTab === 'admin') {
                try {
                    const response = await fetch('http://localhost:3000/api/login', {
                        method:  'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body:    JSON.stringify({ email, password })
                    });
 
                    const data = await response.json();
 
                    if (data.success) {
                        sessionStorage.setItem('adminToken',   'active');
                        sessionStorage.setItem('adminName',    data.user.nombre);
                        sessionStorage.setItem('lastActivity', Date.now());
                        closeLoginModal();
                        window.location.href = '../pages/admin-panel.html';
                    } else {
                        mostrarErrorLogin('Credenciales incorrectas.');
                        setLoginLoading(false);
                    }
                } catch (err) {
                    console.error('Error login admin:', err);
                    mostrarErrorLogin('No se pudo conectar con el servidor.');
                    setLoginLoading(false);
                }
 
            // ── TAB USUARIO NORMAL ──
            } else {
                try {
                    const response = await fetch('http://localhost:3000/api/auth/login', {
                        method:  'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body:    JSON.stringify({ email, password })
                    });
 
                    const data = await response.json();
 
                    if (data.success) {
                        // Guardar sesión de usuario
                        sessionStorage.setItem('userToken',  data.token);
                        sessionStorage.setItem('userNombre', data.user.nombre);
                        sessionStorage.setItem('userId',     data.user.id);
 
                        closeLoginModal();
                        actualizarNavbarUsuario(data.user.nombre);
 
                    } else {
                        // Mensajes específicos según el código de error
                        if (data.code === 'LOGIN_SOCIAL') {
                            mostrarErrorLogin('Esta cuenta usa Google o Facebook. Inicia sesión con esa opción.');
                        } else {
                            mostrarErrorLogin('El correo o la contraseña son incorrectos.');
                        }
                        setLoginLoading(false);
                    }
                } catch (err) {
                    console.error('Error login usuario:', err);
                    mostrarErrorLogin('No se pudo conectar con el servidor.');
                    setLoginLoading(false);
                }
            }
        });
    }
 
    // ── Actualizar navbar al iniciar sesión ──
    // Cambia el ícono de usuario por el nombre + opción de perfil/cerrar sesión
    function actualizarNavbarUsuario(nombre) {
        const userBtn = document.getElementById('userBtn');
        if (!userBtn) return;
 
        userBtn.innerHTML = `<i class="fas fa-user-check"></i>`;
        userBtn.title = 'Ver perfil';
 
        // Al hacer click redirige al perfil en lugar de abrir el modal
        userBtn.replaceWith(userBtn.cloneNode(true)); // quitar listeners anteriores
        const newBtn = document.getElementById('userBtn');
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                window.location.href = '../pages/perfil.html';
            });
        }
    }
 
    // ── Al cargar la página, revisar si ya hay sesión activa ──
    const userToken  = sessionStorage.getItem('userToken');
    const userNombre = sessionStorage.getItem('userNombre');
    if (userToken && userNombre) {
        actualizarNavbarUsuario(userNombre);
    }
});