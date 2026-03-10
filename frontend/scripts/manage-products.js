document.addEventListener('DOMContentLoaded', () => {

    const API = 'http://localhost:3000';
    let todosLosProductos = [];
    let filtros = { publicado: 'all', es_a_pedido: 'all', precioMax: null, search: '' };

    // ── CARGAR TODOS LOS PRODUCTOS (incluye no publicados) ──
    async function cargarProductos() {
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = `<div class="state-msg"><i class="fas fa-spinner fa-spin"></i> Cargando productos...</div>`;

        try {
            const res  = await fetch(`${API}/api/admin/products`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            todosLosProductos = data.products;
            aplicarFiltros();
        } catch (err) {
            console.error('Error cargando productos:', err);
            grid.innerHTML = `<div class="state-msg"><i class="fas fa-exclamation-triangle"></i> Error al cargar productos.</div>`;
        }
    }

    // ── FILTROS LOCALES ──
    function aplicarFiltros() {
        let resultado = [...todosLosProductos];

        if (filtros.publicado !== 'all') {
            const pub = filtros.publicado === 'true';
            resultado = resultado.filter(p => p.publicado === pub);
        }

        if (filtros.es_a_pedido !== 'all') {
            const ap = filtros.es_a_pedido === 'true';
            resultado = resultado.filter(p => p.es_a_pedido === ap);
        }

        if (filtros.precioMax) {
            resultado = resultado.filter(p => parseFloat(p.precio) <= filtros.precioMax);
        }

        if (filtros.search.trim()) {
            const q = filtros.search.toLowerCase();
            resultado = resultado.filter(p => p.nombre.toLowerCase().includes(q));
        }

        renderGrilla(resultado);
    }

    // ── RENDERIZAR ──
    function renderGrilla(productos) {
        const grid = document.getElementById('productsGrid');
        const info = document.getElementById('resultsInfo');

        info.textContent = `${productos.length} producto${productos.length !== 1 ? 's' : ''} encontrado${productos.length !== 1 ? 's' : ''}`;

        if (productos.length === 0) {
            grid.innerHTML = `<div class="state-msg"><i class="fas fa-box-open"></i> No hay productos con esos filtros.</div>`;
            return;
        }

        grid.innerHTML = productos.map(p => {
            const precio    = '$' + Number(p.precio).toLocaleString('es-CL');
            const imagen    = p.imagen_principal || '';
            const temporada = p.temporada
                ? `<p class="card-temporada"><i class="fas fa-leaf"></i> ${p.temporada}</p>`
                : '';

            return `
                <div class="product-card ${!p.publicado ? 'no-publicado' : ''} ${p.es_a_pedido ? 'a-pedido' : ''}"
                    data-id="${p.id}">
                    <div class="card-image">
                        ${imagen
                            ? `<img src="${imagen}" alt="${p.nombre}" loading="lazy">`
                            : `<div class="no-image"><i class="fas fa-image"></i></div>`
                        }
                        <div class="badge-group">
                            <span class="badge ${p.publicado ? 'badge-publicado' : 'badge-no-publicado'}">
                                ${p.publicado ? '● Publicado' : '○ Borrador'}
                            </span>
                            ${p.es_a_pedido ? `<span class="badge badge-a-pedido">A pedido</span>` : ''}
                        </div>
                    </div>
                    <div class="card-info">
                        <span class="card-tipo">${p.tipo || ''}</span>
                        <h3 class="card-nombre" title="${p.nombre}">${p.nombre}</h3>
                        <p class="card-precio">${precio}</p>
                        ${temporada}
                    </div>
                    <div class="card-actions">
                        <button class="btn-card ${p.publicado ? 'btn-despublicar' : 'btn-publicar'}"
                                onclick="togglePublicado(${p.id}, ${p.publicado === true || p.publicado === 'true'})">
                            <i class="fas ${p.publicado ? 'fa-eye-slash' : 'fa-eye'}"></i>
                            ${p.publicado ? 'Ocultar' : 'Publicar'}
                        </button>
                        <button class="btn-card ${p.es_a_pedido ? 'btn-pedido-off' : 'btn-pedido-on'}"
                                onclick="toggleAPedido(${p.id}, ${p.es_a_pedido === true || p.es_a_pedido === 'true'})">
                            <i class="fas ${p.es_a_pedido ? 'fa-store' : 'fa-clock'}"></i>
                            ${p.es_a_pedido ? 'Normal' : 'A pedido'}
                        </button>
                        <a class="btn-card btn-editar" href="edit-product.html?id=${p.id}">
                            <i class="fas fa-pen"></i> Editar
                        </a>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ── TOGGLE PUBLICADO ──
    async function togglePublicado(id, estadoActual) {
        try {
            const res  = await fetch(`${API}/api/admin/products/${id}/publicado`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ publicado: !estadoActual })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);

            const prod = todosLosProductos.find(p => p.id === id);
            if (prod) prod.publicado = !estadoActual;
            aplicarFiltros();

            mostrarToast(!estadoActual ? '✓ Producto publicado' : '✓ Producto ocultado', 'success');
        } catch (err) {
            mostrarToast('✗ Error al actualizar', 'error');
        }
    }

    // ── TOGGLE A PEDIDO ──
    async function toggleAPedido(id, estadoActual) {
        try {
            const res  = await fetch(`${API}/api/admin/products/${id}/a-pedido`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ es_a_pedido: !estadoActual })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);

            const prod = todosLosProductos.find(p => p.id === id);
            if (prod) prod.es_a_pedido = !estadoActual;
            aplicarFiltros();

            mostrarToast(!estadoActual ? '✓ Marcado como a pedido' : '✓ Marcado como normal', 'success');
        } catch (err) {
            mostrarToast('✗ Error al actualizar', 'error');
        }
    }

    // ── TOAST ──
    function mostrarToast(mensaje, tipo = '') {
        const toast = document.getElementById('toast');
        toast.textContent = mensaje;
        toast.className   = `toast ${tipo} visible`;
        setTimeout(() => toast.classList.remove('visible'), 3000);
    }

    // ── FILTROS ──
    document.getElementById('filterPublicado').addEventListener('change', e => {
        filtros.publicado = e.target.value;
        aplicarFiltros();
    });

    document.getElementById('filterAPedido').addEventListener('change', e => {
        filtros.es_a_pedido = e.target.value;
        aplicarFiltros();
    });

    document.getElementById('filterPrecio').addEventListener('input', e => {
        filtros.precioMax = e.target.value ? parseFloat(e.target.value) : null;
        aplicarFiltros();
    });

    document.getElementById('btnSearch').addEventListener('click', () => {
        filtros.search = document.getElementById('searchInput').value;
        aplicarFiltros();
    });

    document.getElementById('searchInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') { filtros.search = e.target.value; aplicarFiltros(); }
    });

    document.getElementById('btnClearFilters').addEventListener('click', () => {
        filtros = { publicado: 'all', es_a_pedido: 'all', precioMax: null, search: '' };
        document.getElementById('filterPublicado').value = 'all';
        document.getElementById('filterAPedido').value   = 'all';
        document.getElementById('filterPrecio').value    = '';
        document.getElementById('searchInput').value     = '';
        aplicarFiltros();
    });

    // ── SEGURIDAD ──
    const TIMEOUT_INACTIVITY = 3 * 60 * 1000;

    function checkInactivity() {
        const lastActivity = sessionStorage.getItem('lastActivity');
        const token        = sessionStorage.getItem('adminToken');
        if (token && lastActivity && Date.now() - lastActivity > TIMEOUT_INACTIVITY) {
            sessionStorage.clear();
            window.location.href = '../../index.html';
        }
    }

    function resetActivityTimer() {
        if (sessionStorage.getItem('adminToken')) sessionStorage.setItem('lastActivity', Date.now());
    }

    setInterval(checkInactivity, 5000);
    window.addEventListener('mousemove', resetActivityTimer);
    window.addEventListener('keypress', resetActivityTimer);
    window.addEventListener('click',    resetActivityTimer);

    // ── EXPONER FUNCIONES AL SCOPE GLOBAL (necesario para onclick en HTML dinámico) ──
    window.togglePublicado = togglePublicado;
    window.toggleAPedido   = toggleAPedido;

    // ── TOAST AL VOLVER DE EDITAR ──
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('guardado') === '1') {
        mostrarToast('✓ Cambios realizados exitosamente', 'success');
        history.replaceState(null, '', window.location.pathname);
    }

    // ── INIT ──
    cargarProductos();

}); // fin DOMContentLoaded