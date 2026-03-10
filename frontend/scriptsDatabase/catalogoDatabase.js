// =============================================
// frontend/scriptsDatabase/catalogoDatabase.js
//
// Carga y renderiza el catálogo de productos
// desde el backend. Se comunica con:
//   GET /api/products          → lista de productos
//   GET /api/products/filters  → tipos y temporadas
//
// Depende de main.js para:
//   - window.addToCart(id, nombre, precio, talla)
//   - showNotification(msg)
// =============================================

const API_BASE = 'http://localhost:3000';

// -----------------------------------------------
// ESTADO DE FILTROS
// Detecta automáticamente si estamos en
// productos.html (es_a_pedido=false) u
// ofertas.html (es_a_pedido=true)
// -----------------------------------------------
const ES_PAGINA_OFERTAS = window.location.pathname.includes('ofertas');

const filtros = {
    es_a_pedido:  ES_PAGINA_OFERTAS,
    tipo_id:      null,
    temporada_id: null,
    talla:        null,
    precio_min:   null,
    precio_max:   null
};


// -----------------------------------------------
// RENDERIZADO
// -----------------------------------------------

function renderTarjeta(producto) {
    const imagen    = producto.imagen_principal
                        || 'https://via.placeholder.com/400x500?text=Sin+imagen';
    const precio    = `€${parseFloat(producto.precio).toFixed(2)}`;
    const tipo      = producto.tipo      || '';
    const temporada = producto.temporada || '';

    // Tallas disponibles (con stock > 0)
    const tallasDisponibles = Array.isArray(producto.tallas)
        ? producto.tallas.filter(t => t.stock > 0).sort((a, b) => parseFloat(a.talla) - parseFloat(b.talla))
        : [];

    const tallasHTML = tallasDisponibles.length > 0
        ? tallasDisponibles.map(t => `
            <span class="size-option" data-talla="${t.talla}">${t.talla}</span>
          `).join('')
        : `<span class="size-option sin-stock">Sin stock</span>`;

    return `
        <div class="product-card" data-id="${producto.id}">
            <div class="product-image"
                 style="background-image:url('${imagen}');
                        background-size:cover;
                        background-position:center;">
                ${producto.es_a_pedido
                    ? `<span class="product-badge">A PEDIDO</span>`
                    : ''}
            </div>
            <div class="product-info">
                <span class="product-category">${tipo}${temporada ? ' · ' + temporada : ''}</span>
                <h3 class="product-name">${producto.nombre}</h3>
                <p class="product-price">${precio}</p>
                <div class="product-sizes">${tallasHTML}</div>
                <button
                    class="add-to-cart-btn"
                    data-id="${producto.id}"
                    data-nombre="${producto.nombre}"
                    data-precio="${producto.precio}">
                    <i class="fas fa-shopping-cart"></i> Añadir al Carrito
                </button>
            </div>
        </div>
    `;
}

function mostrarCargando() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-light);">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:1rem;display:block;"></i>
            Cargando productos...
        </div>`;
}

function mostrarVacio() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-light);">
            <i class="fas fa-box-open" style="font-size:2rem;margin-bottom:1rem;display:block;opacity:0.4;"></i>
            No encontramos productos con esos filtros.
            <br><br>
        </div>`;
    document.getElementById('btnLimpiarVacio')
        ?.addEventListener('click', limpiarFiltros);
}

function mostrarError() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-light);">
            <i class="fas fa-exclamation-triangle" style="font-size:2rem;margin-bottom:1rem;display:block;opacity:0.4;"></i>
            No pudimos cargar los productos. Verifica tu conexión o que el servidor esté corriendo.
        </div>`;
}


// -----------------------------------------------
// LÓGICA DE "AÑADIR AL CARRITO"
// Delegación de eventos en la grilla completa
// -----------------------------------------------

function initCartDelegation() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    // Click en tarjeta → redirige a página de detalle
    // (salvo que el click sea en el botón de carrito o en una talla)
    grid.addEventListener('click', (e) => {
        const ignorar = e.target.closest('.add-to-cart-btn') || e.target.closest('.size-option');
        if (ignorar) return;

        const card = e.target.closest('.product-card');
        if (!card) return;

        const id = card.dataset.id;
        if (id) window.location.href = `producto-coyan.html?id=${id}`;
    });

    grid.addEventListener('click', (e) => {
        // Click en botón de añadir al carrito
        const btn = e.target.closest('.add-to-cart-btn');
        if (!btn) return;

        const card    = btn.closest('.product-card');
        const tallaEl = card ? card.querySelector('.size-option.selected') : null;

        if (!tallaEl) {
            // Si no hay talla seleccionada, avisar
            if (typeof showNotification === 'function') {
                showNotification('⚠️ Selecciona una talla primero');
            }
            return;
        }

        const id     = parseInt(btn.dataset.id);
        const nombre = btn.dataset.nombre;
        const precio = parseFloat(btn.dataset.precio);
        const talla  = tallaEl.dataset.talla;

        if (typeof window.addToCart === 'function') {
            window.addToCart(id, nombre, precio, talla);
        }
    });

    // Selección de talla — toggle clase selected
    grid.addEventListener('click', (e) => {
        const tallaEl = e.target.closest('.size-option');
        if (!tallaEl || tallaEl.classList.contains('sin-stock')) return;

        const card = tallaEl.closest('.product-card');
        if (!card) return;

        card.querySelectorAll('.size-option').forEach(t => t.classList.remove('selected'));
        tallaEl.classList.add('selected');
    });
}


// -----------------------------------------------
// CARGA DE PRODUCTOS
// -----------------------------------------------

async function cargarProductos() {
    mostrarCargando();

    const params = new URLSearchParams();
    params.set('es_a_pedido', filtros.es_a_pedido);

    if (filtros.tipo_id)      params.set('tipo_id',     filtros.tipo_id);
    if (filtros.temporada_id) params.set('temporada_id', filtros.temporada_id);
    if (filtros.talla)        params.set('talla',        filtros.talla);
    if (filtros.precio_min !== null) params.set('precioMin', filtros.precio_min);
    if (filtros.precio_max !== null) params.set('precioMax', filtros.precio_max);

    try {
        const res  = await fetch(`${API_BASE}/api/products?${params.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        if (!data.success || data.products.length === 0) {
            mostrarVacio();
            return;
        }

        grid.innerHTML = data.products.map(renderTarjeta).join('');

    } catch (err) {
        console.error('❌ Error al cargar productos:', err);
        mostrarError();
    }
}


// -----------------------------------------------
// CARGA DE FILTROS DINÁMICOS
// -----------------------------------------------

async function cargarFiltros() {
    try {
        const res  = await fetch(`${API_BASE}/api/products/filters`);
        const data = await res.json();
        if (!data.success) return;

        // Poblar select de tipos
        const selectTipo = document.getElementById('typeFilter');
        if (selectTipo) {
            selectTipo.innerHTML = `<option value="all">Todos</option>`;
            data.tipos.forEach(t => {
                selectTipo.innerHTML += `<option value="${t.id}">${t.nombre}</option>`;
            });
        }

        // Poblar select de temporadas
        const selectTemp = document.getElementById('seasonFilter');
        if (selectTemp) {
            selectTemp.innerHTML = `<option value="all">Todos</option>`;
            data.temporadas.forEach(t => {
                selectTemp.innerHTML += `<option value="${t.id}">${t.nombre}</option>`;
            });
        }

    } catch (err) {
        console.warn('⚠️ Filtros dinámicos no disponibles, usando fallback del HTML:', err);
    }
}


// -----------------------------------------------
// APLICAR FILTROS
// -----------------------------------------------

function limpiarFiltros() {
    filtros.tipo_id      = null;
    filtros.temporada_id = null;
    filtros.talla        = null;
    filtros.precio_min   = null;
    filtros.precio_max   = null;

    ['typeFilter', 'priceFilter', 'categoryFilter', 'seasonFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = 'all';
    });

    cargarProductos();
}

function aplicarFiltroPrecio(valor) {
    if (valor === 'all' || !valor) {
        filtros.precio_min = null;
        filtros.precio_max = null;
    } else if (valor === '150+') {
        filtros.precio_min = 150;
        filtros.precio_max = null;
    } else {
        const [min, max]   = valor.split('-').map(Number);
        filtros.precio_min = min;
        filtros.precio_max = max;
    }
    cargarProductos();
}


// -----------------------------------------------
// INICIALIZACIÓN
// -----------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar filtros primero (necesitamos los ids antes de cargar productos)
    await cargarFiltros();

    // 2. Leer parámetro de URL y aplicar filtro de temporada si existe
    const urlParams      = new URLSearchParams(window.location.search);
    const temporadaParam = urlParams.get('temporada'); // "primavera"

    if (temporadaParam) {
        const selectTemp = document.getElementById('seasonFilter');
        if (selectTemp) {
            // Buscar la option cuyo texto incluya el parámetro
            const option = Array.from(selectTemp.options).find(
                opt => opt.text.toLowerCase().includes(temporadaParam.toLowerCase())
            );
            if (option) {
                selectTemp.value     = option.value;
                filtros.temporada_id = option.value;
            }
        }
    }

    // 3. Cargar productos con los filtros ya aplicados
    await cargarProductos();

    // 4. Inicializar delegación de eventos del carrito
    initCartDelegation();

    // 5. Event listeners de filtros
    document.getElementById('typeFilter')
        ?.addEventListener('change', e => {
            filtros.tipo_id = e.target.value === 'all' ? null : e.target.value;
            cargarProductos();
        });

    document.getElementById('priceFilter')
        ?.addEventListener('change', e => aplicarFiltroPrecio(e.target.value));

    document.getElementById('categoryFilter')
        ?.addEventListener('change', e => {
            filtros.talla = e.target.value === 'all' ? null : e.target.value;
            cargarProductos();
        });

    document.getElementById('seasonFilter')
        ?.addEventListener('change', e => {
            filtros.temporada_id = e.target.value === 'all' ? null : e.target.value;
            cargarProductos();
        });

    document.getElementById('clearFilters')
        ?.addEventListener('click', limpiarFiltros);
});