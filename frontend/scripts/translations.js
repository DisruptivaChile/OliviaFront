// ========================================
// SISTEMA DE TRADUCCIÓN - OLIVIA MERINO
// ========================================

const translations = {
    es: {
        // Navegación
        nav_inicio: "Inicio",
        nav_productos: "Productos",
        nav_mujer: "Mujer",
        nav_hombre: "Hombre",
        nav_ofertas: "Ofertas",
        
        // Hero Section
        hero_nueva_coleccion: "Nueva Colección",
        hero_primavera_verano: "Primavera/Verano",
        hero_edicion_limitada: "Edición Limitada",
        hero_diseno_exclusivo: "Diseño Exclusivo",
        hero_btn_explorar: "Explorar Colección",
        hero_btn_ver: "Ver Ahora",
        
        // Slides
        slide_coleccion: "Colección",
        slide_mujer: "Mujer",
        slide_hombre: "Hombre",
        slide_productos: "Productos",
        slide_ofertas: "Ofertas",
        slide_elegancia_mujer: "Eleganacia atemporal para cada ocasión",
        slide_estilo_hombre: "Estilo refinado y sofisticado",
        
        // Productos
        productos_titulo: "Mundo Olivia",
        productos_subtitulo: "Encuentra el par perfecto para ti",
        
        // Filtros
        filtro_categoria: "Categoría:",
        filtro_todas: "Todas",
        filtro_tipo: "Tipo:",
        filtro_todos: "Todos",
        filtro_tacones: "Tacones",
        filtro_botas: "Botas",
        filtro_sandalias: "Sandalias",
        filtro_deportivos: "Deportivos",
        filtro_planos: "Planos",
        filtro_precio: "Precio:",
        filtro_limpiar: "Limpiar Filtros",
        
        // Historia/Servicios
        historia_titulo: "NUESTRA HISTORIA",
        historia_origen: "EL ORIGEN DE LAS IDEAS",
        historia_origen_desc: "Cada diseño nace de la inspiración cotidiana, viajes y momentos que capturan la esencia de la elegancia atemporal.",
        historia_cancion: "UNA CANCIÓN, UNA HISTORIA",
        historia_cancion_desc: "Detrás de cada zapato hay una melodía que inspiró su creación, convirtiendo cada par en una obra de arte única.",
        historia_nace: "NACE OLIVIA MERINO",
        historia_nace_desc: "La visión de crear calzado que fusiona tradición artesanal con diseño contemporáneo dio vida a nuestra marca.",
        historia_conoce: "CONOCE MÁS",
        
        // Página Mujer
        mujer_coleccion: "Colección",
        mujer_explorar: "Explorar Colección",
        mujer_categorias: "Categorías",
        mujer_zapatos: "Zapatos",
        mujer_sandalias: "Sandalias",
        mujer_botines: "Botines",
        mujer_destacados: "Productos Destacados",
        mujer_destacados_desc: "Lo mejor de nuestra colección femenina",
        mujer_statement_titulo: "Elegancia redefinida",
        mujer_statement_desc: "Cada zapato de nuestra colección femenina está diseñado para realzar tu estilo único, combinando comodidad excepcional con diseños sofisticados que te acompañan en cada momento especial de tu vida.",
        
        // Carrito
        carrito_titulo: "Mi Carrito",
        carrito_vacio: "Tu carrito está vacío",
        carrito_total: "Total:",
        carrito_finalizar: "Finalizar Compra",
        carrito_eliminar: "Eliminar",
        carrito_añadir: "Añadir al Carrito",
        producto_nuevo: "NUEVO",
        
        // Footer
        footer_titulo: "OLIVIA MERINO",
        footer_descripcion: "Tu destino para zapatos de calidad premium. Estilo, comodidad y elegancia en cada paso.",
        footer_cuenta: "Mi Cuenta",
        footer_pedidos: "Mis Pedidos",
        footer_lista_deseos: "Lista de Deseos",
        footer_perfil: "Mi Perfil",
        footer_ayuda: "Ayuda",
        footer_contacto: "Contacto",
        footer_envios: "Envíos",
        footer_devoluciones: "Devoluciones",
        footer_faq: "Preguntas Frecuentes",
        footer_politica: "Política de Privacidad",
        footer_legal: "Legal",
        footer_terminos: "Términos y Condiciones",
        footer_cookies: "Política de Cookies",
        footer_derechos: "© 2025 Olivia Merino. Todos los derechos reservados.",
    },
    en: {
        // Navigation
        nav_inicio: "Home",
        nav_productos: "Products",
        nav_mujer: "Women",
        nav_hombre: "Men",
        nav_ofertas: "Deals",
        
        // Hero Section
        hero_nueva_coleccion: "New Collection",
        hero_primavera_verano: "Spring/Summer",
        hero_edicion_limitada: "Limited Edition",
        hero_diseno_exclusivo: "Exclusive Design",
        hero_btn_explorar: "Explore Collection",
        hero_btn_ver: "View Now",
        
        // Slides
        slide_coleccion: "Collection",
        slide_mujer: "Women",
        slide_hombre: "Men",
        slide_productos: "Products",
        slide_ofertas: "Deals",
        slide_elegancia_mujer: "Timeless elegance for every occasion",
        slide_estilo_hombre: "Refined and sophisticated style",
        
        // Products
        productos_titulo: "Olivia's World",
        productos_subtitulo: "Find your perfect pair",
        
        // Filters
        filtro_categoria: "Category:",
        filtro_todas: "All",
        filtro_tipo: "Type:",
        filtro_todos: "All",
        filtro_tacones: "Heels",
        filtro_botas: "Boots",
        filtro_sandalias: "Sandals",
        filtro_deportivos: "Sneakers",
        filtro_planos: "Flats",
        filtro_precio: "Price:",
        filtro_limpiar: "Clear Filters",
        
        // History/Services
        historia_titulo: "OUR STORY",
        historia_origen: "THE ORIGIN OF IDEAS",
        historia_origen_desc: "Each design is born from everyday inspiration, travels and moments that capture the essence of timeless elegance.",
        historia_cancion: "A SONG, A STORY",
        historia_cancion_desc: "Behind each shoe there is a melody that inspired its creation, turning each pair into a unique work of art.",
        historia_nace: "OLIVIA MERINO IS BORN",
        historia_nace_desc: "The vision of creating footwear that fuses artisan tradition with contemporary design gave life to our brand.",
        historia_conoce: "LEARN MORE",
        
        // Women's Page
        mujer_coleccion: "Collection",
        mujer_explorar: "Explore Collection",
        mujer_categorias: "Categories",
        mujer_zapatos: "Shoes",
        mujer_sandalias: "Sandals",
        mujer_botines: "Booties",
        mujer_destacados: "Featured Products",
        mujer_destacados_desc: "The best of our women's collection",
        mujer_statement_titulo: "Redefined elegance",
        mujer_statement_desc: "Each shoe in our women's collection is designed to enhance your unique style, combining exceptional comfort with sophisticated designs that accompany you in every special moment of your life.",
        
        // Cart
        carrito_titulo: "My Cart",
        carrito_vacio: "Your cart is empty",
        carrito_total: "Total:",
        carrito_finalizar: "Checkout",
        carrito_eliminar: "Remove",
        carrito_añadir: "Add to Cart",
        producto_nuevo: "NEW",
        
        // Footer
        footer_titulo: "OLIVIA MERINO",
        footer_descripcion: "Your destination for premium quality shoes. Style, comfort and elegance in every step.",
        footer_cuenta: "My Account",
        footer_pedidos: "My Orders",
        footer_lista_deseos: "Wishlist",
        footer_perfil: "My Profile",
        footer_ayuda: "Help",
        footer_contacto: "Contact",
        footer_envios: "Shipping",
        footer_devoluciones: "Returns",
        footer_faq: "FAQ",
        footer_politica: "Privacy Policy",
        footer_legal: "Legal",
        footer_terminos: "Terms & Conditions",
        footer_cookies: "Cookie Policy",
        footer_derechos: "© 2025 Olivia Merino. All rights reserved.",
    }
};

// Idioma actual (por defecto español)
let currentLanguage = localStorage.getItem('oliviaLanguage') || 'es';

// Función para cambiar idioma
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('oliviaLanguage', lang);
    updatePageContent();
    updateActiveFlag();
    
    // Recargar productos si existen
    if (typeof displayProducts === 'function' && typeof filteredProducts !== 'undefined') {
        displayProducts(filteredProducts);
    }
}

// Función para actualizar contenido de la página
function updatePageContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLanguage][key]) {
            element.textContent = translations[currentLanguage][key];
        }
    });
}

// Función para actualizar bandera activa
function updateActiveFlag() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.lang-btn[data-lang="${currentLanguage}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Función helper para obtener traducción
function t(key) {
    return translations[currentLanguage][key] || key;
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    updatePageContent();
    updateActiveFlag();
    
    // Event listeners para botones de idioma
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            changeLanguage(lang);
        });
    });
});
