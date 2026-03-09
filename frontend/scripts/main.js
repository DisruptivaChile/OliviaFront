// =============================================
// frontend/scripts/main.js
//
// RESPONSABILIDADES DE ESTE ARCHIVO:
//   - Carrito de compras (estado + UI)
//   - Navbar / menú móvil
//   - Modales de info (Envíos, Devoluciones)
//   - Promo banner slider
//   - Hero slider
//   - Scroll animations
//   - Notificaciones
//
// LO QUE YA NO ESTÁ AQUÍ (movido a catalogoDatabase.js):
//   - loadProducts()
//   - displayProducts()
//   - applyFilters() / resetFilters()
// =============================================


// ========================================
// CARRITO — Estado global
// ========================================

let cart = JSON.parse(localStorage.getItem('oliviaCart')) || [];

const cartModal   = document.getElementById('cartModal');
const cartBtn     = document.getElementById('cartBtn');
const closeCart   = document.getElementById('closeCart');
const cartItems   = document.getElementById('cartItems');
const cartCount   = document.getElementById('cartCount');
const totalAmount = document.getElementById('totalAmount');


// Exponer globalmente para que catalogoDatabase.js pueda llamar addToCart
window.addToCart = function(productId, nombre, precio, talla) {
    const existingItem = cart.find(item => item.id === productId && item.talla === talla);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id: productId, nombre, precio, talla, quantity: 1 });
    }

    saveCart();
    updateCartUI();
    showNotification(`${nombre} añadido al carrito`);
};

function removeFromCart(productId, talla) {
    cart = cart.filter(item => !(item.id === productId && item.talla === talla));
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, talla, change) {
    const item = cart.find(item => item.id === productId && item.talla === talla);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        removeFromCart(productId, talla);
    } else {
        saveCart();
        updateCartUI();
    }
}

function saveCart() {
    localStorage.setItem('oliviaCart', JSON.stringify(cart));
}

function updateCartUI() {
    if (!cartCount) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-cart" style="font-size:3rem;margin-bottom:1rem;opacity:0.3;"></i>
                <p>Tu carrito está vacío</p>
            </div>`;
        if (totalAmount) totalAmount.textContent = '€0.00';
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.nombre}</div>
                <div class="cart-item-price">€${parseFloat(item.precio).toFixed(2)}</div>
                <div class="cart-item-meta">Talla: ${item.talla}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, '${item.talla}', -1)">−</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, '${item.talla}', 1)">+</button>
                </div>
            </div>
            <button class="remove-item-btn" onclick="removeFromCart(${item.id}, '${item.talla}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    if (totalAmount) totalAmount.textContent = `€${total.toFixed(2)}`;
}

function openCart() {
    if (cartModal) {
        cartModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeCartModal() {
    if (cartModal) {
        cartModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}


// ========================================
// PROMO BANNER SLIDER
// ========================================

function initPromoBanner() {
    const promoSlides = document.querySelectorAll('.promo-slide');
    if (promoSlides.length === 0) return;

    let current = 0;

    function showSlide(index) {
        const prev = current;
        current = (index + promoSlides.length) % promoSlides.length;
        promoSlides.forEach(s => s.classList.remove('active', 'slide-out'));
        promoSlides[prev].classList.add('slide-out');
        promoSlides[current].classList.add('active');
    }

    setInterval(() => showSlide(current + 1), 3000);
}


// ========================================
// HERO SLIDER
// ========================================

function initHeroSlider() {
    const heroSlider = document.querySelector('.hero-slider');
    if (!heroSlider) return;

    const slides = heroSlider.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;

    let current = 0;

    function goToSlide(index) {
        current = index;
        heroSlider.scrollTo({ left: heroSlider.clientWidth * current, behavior: 'smooth' });
    }

    let interval = setInterval(() => goToSlide((current + 1) % slides.length), 5000);

    heroSlider.addEventListener('mouseenter', () => clearInterval(interval));
    heroSlider.addEventListener('mouseleave', () => {
        interval = setInterval(() => goToSlide((current + 1) % slides.length), 5000);
    });
}


// ========================================
// NAVBAR — Menú móvil + scroll sticky
// ========================================

function initNavbar() {
    const header       = document.getElementById('mainHeader');
    const mainNav      = document.getElementById('mainNav');
    const mobileBtn    = document.getElementById('mobileMenuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');

    if (mobileBtn && mainNav) {
        mobileBtn.addEventListener('click', () => {
            mainNav.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeMenuBtn && mainNav) {
        closeMenuBtn.addEventListener('click', () => {
            mainNav.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    if (header) {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    header.classList.toggle('scrolled', window.pageYOffset > 100);
                    ticking = false;
                });
                ticking = true;
            }
        });
        window.addEventListener('load', () => {
            header.classList.toggle('scrolled', window.pageYOffset > 100);
        });
    }
}


// ========================================
// MODALES DE INFO (Envíos y Devoluciones)
// ========================================

function initInfoModals() {
    function openModal(modal)  { if (modal) { modal.classList.add('active');    document.body.style.overflow = 'hidden'; } }
    function closeModal(modal) { if (modal) { modal.classList.remove('active'); document.body.style.overflow = '';       } }

    const enviosModal       = document.getElementById('enviosModal');
    const devolucionesModal = document.getElementById('devolucionesModal');

    const pairs = [
        { openId: 'enviosBtn',       closeId: 'closeEnviosModal',      acceptId: 'acceptEnviosBtn',       modal: enviosModal       },
        { openId: 'devolucionesBtn', closeId: 'closeDevolucionesModal', acceptId: 'acceptDevolucionesBtn', modal: devolucionesModal  }
    ];

    pairs.forEach(({ openId, closeId, acceptId, modal }) => {
        const openBtn   = document.getElementById(openId);
        const closeBtn  = document.getElementById(closeId);
        const acceptBtn = document.getElementById(acceptId);
        const overlay   = modal ? modal.querySelector('.info-modal-overlay') : null;

        if (openBtn)   openBtn.addEventListener('click',   (e) => { e.preventDefault(); openModal(modal); });
        if (closeBtn)  closeBtn.addEventListener('click',  () => closeModal(modal));
        if (acceptBtn) acceptBtn.addEventListener('click', () => closeModal(modal));
        if (overlay)   overlay.addEventListener('click',   () => closeModal(modal));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            [enviosModal, devolucionesModal].forEach(m => {
                if (m && m.classList.contains('active')) closeModal(m);
            });
        }
    });
}


// ========================================
// SCROLL ANIMATIONS
// ========================================

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity    = '0';
                entry.target.style.animation = 'fadeInUp 0.8s cubic-bezier(0.4,0,0.2,1) forwards';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });

    // Delay para que catalogoDatabase.js tenga tiempo de renderizar tarjetas
    setTimeout(() => {
        document.querySelectorAll('.product-card, .category-card, .feature-card').forEach(el => {
            observer.observe(el);
        });
    }, 500);
}


// ========================================
// NOTIFICACIONES
// ========================================

function showNotification(message) {
    const n = document.createElement('div');
    n.style.cssText = `
        position:fixed; top:100px; right:20px;
        background:var(--secondary-color,#333); color:white;
        padding:1rem 1.5rem; border-radius:8px;
        box-shadow:0 4px 20px rgba(0,0,0,0.15);
        z-index:3000; animation:slideInRight 0.3s ease;
    `;
    n.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(n);
    setTimeout(() => {
        n.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => n.remove(), 300);
    }, 3000);
}

const notifStyle = document.createElement('style');
notifStyle.textContent = `
    @keyframes slideInRight  { from { transform:translateX(400px); opacity:0; } to { transform:translateX(0); opacity:1; } }
    @keyframes slideOutRight { from { transform:translateX(0); opacity:1; } to { transform:translateX(400px); opacity:0; } }
    @keyframes fadeInUp      { from { transform:translateY(30px); opacity:0; } to { transform:translateY(0); opacity:1; } }
`;
document.head.appendChild(notifStyle);


// ========================================
// INICIALIZACIÓN GENERAL
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    initPromoBanner();
    initHeroSlider();
    initNavbar();
    initInfoModals();
    initScrollAnimations();

    // Eventos del carrito
    if (cartBtn)   cartBtn.addEventListener('click', openCart);
    if (closeCart) closeCart.addEventListener('click', closeCartModal);
    if (cartModal) cartModal.addEventListener('click', (e) => { if (e.target === cartModal) closeCartModal(); });

    // ESC cierra el carrito
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cartModal && cartModal.classList.contains('active')) closeCartModal();
    });
});
