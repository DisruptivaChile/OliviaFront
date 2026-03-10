// =============================================
// frontend/scriptsDatabase/productoDatabase.js
// Carga dinámica de la página de detalle
// de un producto individual desde el backend
// =============================================

const API_URL = 'http://localhost:3000';

// -----------------------------------------------
// 1. LEER ID DE LA URL
// -----------------------------------------------
function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id     = parseInt(params.get('id'));
    return isNaN(id) ? null : id;
}

// -----------------------------------------------
// 2. CARGAR PRODUCTO DESDE EL BACKEND
// -----------------------------------------------
async function cargarProducto() {
    const id = getProductIdFromUrl();

    if (!id) {
        mostrarError('Producto no encontrado.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/products/${id}`);
        const data     = await response.json();

        if (!data.success || !data.product) {
            mostrarError('Este producto no está disponible.');
            return;
        }

        renderizarProducto(data.product);

    } catch (error) {
        console.error('❌ Error al cargar producto:', error);
        mostrarError('No se pudo conectar con el servidor.');
    }
}

// -----------------------------------------------
// 3. RENDERIZAR PRODUCTO EN EL HTML
// -----------------------------------------------
function renderizarProducto(p) {

    // --- Título de la pestaña del navegador ---
    document.title = `${p.nombre} - Olivia Merino`;

    // --- Título del producto ---
    const titulo = document.querySelector('.product-title');
    if (titulo) titulo.textContent = p.nombre;

    // --- Precio ---
    const precio = document.querySelector('.price-sale');
    if (precio) precio.textContent = formatearPrecio(p.precio);

    // --- Descripción ---
    const descripcion = document.querySelector('.product-description p');
    if (descripcion) descripcion.textContent = p.descripcion || '';

    // --- Materiales (accordion) ---
    const materiales = document.querySelector('.accordion-content p');
    if (materiales) materiales.textContent = p.materiales || 'Información no disponible.';

    // --- Imágenes ---
    renderizarImagenes(p.imagenes, p.imagen_principal, p.nombre);

    // --- Tallas con stock ---
    renderizarTallas(p.tallas, p.id, p.nombre, p.precio);

    // --- Historia ---
    const historiaTexto = document.querySelector('.history-card p');
    if (historiaTexto) historiaTexto.textContent = p.historia || '';

    // Ocultar sección historia si no hay contenido
    const historiaSeccion = document.querySelector('.history-section');
    if (historiaSeccion && !p.historia && !p.musica_url) {
        historiaSeccion.style.display = 'none';
    }

    // --- Música / Spotify ---
    renderizarMusica(p.musica_url);

    // --- Badge "A Pedido" si aplica ---
    if (p.es_a_pedido) {
        const badge = document.createElement('span');
        badge.className  = 'product-badge';
        badge.textContent = 'A PEDIDO';
        const titulo = document.querySelector('.product-title');
        if (titulo) titulo.insertAdjacentElement('beforebegin', badge);
    }
}

// -----------------------------------------------
// 4. RENDERIZAR IMÁGENES Y MINIATURAS
// -----------------------------------------------
function renderizarImagenes(imagenes, imagenPrincipal, nombre) {
    const mainImg      = document.getElementById('mainProductImage');
    const thumbnailBox = document.querySelector('.thumbnail-images');

    // Imagen principal
    const urlPrincipal = imagenPrincipal
        || (imagenes && imagenes.length > 0 ? imagenes[0].url : null);

    if (mainImg) {
        mainImg.src = urlPrincipal || '';
        mainImg.alt = nombre;
    }

    // Miniaturas
    if (!thumbnailBox || !imagenes || imagenes.length === 0) return;

    // Ordenar: principal primero
    const ordenadas = [...imagenes].sort((a, b) => {
        if (a.es_principal) return -1;
        if (b.es_principal) return 1;
        return a.orden - b.orden;
    });

    thumbnailBox.innerHTML = ordenadas.map((img, i) => `
        <img
            class="thumbnail ${i === 0 ? 'active' : ''}"
            src="${img.url}"
            alt="Vista ${i + 1}"
            data-url="${img.url}"
        >
    `).join('');

    // Click en miniatura → actualiza imagen principal
    thumbnailBox.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.addEventListener('click', () => {
            if (mainImg) mainImg.src = thumb.dataset.url;
            thumbnailBox.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });
}

// -----------------------------------------------
// 5. RENDERIZAR TALLAS CON STOCK
// -----------------------------------------------
function renderizarTallas(tallas, productoId, productoNombre, productoPrecio) {
    const sizeOptions = document.querySelector('.size-options');
    if (!sizeOptions) return;

    if (!tallas || tallas.length === 0) {
        sizeOptions.innerHTML = '<p style="color: var(--text-light); font-size: 0.9rem;">Sin tallas disponibles.</p>';
        return;
    }

    // Ordenar tallas de menor a mayor
    const ordenadas = [...tallas].sort((a, b) => parseFloat(a.talla) - parseFloat(b.talla));

    sizeOptions.innerHTML = ordenadas.map(t => `
        <button
            class="size-btn"
            data-talla="${t.talla}"
            data-stock="${t.stock}"
        >
            ${t.talla}
        </button>
    `).join('');

    // Lógica de selección de talla
    let tallaSeleccionada = null;

    sizeOptions.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sizeOptions.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            tallaSeleccionada = btn.dataset.talla;
        });
    });

    // Conectar botón "Agregar al Carrito"
    const btnCarrito = document.querySelector('.btn-add-to-cart');
    if (btnCarrito) {
        btnCarrito.addEventListener('click', () => {
            if (!tallaSeleccionada) {
                mostrarToast('Por favor selecciona una talla');
                return;
            }

            if (typeof window.addToCart === 'function') {
                window.addToCart(
                    productoId,
                    productoNombre,
                    productoPrecio,
                    tallaSeleccionada
                );
            }
        });
    }
}

// -----------------------------------------------
// 6. RENDERIZAR MÚSICA / SPOTIFY
// -----------------------------------------------
function renderizarMusica(musicaUrl) {
    const embedWrap = document.querySelector('.embed-wrap');
    const fallback  = document.querySelector('.embed-fallback');
    const musicaDiv = document.querySelector('.music-embed');

    if (!musicaUrl) {
        // Ocultar toda la sección de música si no hay URL
        if (musicaDiv) musicaDiv.style.display = 'none';
        return;
    }

    // Convertir URL de Spotify a embed si es necesario
    let embedUrl = musicaUrl;
    if (musicaUrl.includes('open.spotify.com/track/')) {
        const trackId = musicaUrl.split('/track/')[1].split('?')[0];
        embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;
    }

    if (embedWrap) {
        embedWrap.innerHTML = `
            <iframe
                src="${embedUrl}"
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style="border-radius:12px; min-width: 100%;">
            </iframe>
        `;
    }

    if (fallback) {
        const linkSpotify = musicaUrl.includes('spotify') ? musicaUrl : '#';
        fallback.innerHTML = `Si el reproductor no carga, <a href="${linkSpotify}" target="_blank" rel="noopener">abre la canción en Spotify</a>.`;
    }
}

// -----------------------------------------------
// 7. HELPERS
// -----------------------------------------------
function formatearPrecio(precio) {
    return '$' + Number(precio).toLocaleString('es-CL');
}

function mostrarError(mensaje) {
    const seccion = document.querySelector('.product-detail-section');
    if (seccion) {
        seccion.innerHTML = `
            <div class="container" style="padding: 4rem 1rem; text-align: center;">
                <p style="font-size: 1.2rem; color: var(--text-light);">${mensaje}</p>
                <a href="productos.html" style="margin-top: 1rem; display: inline-block; text-decoration: underline;">
                    Volver al catálogo
                </a>
            </div>
        `;
    }
}

function mostrarToast(mensaje) {
    if (typeof window.showNotification === 'function') {
        window.showNotification(mensaje);
        return;
    }
    // Fallback simple si showNotification no está disponible
    const toast = document.createElement('div');
    toast.textContent = mensaje;
    toast.style.cssText = `
        position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
        background: #333; color: #fff; padding: 0.75rem 1.5rem;
        border-radius: 8px; font-size: 0.9rem; z-index: 9999;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// -----------------------------------------------
// 8. INICIAR
// -----------------------------------------------
document.addEventListener('DOMContentLoaded', cargarProducto);