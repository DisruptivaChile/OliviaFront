// =============================================
// add-product.js — inlined
// =============================================

const API = 'http://localhost:3000';
let imagenPrincipalIndex = 0;

// ── TOGGLES ──
document.getElementById('publicado').addEventListener('change', function() {
    document.getElementById('labelPublicado').classList.toggle('active', this.checked);
});
document.getElementById('es_a_pedido').addEventListener('change', function() {
    document.getElementById('labelAPedido').classList.toggle('active', this.checked);
});

// ── CARGAR TIPOS Y TEMPORADAS ──
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

// ── TALLAS ──
function generarTallas() {
    const grid = document.getElementById('tallasGrid');
    for (let talla = 34; talla <= 41; talla++) {
        grid.innerHTML += `
            <div class="talla-item">
                <label>${talla}</label>
                <input type="number" min="0" value="0"
                        id="talla_${talla}" data-talla="${talla}">
            </div>`;
    }
}

// ── IMÁGENES ──
function actualizarPrincipalUI() {
    document.querySelectorAll('#imagesList .image-row').forEach((row, i) => {
        const esPrincipal = i === imagenPrincipalIndex;
        row.classList.toggle('es-principal', esPrincipal);
        const label = row.querySelector('.image-row-label');
        const btn   = row.querySelector('.btn-principal');
        if (label) label.textContent = esPrincipal ? '★ Imagen principal' : `Imagen ${i + 1}`;
        if (btn) {
            btn.classList.toggle('active', esPrincipal);
            btn.textContent = esPrincipal ? '★ Principal' : 'Marcar principal';
        }
    });
}

function agregarFilaImagen() {
    const list  = document.getElementById('imagesList');
    const index = list.children.length;

    const row = document.createElement('div');
    row.className = 'image-row';
    row.dataset.cloudinaryUrl = ''; // se llenará al subir

    row.innerHTML = `
        <div class="image-row-header">
            <span class="image-row-label">Imagen ${index + 1}</span>
            <div class="image-row-actions">
                <button type="button" class="btn-principal">Marcar principal</button>
                <button type="button" class="btn-remove-img" title="Eliminar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>

        <div class="upload-zone" id="uploadZone_${index}">
            <input type="file" accept="image/jpeg,image/png,image/webp">
            <div class="upload-zone-content">
                <i class="fas fa-cloud-upload-alt"></i>
                <span>Haz click o arrastra una imagen aquí</span>
                <small>JPG, PNG o WEBP · Máx. 5MB</small>
            </div>
        </div>

        <img class="image-preview" alt="Vista previa">
        <span class="upload-status"></span>
    `;

    // Marcar como principal
    row.querySelector('.btn-principal').addEventListener('click', () => {
        const rows = Array.from(document.querySelectorAll('#imagesList .image-row'));
        imagenPrincipalIndex = rows.indexOf(row);
        actualizarPrincipalUI();
    });

    // Eliminar fila
    row.querySelector('.btn-remove-img').addEventListener('click', () => {
        const rows  = Array.from(document.querySelectorAll('#imagesList .image-row'));
        const idx   = rows.indexOf(row);
        row.remove();
        if (imagenPrincipalIndex >= idx) {
            imagenPrincipalIndex = Math.max(0, imagenPrincipalIndex - 1);
        }
        actualizarPrincipalUI();
    });

    // Seleccionar archivo
    const fileInput = row.querySelector('input[type="file"]');
    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) previsualizarImagen(fileInput.files[0], row);
    });

    // Drag & drop visual
    const zone = row.querySelector('.upload-zone');
    zone.addEventListener('dragover',  (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', ()  => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) {
            fileInput.files = e.dataTransfer.files;
            previsualizarImagen(file, row);
        }
    });

    list.appendChild(row);

    // Si es la primera, marcarla como principal
    if (index === 0) {
        imagenPrincipalIndex = 0;
        actualizarPrincipalUI();
    }
}

function previsualizarImagen(file, row) {
    const preview = row.querySelector('.image-preview');
    const reader  = new FileReader();
    reader.onload = (e) => {
        preview.src   = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

document.getElementById('btnAddImage').addEventListener('click', agregarFilaImagen);

// Añadir una fila al inicio
agregarFilaImagen();

// ── SUBIR IMAGEN A CLOUDINARY VÍA BACKEND ──
async function subirImagen(file, row) {
    const statusEl = row.querySelector('.upload-status');
    statusEl.textContent = '⏳ Subiendo imagen...';
    statusEl.className   = 'upload-status uploading';

    const formData = new FormData();
    formData.append('imagen', file);

    const res  = await fetch(`${API}/api/products/upload-imagen`, {
        method: 'POST',
        body:   formData
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message || 'Error al subir imagen');

    row.dataset.cloudinaryUrl = data.url;
    statusEl.textContent = '✓ Imagen subida correctamente';
    statusEl.className   = 'upload-status done';

    return data.url;
}

// ── SUBMIT ──
document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnSubmit  = document.getElementById('btnSubmit');
    const formStatus = document.getElementById('formStatus');

    btnSubmit.disabled  = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    formStatus.className = '';
    formStatus.style.display = 'none';

    try {

        //Se organiza el input de música para que solo se puedan colocar links de spotify
        const musicaInput = document.getElementById('musica_url').value.trim();
        if (musicaInput && !musicaInput.includes('spotify.com')) {
            formStatus.textContent = '✗ La URL de música debe ser de Spotify.';
            formStatus.className   = 'error';
            btnSubmit.disabled     = false;
            btnSubmit.innerHTML    = '<i class="fas fa-save"></i> Guardar artículo';
            return;
        }

        // 1. Datos básicos
        const payload = {
            nombre:       document.getElementById('nombre').value.trim(),
            tipo_id:      parseInt(document.getElementById('tipo_id').value),
            precio:       parseFloat(document.getElementById('precio').value),
            temporada_id: document.getElementById('temporada_id').value || null,
            es_a_pedido:  document.getElementById('es_a_pedido').checked,
            publicado:    document.getElementById('publicado').checked,
            descripcion:  document.getElementById('descripcion').value.trim() || null,
            materiales:   document.getElementById('materiales').value.trim() || null,
            historia:     document.getElementById('historia').value.trim() || null,
            musica_url:   musicaInput || null,
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

        // 3. Subir imágenes a Cloudinary y guardar en BD
        const imageRows = Array.from(document.querySelectorAll('#imagesList .image-row'));
        for (let i = 0; i < imageRows.length; i++) {
            const row      = imageRows[i];
            const fileInput = row.querySelector('input[type="file"]');
            const file     = fileInput?.files[0];

            if (!file) continue; // fila vacía, ignorar

            const url = await subirImagen(file, row);

            await fetch(`${API}/api/products/${zapatoId}/imagenes`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    ruta_imagen:   url,
                    es_principal:  i === imagenPrincipalIndex,
                    orden_display: i
                })
            });
        }

        // 4. Guardar tallas
        const tallaInputs = document.querySelectorAll('#tallasGrid input[data-talla]');
        for (const input of tallaInputs) {
            const stock = parseInt(input.value);
            if (stock >= 0) {
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

// ── INIT ──
cargarFiltros();
generarTallas();

// ── SEGURIDAD — INACTIVIDAD ──
const TIMEOUT_INACTIVITY = 3 * 60 * 1000;

function checkInactivity() {
    const lastActivity = sessionStorage.getItem('lastActivity');
    const token        = sessionStorage.getItem('adminToken');
    if (token && lastActivity) {
        if (Date.now() - lastActivity > TIMEOUT_INACTIVITY) {
            sessionStorage.clear();
            window.location.href = '../../index.html';
        }
    }
}

function resetActivityTimer() {
    if (sessionStorage.getItem('adminToken')) {
        sessionStorage.setItem('lastActivity', Date.now());
    }
}

setInterval(checkInactivity, 5000);
window.addEventListener('mousemove', resetActivityTimer);
window.addEventListener('keypress', resetActivityTimer);
window.addEventListener('click',    resetActivityTimer);