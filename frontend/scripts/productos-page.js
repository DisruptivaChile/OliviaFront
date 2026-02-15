// Product Image Gallery
const thumbnails = document.querySelectorAll('.thumbnail');
const mainImage = document.getElementById('mainProductImage');

thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
        thumbnails.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        mainImage.src = thumb.src;
    });
});

// Size Selection
const sizeButtons = document.querySelectorAll('.size-btn');
sizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        sizeButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});

// Accordion
const accordionHeaders = document.querySelectorAll('.accordion-header');
accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        item.classList.toggle('active');
    });
});

(function(){
    var openBtn = document.getElementById('openReviewBtn');
    var modal = document.getElementById('reviewModal');
    var overlay = document.getElementById('reviewModalOverlay');
    var closeBtn = document.getElementById('closeReviewBtn');
    var cancelBtn = document.getElementById('cancelReviewBtn');
    var form = document.getElementById('reviewForm');
    var list = document.getElementById('reviewsList');

    function openModal(){ modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false'); }
    function closeModal(){ modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true'); }

    if(openBtn) openBtn.addEventListener('click', openModal);
    if(overlay) overlay.addEventListener('click', closeModal);
    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    if(cancelBtn) cancelBtn.addEventListener('click', closeModal);

    function starsVisual(n){ n = parseInt(n,10)||0; return '★'.repeat(n) + '☆'.repeat(5-n); }

    if(form){
        form.addEventListener('submit', function(e){
            e.preventDefault();
            var name = document.getElementById('reviewName').value.trim();
            var rating = form.rating.value;
            var text = document.getElementById('reviewText').value.trim();
            if(!name || !rating || !text) return;

            var article = document.createElement('article');
            article.className = 'review';
            article.innerHTML = '<div class="review-header"><div class="review-author">'+
                (name)+'</div><div class="review-rating">'+starsVisual(rating)+
                '</div></div><p class="review-text">'+(text)+'</p>';

            list.insertBefore(article, list.firstChild);
            form.reset();
            closeModal();
        });
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // --- VARIABLES DE SEGURIDAD (3 minutos) ---
    const TIMEOUT_INACTIVITY = 3 * 60 * 1000;

    /**
    * Función para cerrar sesión por inactividad o seguridad
    */
    function logout() {
        if (sessionStorage.getItem('adminToken')) {
            sessionStorage.clear();
            alert("Sesión cerrada por inactividad o cierre de pestaña.");
            window.location.href = 'index.html'; // Ajusta según tu ruta
        }
    }

    /**
    * Verifica si el tiempo de inactividad ha expirado
    */
    function checkInactivity() {
        const lastActivity = sessionStorage.getItem('lastActivity');
        const token = sessionStorage.getItem('adminToken');

        if (token && lastActivity) {
            if (Date.now() - lastActivity > TIMEOUT_INACTIVITY) {
                    logout();
                }
        }
    }

    /**
    * Actualiza el contador de actividad cada vez que el usuario interactúa
    */
    function resetActivityTimer() {
        if (sessionStorage.getItem('adminToken')) {
            sessionStorage.setItem('lastActivity', Date.now());
        }
    }

    // --- INICIAR MONITOREO DE ACTIVIDAD ---
    // Revisar cada 10 segundos si la sesión expiró
    setInterval(checkInactivity, 10000); 

    // Detectar movimientos o teclas para resetear el tiempo
    window.addEventListener('mousemove', resetActivityTimer);
    window.addEventListener('keypress', resetActivityTimer);
    window.addEventListener('click', resetActivityTimer);


    // --- LÓGICA DEL MENÚ NAVEGACIÓN ---
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

    // --- LÓGICA DEL LOGIN MODAL ---
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
        loginModal.classList.remove('active');
        if (mainNav && !mainNav.classList.contains('active')) {
            document.body.style.overflow = 'auto';
        }
    }

    if (closeLogin) closeLogin.addEventListener('click', closeLoginModal);
    if (loginModalOverlay) loginModalOverlay.addEventListener('click', closeLoginModal);

    // Cambio de Tabs
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
    // --- LÓGICA DE CONEXIÓN AL BACKEND ---
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
                        // 1. Iniciar sesión y establecer tiempo inicial
                        sessionStorage.setItem('adminToken', 'active');
                        sessionStorage.setItem('adminName', data.user.nombre);
                        sessionStorage.setItem('lastActivity', Date.now());

                        // --- ELIMINADO: alert(data.message) ---
                                
                        // 2. Redirección inmediata
                        window.location.href = 'admin-panel.html';
                        closeLoginModal();
                    } else {
                        // Si el login falla, simplemente no hacemos nada o imprimimos en consola
                        console.warn('Intento de login fallido:', data.message);
                    }
                } catch (error) {
                    // Error de red o servidor caído
                    console.error('Error en la conexión:', error);
                }
            } else {
                // Lógica para usuarios normales (silenciosa por ahora)
                console.log('Login de usuario normal intentado.');
            }
        });
    }
});