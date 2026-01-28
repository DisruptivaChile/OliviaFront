document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. SELECTORES GLOBALES
    // ==========================================
    const mainNav = document.getElementById('mainNav');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');
    
    const loginModal = document.getElementById('loginModal');
    const userBtn = document.getElementById('userBtn');
    const closeLogin = document.getElementById('closeLogin');
    const loginModalOverlay = document.getElementById('loginModalOverlay');
    const loginTabs = document.querySelectorAll('.login-tab');
    const loginForm = document.getElementById('loginForm');

    const categoryContainer = document.querySelector('#categorySlider');

    // ==========================================
    // 2. SEGURIDAD E INACTIVIDAD (Código Importante)
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

    // Monitoreo constante
    setInterval(checkInactivity, 10000); 
    window.addEventListener('mousemove', resetActivityTimer);
    window.addEventListener('keypress', resetActivityTimer);
    window.addEventListener('click', resetActivityTimer);

    // ==========================================
    // 3. LÓGICA DEL MENÚ NAVEGACIÓN
    // ==========================================
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
    // 4. LÓGICA DEL LOGIN MODAL & BACKEND
    // ==========================================
    if (userBtn && loginModal) {
        userBtn.addEventListener('click', () => {
            loginModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (mainNav) mainNav.classList.remove('active');
        });
    }

    const closeLoginModal = () => {
        if (loginModal) {
            loginModal.classList.remove('active');
            if (mainNav && !mainNav.classList.contains('active')) {
                document.body.style.overflow = 'auto';
            }
        }
    };

    if (closeLogin) closeLogin.addEventListener('click', closeLoginModal);
    if (loginModalOverlay) loginModalOverlay.addEventListener('click', closeLoginModal);

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

    // Envío del formulario al Backend (Código Importante)
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
                        sessionStorage.setItem('adminToken', 'active');
                        sessionStorage.setItem('adminName', data.user.nombre);
                        sessionStorage.setItem('lastActivity', Date.now());
                        alert(data.message);
                        window.location.href = 'admin-panel.html';
                        closeLoginModal();
                    } else {
                        alert(data.message);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error: No se pudo conectar con el servidor');
                }
            } else {
                alert('La lógica para usuarios normales aún no está conectada.');
            }
        });
    }

    // ==========================================
    // 5. LÓGICA DEL SLIDER DE CATEGORÍAS
    // ==========================================
    if (categoryContainer) {
        const catSlides = categoryContainer.querySelectorAll('.cat-slide');
        let currentCatIndex = 0;
        let isTransitioning = false;
        let autoPlayInterval;
        const AUTO_PLAY_TIME = 5000;

        function showCatSlide(index) {
            catSlides.forEach(slide => slide.classList.remove('active'));
            currentCatIndex = (index + catSlides.length) % catSlides.length;
            catSlides[currentCatIndex].classList.add('active');
        }

        function startAutoPlay() {
            stopAutoPlay();
            autoPlayInterval = setInterval(() => {
                showCatSlide(currentCatIndex + 1);
            }, AUTO_PLAY_TIME);
        }

        function stopAutoPlay() {
            if (autoPlayInterval) clearInterval(autoPlayInterval);
        }

        function resetTimer() {
            stopAutoPlay();
            startAutoPlay();
        }

        function triggerCooldown() {
            isTransitioning = true;
            setTimeout(() => { isTransitioning = false; }, 800);
        }

        categoryContainer.addEventListener('wheel', (e) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) return; 
            e.preventDefault();
            if (isTransitioning) return;
            
            if (Math.abs(e.deltaX) > 30) {
                if (e.deltaX > 0) showCatSlide(currentCatIndex + 1);
                else showCatSlide(currentCatIndex - 1);
                resetTimer();
                triggerCooldown();
            }
        }, { passive: false });

        let touchStartX = 0;
        let touchStartY = 0;

        categoryContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            stopAutoPlay();
        }, { passive: true });

        categoryContainer.addEventListener('touchend', (e) => {
            let touchEndX = e.changedTouches[0].screenX;
            let touchEndY = e.changedTouches[0].screenY;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;

            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) showCatSlide(currentCatIndex + 1);
                else showCatSlide(currentCatIndex - 1);
            }
            startAutoPlay();
        }, { passive: true });

        startAutoPlay();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.hero-slide');
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
        // Quitar clase activa de todos
        slides.forEach(slide => slide.classList.remove('active'));
        
        // Ajustar índice circular
        currentSlide = (index + slides.length) % slides.length;
        
        // Activar slide actual
        slides[currentSlide].classList.add('active');
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    // Eventos de flechas
    if(nextBtn) nextBtn.addEventListener('click', () => {
        nextSlide();
        resetTimer();
    });

    if(prevBtn) prevBtn.addEventListener('click', () => {
        prevSlide();
        resetTimer();
    });

    // Auto-reproducción (5 segundos)
    function startTimer() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    function resetTimer() {
        clearInterval(slideInterval);
        startTimer();
    }

    startTimer();
});

// Login Modal
const loginModal = document.getElementById('loginModal');
const userBtn = document.getElementById('userBtn');
const closeLogin = document.getElementById('closeLogin');
const loginModalOverlay = document.getElementById('loginModalOverlay');
const loginTabs = document.querySelectorAll('.login-tab');
const loginForm = document.getElementById('loginForm');

// Abrir modal
if (userBtn) {
    userBtn.addEventListener('click', () => {
        loginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

// Cerrar modal
function closeLoginModal() {
    loginModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

if (closeLogin) closeLogin.addEventListener('click', closeLoginModal);
if (loginModalOverlay) loginModalOverlay.addEventListener('click', closeLoginModal);

// Cambiar tabs
loginTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        loginTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const tabType = tab.dataset.tab;
        if (tabType === 'admin') {
            document.getElementById('loginEmail').placeholder = 'admin@olivia.com';
        } else {
            document.getElementById('loginEmail').placeholder = 'tu@email.com';
        }
    });
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

// Filtrar solo productos de mujer al cargar
document.addEventListener('DOMContentLoaded', () => {
    const interval = setInterval(() => {
        if (typeof products !== 'undefined' && products.products) {
            const mujerProducts = products.products.filter(p => p.category === 'mujer');
            displayProducts(mujerProducts);
            clearInterval(interval);
        }
    }, 100);
});