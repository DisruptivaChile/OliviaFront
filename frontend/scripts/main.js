// ========================================
// OLIVIA MERINO - E-COMMERCE FUNCTIONALITY
// ========================================

// State Management
let products = [];
let cart = JSON.parse(localStorage.getItem('oliviaCart')) || [];
let filteredProducts = [];

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const cartModal = document.getElementById('cartModal');
const cartBtn = document.getElementById('cartBtn');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const totalAmount = document.getElementById('totalAmount');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const typeFilter = document.getElementById('typeFilter');
const priceFilter = document.getElementById('priceFilter');
const clearFilters = document.getElementById('clearFilters');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartUI();
    setupEventListeners();
    initPromoBanner();
});

// ========================================
// PROMOTIONAL BANNER SLIDER
// ========================================

function initPromoBanner() {
    const promoSlides = document.querySelectorAll('.promo-slide');
    let currentPromoSlide = 0;

    function showPromoSlide(index) {
        const previousSlide = currentPromoSlide;
        currentPromoSlide = (index + promoSlides.length) % promoSlides.length;
        
        // Remover clases de todas las slides
        promoSlides.forEach(slide => {
            slide.classList.remove('active', 'slide-out');
        });
        
        // Añadir clase slide-out a la anterior
        promoSlides[previousSlide].classList.add('slide-out');
        
        // Añadir clase active a la nueva
        promoSlides[currentPromoSlide].classList.add('active');
    }

    function nextPromoSlide() {
        showPromoSlide(currentPromoSlide + 1);
    }
    
    // Auto-deslizamiento cada 3 segundos
    if (promoSlides.length > 0) {
        setInterval(nextPromoSlide, 3000);
    }
}

// ========================================
// CONFIGURATION
// ========================================

// URL de la API - Cambiar según tu configuración
const API_URL = 'http://localhost:3000/api';
const USE_API = true; // Cambiar a false para usar products.json

// ========================================
// LOAD PRODUCTS
// ========================================

async function loadProducts() {
    try {
        let productsData;
        
        if (USE_API) {
            // Cargar desde la API
            const response = await fetch(`${API_URL}/products`);
            const data = await response.json();
            
            if (data.success) {
                productsData = transformApiProducts(data.products);
            } else {
                throw new Error('Error en la respuesta de la API');
            }
        } else {
            // Fallback: Cargar desde JSON local
            const response = await fetch('../../data/products.json');
            const data = await response.json();
            productsData = data.products;
        }
        
        products = { products: productsData };
        filteredProducts = productsData;
        displayProducts(filteredProducts);
        
    } catch (error) {
        console.error('Error loading products:', error);
        
        // Si falla la API, intentar con el JSON local
        if (USE_API) {
            console.log('Intentando cargar desde JSON local...');
            try {
                const response = await fetch('../../data/products.json');
                const data = await response.json();
                products = data;
                filteredProducts = data.products;
                displayProducts(filteredProducts);
                return;
            } catch (fallbackError) {
                console.error('Error en fallback:', fallbackError);
            }
        }
        
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light);">Error al cargar los artículos del catálogo. Por favor, recarga la página.</p>';
    }
}

// Transformar productos de la API al formato del frontend
function transformApiProducts(apiProducts) {
    return apiProducts.map(product => {
        // Obtener la imagen principal o la primera disponible
        const mainImage = product.imagenes.find(img => img.es_principal) || product.imagenes[0];
        const imageUrl = mainImage ? mainImage.url : '../assets/images/products/default.jpg';
        
        // Transformar tallas al formato esperado
        const sizes = product.tallas
            .filter(t => t.stock > 0)
            .map(t => t.talla);
        
        return {
            id: product.id,
            name: product.nombre,
            category: product.tipo,
            price: parseFloat(product.precio),
            image: imageUrl,
            description: product.descripcion,
            sizes: sizes,
            colors: ['default'], // Puedes expandir esto si agregas colores
            inStock: sizes.length > 0 || product.a_pedido,
            isNew: false, // Puedes agregar lógica basada en fecha de creación
            discount: 0 // Puedes agregar campo de descuento a la BD
        };
    });
}

// ========================================
// DISPLAY PRODUCTS
// ========================================

function displayProducts(productsToShow) {
    if (productsToShow.length === 0) {
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 3rem;">No se encontraron artículos con los filtros seleccionados.</p>';
        return;
    }

    productsGrid.innerHTML = productsToShow.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image" style="background-image: url('${product.image || 'https://res.cloudinary.com/dzi3s9oof/image/upload/v1770004161/image_h326qb.png'}'); background-size: cover; background-position: center;">
                ${product.new ? `<span class="product-badge">${typeof t === 'function' ? t('producto_nuevo') : 'NUEVO'}</span>` : ''}
            </div>
            <div class="product-info">
                <span class="product-category">${product.category} - ${product.type}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">€${product.price.toFixed(2)}</p>
                <div class="product-sizes">
                    ${product.sizes.slice(0, 5).map(size => `<span class="size-option">${size}</span>`).join('')}
                    ${product.sizes.length > 5 ? '<span class="size-option">...</span>' : ''}
                </div>
                <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i> ${typeof t === 'function' ? t('carrito_añadir') : 'Añadir al Carrito'}
                </button>
            </div>
        </div>
    `).join('');
}

// ========================================
// FILTER FUNCTIONS
// ========================================

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const type = typeFilter.value;
    const priceRange = priceFilter.value;

    filteredProducts = products.products.filter(product => {
        // Search filter
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                            product.description.toLowerCase().includes(searchTerm) ||
                            product.category.toLowerCase().includes(searchTerm);

        // Category filter
        const matchesCategory = category === 'all' || product.category === category;

        // Type filter
        const matchesType = type === 'all' || product.type === type;

        // Price filter
        let matchesPrice = true;
        if (priceRange !== 'all') {
            if (priceRange === '0-50') {
                matchesPrice = product.price <= 50;
            } else if (priceRange === '50-100') {
                matchesPrice = product.price > 50 && product.price <= 100;
            } else if (priceRange === '100-150') {
                matchesPrice = product.price > 100 && product.price <= 150;
            } else if (priceRange === '150+') {
                matchesPrice = product.price > 150;
            }
        }

        return matchesSearch && matchesCategory && matchesType && matchesPrice;
    });

    displayProducts(filteredProducts);
}

function resetFilters() {
    searchInput.value = '';
    categoryFilter.value = 'all';
    typeFilter.value = 'all';
    priceFilter.value = 'all';
    filteredProducts = products.products;
    displayProducts(filteredProducts);
}

// ========================================
// CART FUNCTIONS
// ========================================

function addToCart(productId) {
    const product = products.products.find(p => p.id === productId);
    
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            size: product.sizes[0] // Default to first size
        });
    }

    saveCart();
    updateCartUI();
    showNotification(`${product.name} añadido al carrito`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            updateCartUI();
        }
    }
}

function saveCart() {
    localStorage.setItem('oliviaCart', JSON.stringify(cart));
}

function updateCartUI() {
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Update cart items display
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="cart-empty"><i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i><p>Tu carrito está vacío</p></div>';
        totalAmount.textContent = '€0.00';
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <i class="fas fa-shoe-prints"></i>
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">€${item.price.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    <span style="margin-left: 0.5rem; color: var(--text-light);">Talla: ${item.size}</span>
                </div>
            </div>
            <button class="remove-item-btn" onclick="removeFromCart(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');

    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalAmount.textContent = `€${total.toFixed(2)}`;
}

function openCart() {
    cartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartModal() {
    cartModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Cart modal
    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (closeCart) closeCart.addEventListener('click', closeCartModal);
    
    if (cartModal) {
        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) {
                closeCartModal();
            }
        });
    }

    // Filters
    if (searchInput) searchInput.addEventListener('input', debounce(applyFilters, 300));
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);
    if (priceFilter) priceFilter.addEventListener('change', applyFilters);
    if (clearFilters) clearFilters.addEventListener('click', resetFilters);

    // Category cards and scroll slides
    document.querySelectorAll('.category-card, .editorial-panel, .scroll-card, .scroll-slide').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!card.getAttribute('href') || card.getAttribute('href') === '#products') {
                e.preventDefault();
                const category = card.dataset.category;
                const type = card.dataset.type;
                
                if (type) {
                    typeFilter.value = type;
                    categoryFilter.value = 'all';
                } else if (category) {
                    categoryFilter.value = category;
                    typeFilter.value = 'all';
                }
                
                applyFilters();
                
                // Smooth scroll to products
                document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Mobile menu (basic implementation)
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            const nav = document.querySelector('.nav');
            nav.style.display = nav.style.display === 'block' ? 'none' : 'block';
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC to close modal
        if (e.key === 'Escape' && cartModal.classList.contains('active')) {
            closeCartModal();
        }
    });
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--secondary-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: var(--shadow-hover);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    `;
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ========================================
// SMOOTH SCROLLING FOR NAVIGATION LINKS
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========================================
// SCROLL ANIMATIONS - REFINED
// ========================================

const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -80px 0px'
};

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '0';
            entry.target.style.animation = 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards';
            fadeObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements when they're available
setTimeout(() => {
    document.querySelectorAll('.product-card, .category-card, .feature-card, .value-item').forEach(el => {
        fadeObserver.observe(el);
    });
}, 300);

// ========================================
// NAVBAR - OVERLAY TO STICKY TRANSITION
// Premium smooth scrolling behavior
// ========================================

const header = document.getElementById('mainHeader');
const heroSection = document.querySelector('.hero');

/**
 * Maneja la transición del navbar de overlay transparente a sticky
 * - Estado inicial: Transparente con logo grande sobre el hero
 * - Estado scrolled: Fijo con fondo semiopaco, logo pequeño
 */
function handleNavbarScroll() {
    const scrollPosition = window.pageYOffset;
    const triggerPoint = 100; // Punto donde inicia la transición
    
    if (scrollPosition > triggerPoint) {
        // Activar estado sticky
        header.classList.add('scrolled');
    } else {
        // Mantener estado overlay
        header.classList.remove('scrolled');
    }
}

// Escuchar evento de scroll con optimización
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            handleNavbarScroll();
            ticking = false;
        });
        ticking = true;
    }
});

// Ejecutar al cargar la página
window.addEventListener('load', handleNavbarScroll);

// ========================================
// PARALLAX EFFECT FOR HERO
// ========================================

window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero-image');
    if (hero) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.5;
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// ========================================
// LAZY LOADING FOR IMAGES (when added)
// ========================================

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ========================================
// HERO SLIDER AUTO-PLAY
// ========================================

function initHeroSlider() {
    const heroSlider = document.querySelector('.hero-slider');
    if (!heroSlider) return;
    
    const slides = heroSlider.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;
    
    let currentSlide = 0;
    const slideInterval = 5000; // 5 segundos por slide
    
    function goToSlide(index) {
        currentSlide = index;
        const slideWidth = heroSlider.clientWidth;
        heroSlider.scrollTo({
            left: slideWidth * currentSlide,
            behavior: 'smooth'
        });
    }
    
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        goToSlide(currentSlide);
    }
    
    // Auto-play
    let autoplayInterval = setInterval(nextSlide, slideInterval);
    
    // Pausar auto-play cuando el usuario interactúa
    heroSlider.addEventListener('scroll', () => {
        clearInterval(autoplayInterval);
        autoplayInterval = setInterval(nextSlide, slideInterval);
    }, { passive: true });
    
    // Pausar en hover
    heroSlider.addEventListener('mouseenter', () => {
        clearInterval(autoplayInterval);
    });
    
    heroSlider.addEventListener('mouseleave', () => {
        autoplayInterval = setInterval(nextSlide, slideInterval);
    });
}

// Inicializar slider cuando se carga la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroSlider);
} else {
    initHeroSlider();
}

// ========================================
// INSTAGRAM BACKGROUND SLIDESHOW
// ========================================

function initInstagramSlideshow() {
    const slides = document.querySelectorAll('.instagram-bg-slide');
    if (slides.length <= 1) return;
    
    let currentSlide = 0;
    const slideInterval = 4000; // 4 segundos
    
    function nextSlide() {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }
    
    // Iniciar rotación automática
    setInterval(nextSlide, slideInterval);
}

// Inicializar slideshow de Instagram
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInstagramSlideshow);
} else {
    initInstagramSlideshow();
}
