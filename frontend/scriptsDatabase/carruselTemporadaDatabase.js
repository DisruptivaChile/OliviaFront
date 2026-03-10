// =============================================
// frontend/scriptsDatabase/carruselTemporadaDatabase.js
//
// Carga los productos de Verano 2026 desde
// el backend y los inyecta en el carrusel
// de "Nueva Temporada" antes de que
// carruselTemporadaIndex.js lo inicialice.
//
// IMPORTANTE: Este script debe cargarse
// ANTES de carruselTemporadaIndex.js
// =============================================

const API_CARRUSEL = 'http://localhost:3000';

// Nombre exacto de la temporada a mostrar
const TEMPORADA_NOMBRE = 'Verano 2026';

// -----------------------------------------------
// GENERAR HTML DE UNA TARJETA DEL CARRUSEL
// -----------------------------------------------
function renderTarjetaCarrusel(producto) {
    const imagen     = producto.imagen_principal
                        || 'https://via.placeholder.com/400x500?text=Sin+imagen';
    const precio     = '$' + Number(producto.precio).toLocaleString('es-CL');
    const productoUrl = `producto-coyan.html?id=${producto.id}`;

    return `
        <div class="product-panel-wrapper" data-product-url="${productoUrl}">
            <div class="product-panel">
                ${producto.es_a_pedido ? '<span class="sale-badge">A PEDIDO</span>' : ''}
                <div class="product-panel-image"
                     style="background-image: url('${imagen}');"
                     data-images="${imagen}"
                     data-index="0">
                </div>
                <div class="product-internal-arrows">
                    <i class="fas fa-chevron-left internal-prev"></i>
                    <i class="fas fa-chevron-right internal-next"></i>
                </div>
            </div>
            <div class="product-info-panel">
                <h4 class="product-name-panel">${producto.nombre.toUpperCase()}</h4>
                <p class="product-price-panel">
                    <span class="price-current">${precio}</span>
                </p>
            </div>
        </div>
    `;
}

// -----------------------------------------------
// CARGAR Y RENDERIZAR
// -----------------------------------------------
async function cargarCarruselTemporada() {
    const track = document.getElementById('nuevaTemporadaTrack');
    if (!track) return;

    try {
        // 1. Obtener el id de Verano 2026
        const resFilters = await fetch(`${API_CARRUSEL}/api/products/filters`);
        const dataFilters = await resFilters.json();

        if (!dataFilters.success) return;

        const temporada = dataFilters.temporadas.find(
            t => t.nombre.toLowerCase() === TEMPORADA_NOMBRE.toLowerCase()
        );

        if (!temporada) {
            console.warn(`⚠️ Temporada "${TEMPORADA_NOMBRE}" no encontrada o no activa.`);
            return;
        }

        // 2. Obtener productos de esa temporada
        const params = new URLSearchParams({
            temporada_id: temporada.id,
            es_a_pedido:  false
        });

        const res  = await fetch(`${API_CARRUSEL}/api/products?${params}`);
        const data = await res.json();

        if (!data.success || data.products.length === 0) {
            // Si no hay productos, ocultar la sección completa
            const seccion = document.querySelector('.nueva-temporada-section');
            if (seccion) seccion.style.display = 'none';
            return;
        }

        // 3. Reemplazar contenido estático del track con los productos de la BD
        track.innerHTML = data.products.map(renderTarjetaCarrusel).join('');

    } catch (error) {
        console.error('❌ Error al cargar carrusel de temporada:', error);
    }
}

// -----------------------------------------------
// INICIAR — debe completarse antes que
// carruselTemporadaIndex.js se ejecute
// -----------------------------------------------
// Usamos un evento personalizado para avisar
// a carruselTemporadaIndex.js que ya puede iniciar
document.addEventListener('DOMContentLoaded', async () => {
    await cargarCarruselTemporada();

    // Disparar evento para que carruselTemporadaIndex.js arranque
    document.dispatchEvent(new CustomEvent('carruselListo'));
});