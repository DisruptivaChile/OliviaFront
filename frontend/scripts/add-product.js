// =============================================
// add-product.js — inlined
// =============================================

const API = 'http://localhost:3000';
let imagenPrincipalIndex = 0;

// -----------------------------------------------
// TOGGLES PUBLICADO / A PEDIDO
// -----------------------------------------------
document.getElementById('publicado').addEventListener('change', function() {
    document.getElementById('labelPublicado').classList.toggle('active', this.checked);
});

document.getElementById('es_a_pedido').addEventListener('change', function() {
    document.getElementById('labelAPedido').classList.toggle('active', this.checked);
});

// -----------------------------------------------
// CARGAR TIPOS Y TEMPORADAS
// -----------------------------------------------
async function cargarFiltros() {
    try {
        const res  = await fetch(`${API}/api/products/filters`);
        const data = await res.json();

        if (!data.success) return;

        const selectTipo = document.getElementById('tipo_id');
        data.tipos.forEach(t => {
            selectTipo.innerHTML += `<option value="${t.id}">${t.nombre}</option>`;
        });

        const selectTemp = document.getElementById('temporada_id');
        data.temporadas.forEach(t => {
            selectTemp.innerHTML += `<option value="${t.id}">${t.nombre}</option>`;
        });

    } catch (err) {
        console.error('Error cargando filtros:', err);
    }
}

// -----------------------------------------------
// TALLAS — generar inputs del 34 al 41
// -----------------------------------------------
function generarTallas() {
    const grid = document.getElementById('tallasGrid');
    for (let talla = 34; talla <= 41; talla++) {
        grid.innerHTML += `
            <div class="talla-item">
                <label>${talla}</label>
                <input type="number" min="0" value="0"
                        id="talla_${talla}"
                        data-talla="${talla}"
                        placeholder="0">
            </div>
        `;
    }
}

// -----------------------------------------------
// IMÁGENES — añadir / quitar filas
// -----------------------------------------------
function agregarFilaImagen(url = '') {
    const list  = document.getElementById('imagesList');
    const index = list.children.length;

    const row = document.createElement('div');
    row.className   = 'image-row';
    row.dataset.index = index;

    row.innerHTML = `
        <input type="url" placeholder="https://res.cloudinary.com/..." value="${url}">
        <button type="button" class="btn-principal ${index === 0 ? 'active' : ''}"
                title="Marcar como imagen principal">
            <i class="fas fa-star"></i> ${index === 0 ? 'Principal' : 'Marcar'}
        </button>
        <button type="button" class="btn-remove-img" title="Eliminar imagen">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Marcar como principal
    row.querySelector('.btn-principal').addEventListener('click', () => {
        document.querySelectorAll('.btn-principal').forEach((btn, i) => {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-star"></i> Marcar';
        });
        row.querySelector('.btn-principal').classList.add('active');
        row.querySelector('.btn-principal').innerHTML = '<i class="fas fa-star"></i> Principal';
        imagenPrincipalIndex = parseInt(row.dataset.index);
    });

    // Eliminar fila
    row.querySelector('.btn-remove-img').addEventListener('click', () => {
        row.remove();
        // Re-indexar
        document.querySelectorAll('#imagesList .image-row').forEach((r, i) => {
            r.dataset.index = i;
        });
        // Si se eliminó la principal, asignar la primera
        imagenPrincipalIndex = 0;
        const primera = document.querySelector('#imagesList .image-row .btn-principal');
        if (primera) {
            primera.classList.add('active');
            primera.innerHTML = '<i class="fas fa-star"></i> Principal';
        }
    });

    list.appendChild(row);
}

document.getElementById('btnAddImage').addEventListener('click', () => agregarFilaImagen());

// Añadir una fila vacía al inicio
agregarFilaImagen();

// -----------------------------------------------
// SUBMIT
// -----------------------------------------------
document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnSubmit  = document.getElementById('btnSubmit');
    const formStatus = document.getElementById('formStatus');

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    formStatus.className = '';
    formStatus.style.display = 'none';

    try {
        // 1. Recopilar datos básicos
        const payload = {
            nombre:      document.getElementById('nombre').value.trim(),
            tipo_id:     parseInt(document.getElementById('tipo_id').value),
            precio:      parseFloat(document.getElementById('precio').value),
            temporada_id: document.getElementById('temporada_id').value || null,
            es_a_pedido: document.getElementById('es_a_pedido').checked,
            publicado:   document.getElementById('publicado').checked,
            descripcion: document.getElementById('descripcion').value.trim() || null,
            materiales:  document.getElementById('materiales').value.trim() || null,
            historia:    document.getElementById('historia').value.trim() || null,
            musica_url:  document.getElementById('musica_url').value.trim() || null,
        };

        // 2. Crear zapato
        const res  = await fetch(`${API}/api/products`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload)
        });
        const data = await res.json();

        if (!data.success) throw new Error(data.message || 'Error al crear el zapato');

        const zapatoId = data.zapatoId;

        // 3. Guardar imágenes
        const imageRows = document.querySelectorAll('#imagesList .image-row');
        for (let i = 0; i < imageRows.length; i++) {
            const url = imageRows[i].querySelector('input[type="url"]').value.trim();
            if (!url) continue;

            await fetch(`${API}/api/products/${zapatoId}/imagenes`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    ruta_imagen:  url,
                    es_principal: i === imagenPrincipalIndex,
                    orden_display: i
                })
            });
        }

        // 4. Guardar tallas con stock > 0
        const tallaInputs = document.querySelectorAll('#tallasGrid input[data-talla]');
        for (const input of tallaInputs) {
            const stock = parseInt(input.value);
            if (stock > 0) {
                await fetch(`${API}/api/products/${zapatoId}/tallas`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({
                        numero_talla: input.dataset.talla,
                        stock
                    })
                });
            }
        }

        // 5. Éxito
        formStatus.textContent = `✓ "${payload.nombre}" guardado correctamente.`;
        formStatus.className   = 'success';

        setTimeout(() => {
            window.location.href = 'manage-products.html';
        }, 1500);

    } catch (err) {
        console.error(err);
        formStatus.textContent = `✗ ${err.message}`;
        formStatus.className   = 'error';
        btnSubmit.disabled     = false;
        btnSubmit.innerHTML    = '<i class="fas fa-save"></i> Guardar artículo';
    }
});

// -----------------------------------------------
// INIT
// -----------------------------------------------
cargarFiltros();
generarTallas();