document.addEventListener('DOMContentLoaded', () => {

    const API = 'http://localhost:3000';
    const imagenesAEliminar  = new Set();
    let principalExistenteId = null;
    let nuevaPrincipalIndex  = -1;

    // ── LEER ID DE LA URL ──
    const params   = new URLSearchParams(window.location.search);
    const zapatoId = parseInt(params.get('id'));

    if (!zapatoId || isNaN(zapatoId)) {
        document.getElementById('loadingState').innerHTML =
            '<i class="fas fa-exclamation-triangle"></i> ID de producto inválido.';
    } else {
        inicializar();
    }

    async function inicializar() {
        await Promise.all([cargarFiltros(), cargarProducto()]);
    }

    // ── CARGAR TIPOS Y TEMPORADAS ──
    async function cargarFiltros() {
        try {
            const res  = await fetch(`${API}/api/products/filters`);
            const data = await res.json();
            if (!data.success) return;

            const selectTipo = document.getElementById('tipo_id');
            data.tipos.forEach(t => { selectTipo.innerHTML += `<option value="${t.id}">${t.nombre}</option>`; });

            const selectTemp = document.getElementById('temporada_id');
            data.temporadas.forEach(t => { selectTemp.innerHTML += `<option value="${t.id}">${t.nombre}</option>`; });
        } catch (err) { console.error('Error cargando filtros:', err); }
    }

    // ── CARGAR PRODUCTO DESDE BD ──
    async function cargarProducto() {
        try {
            const res  = await fetch(`${API}/api/admin/products/${zapatoId}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Producto no encontrado');
            const p = data.product;

            document.getElementById('nombre').value      = p.nombre      || '';
            document.getElementById('precio').value      = p.precio      || '';
            document.getElementById('descripcion').value = p.descripcion || '';
            document.getElementById('materiales').value  = p.materiales  || '';
            document.getElementById('historia').value    = p.historia    || '';
            document.getElementById('musica_url').value  = p.musica_url  || '';

            if (p.tipo_id)      document.getElementById('tipo_id').value      = p.tipo_id;
            if (p.temporada_id) document.getElementById('temporada_id').value = p.temporada_id;

            const cbPublicado = document.getElementById('publicado');
            const cbAPedido   = document.getElementById('es_a_pedido');
            cbPublicado.checked = p.publicado;
            cbAPedido.checked   = p.es_a_pedido;
            document.getElementById('labelPublicado').classList.toggle('active', p.publicado);
            document.getElementById('labelAPedido').classList.toggle('active', p.es_a_pedido);

            document.getElementById('headerNombre').textContent = p.nombre;

            renderImagenesExistentes(p.imagenes || []);
            generarTallas(p.tallas || []);

            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('pageHeader').style.display   = 'flex';
            document.getElementById('formCard').style.display     = 'block';

        } catch (err) {
            console.error(err);
            document.getElementById('loadingState').innerHTML =
                `<i class="fas fa-exclamation-triangle"></i> ${err.message}`;
        }
    }

    // ── TOGGLES ──
    document.getElementById('publicado').addEventListener('change', function() {
        document.getElementById('labelPublicado').classList.toggle('active', this.checked);
    });
    document.getElementById('es_a_pedido').addEventListener('change', function() {
        document.getElementById('labelAPedido').classList.toggle('active', this.checked);
    });

    // ── RENDERIZAR IMÁGENES EXISTENTES ──
    function renderImagenesExistentes(imagenes) {
        const grid = document.getElementById('existingImagesGrid');
        if (!imagenes.length) {
            grid.innerHTML = '<p style="color:var(--text-light); font-size:0.85rem;">Sin imágenes.</p>';
            return;
        }

        const ordenadas = [...imagenes].sort((a, b) => {
            if (a.es_principal && !b.es_principal) return -1;
            if (!a.es_principal && b.es_principal) return  1;
            return (a.orden || 0) - (b.orden || 0);
        });

        const principalInicial = ordenadas.find(img => img.es_principal);
        if (principalInicial) principalExistenteId = principalInicial.id;

        grid.innerHTML = ordenadas.map(img => `
            <div class="existing-img-card ${img.es_principal ? 'es-principal' : ''}"
                id="imgCard_${img.id}" data-id="${img.id}">
                ${img.es_principal ? `<span class="principal-badge">★ Principal</span>` : ''}
                <img src="${img.url}" alt="Imagen" loading="lazy">
                <div class="existing-img-footer">
                    <button type="button"
                            class="btn-img-action btn-set-principal ${img.es_principal ? 'active' : ''}"
                            onclick="marcarPrincipalExistente(${img.id})">★</button>
                    <button type="button"
                            class="btn-img-action btn-del-img"
                            id="btnDel_${img.id}"
                            onclick="toggleEliminarImagen(${img.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function marcarPrincipalExistente(imgId) {
        principalExistenteId = imgId;
        nuevaPrincipalIndex  = -1;

        document.querySelectorAll('.existing-img-card').forEach(card => {
            const id     = parseInt(card.dataset.id);
            const esPrin = id === imgId;
            card.classList.toggle('es-principal', esPrin);
            const badge = card.querySelector('.principal-badge');
            if (badge) badge.remove();
            if (esPrin) card.insertAdjacentHTML('afterbegin', '<span class="principal-badge">★ Principal</span>');
            const btn = card.querySelector('.btn-set-principal');
            if (btn) btn.classList.toggle('active', esPrin);
        });
    }

    function toggleEliminarImagen(imgId) {
        const card   = document.getElementById(`imgCard_${imgId}`);
        const btnDel = document.getElementById(`btnDel_${imgId}`);

        if (imagenesAEliminar.has(imgId)) {
            imagenesAEliminar.delete(imgId);
            card.classList.remove('eliminada');
            btnDel.innerHTML = '<i class="fas fa-trash-alt"></i>';
            btnDel.classList.remove('btn-restore-img');
            btnDel.classList.add('btn-del-img');
        } else {
            imagenesAEliminar.add(imgId);
            card.classList.add('eliminada');
            btnDel.innerHTML = '<i class="fas fa-undo"></i>';
            btnDel.classList.remove('btn-del-img');
            btnDel.classList.add('btn-restore-img');
            if (principalExistenteId === imgId) principalExistenteId = null;
        }
    }

    // ── TALLAS ──
    function generarTallas(tallasActuales) {
        const grid     = document.getElementById('tallasGrid');
        const stockMap = {};
        tallasActuales.forEach(t => { stockMap[String(t.talla)] = t.stock; });

        for (let talla = 34; talla <= 41; talla++) {
            const stock = stockMap[String(talla)] ?? 0;
            grid.innerHTML += `
                <div class="talla-item">
                    <label>${talla}</label>
                    <input type="number" min="0" value="${stock}" id="talla_${talla}" data-talla="${talla}">
                </div>`;
        }
    }

    // ── NUEVAS IMÁGENES ──
    function agregarFilaNuevaImagen() {
        const list  = document.getElementById('newImagesList');
        const index = list.children.length;
        const row   = document.createElement('div');
        row.className = 'image-row';

        row.innerHTML = `
            <div class="image-row-header">
                <span class="image-row-label">Nueva imagen ${index + 1}</span>
                <div class="image-row-actions">
                    <button type="button" class="btn-remove-img" title="Eliminar fila">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="upload-zone">
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

        row.querySelector('.btn-remove-img').addEventListener('click', () => {
            const rows = Array.from(document.querySelectorAll('#newImagesList .image-row'));
            const idx  = rows.indexOf(row);
            row.remove();
            if (nuevaPrincipalIndex >= idx) nuevaPrincipalIndex = Math.max(-1, nuevaPrincipalIndex - 1);
            document.querySelectorAll('#newImagesList .image-row').forEach((r, i) => {
                r.querySelector('.image-row-label').textContent = `Nueva imagen ${i + 1}`;
            });
        });

        const fileInput = row.querySelector('input[type="file"]');
        fileInput.addEventListener('change', () => {
            if (fileInput.files[0]) previsualizarImagen(fileInput.files[0], row);
        });

        const zone = row.querySelector('.upload-zone');
        zone.addEventListener('dragover',  (e) => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', ()  => zone.classList.remove('dragover'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) { fileInput.files = e.dataTransfer.files; previsualizarImagen(file, row); }
        });

        list.appendChild(row);
    }

    function previsualizarImagen(file, row) {
        const preview = row.querySelector('.image-preview');
        const reader  = new FileReader();
        reader.onload = (e) => { preview.src = e.target.result; preview.style.display = 'block'; };
        reader.readAsDataURL(file);
    }

    document.getElementById('btnAddImage').addEventListener('click', agregarFilaNuevaImagen);

    // ── SUBIR IMAGEN A CLOUDINARY ──
    async function subirImagen(file, row) {
        const statusEl = row.querySelector('.upload-status');
        statusEl.textContent = '⏳ Subiendo imagen...';
        statusEl.className   = 'upload-status uploading';

        const formData = new FormData();
        formData.append('imagen', file);

        const res  = await fetch(`${API}/api/products/upload-imagen`, { method: 'POST', body: formData });
        const data = await res.json();

        if (!data.success) throw new Error(data.message || 'Error al subir imagen');

        statusEl.textContent = '✓ Imagen subida correctamente';
        statusEl.className   = 'upload-status done';
        return data.url;
    }

    // ── SUBMIT ──
    document.getElementById('editProductForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnSubmit  = document.getElementById('btnSubmit');
        const formStatus = document.getElementById('formStatus');

        btnSubmit.disabled   = true;
        btnSubmit.innerHTML  = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        formStatus.className = '';
        formStatus.textContent = '';
        formStatus.style.display = 'none';

        try {
            // 1. Validar Spotify
            const musicaInput = document.getElementById('musica_url').value.trim();
            if (musicaInput && !musicaInput.includes('spotify.com')) {
                formStatus.textContent = '✗ La URL de música debe ser de Spotify.';
                formStatus.className   = 'error';
                btnSubmit.disabled     = false;
                btnSubmit.innerHTML    = '<i class="fas fa-save"></i> Guardar cambios';
                return;
            }

            // 2. Actualizar datos básicos
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

            const resUpdate = await fetch(`${API}/api/admin/products/${zapatoId}`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            });
            const dataUpdate = await resUpdate.json();
            if (!dataUpdate.success) throw new Error(dataUpdate.message || 'Error al actualizar');

            // 3. Eliminar imágenes marcadas
            for (const imgId of imagenesAEliminar) {
                await fetch(`${API}/api/admin/imagenes/${imgId}`, { method: 'DELETE' });
            }

            // 4. Actualizar imagen principal existente
            if (principalExistenteId !== null && !imagenesAEliminar.has(principalExistenteId)) {
                await fetch(`${API}/api/admin/products/${zapatoId}/imagenes/principal`, {
                    method:  'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ imagen_id: principalExistenteId })
                });
            }

            // 5. Subir nuevas imágenes
            const newRows = Array.from(document.querySelectorAll('#newImagesList .image-row'));
            for (let i = 0; i < newRows.length; i++) {
                const row       = newRows[i];
                const fileInput = row.querySelector('input[type="file"]');
                const file      = fileInput?.files[0];
                if (!file) continue;

                const url = await subirImagen(file, row);

                await fetch(`${API}/api/products/${zapatoId}/imagenes`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ ruta_imagen: url, es_principal: false, orden_display: 100 + i })
                });
            }

            // 6. Actualizar tallas (upsert)
            const tallaInputs = document.querySelectorAll('#tallasGrid input[data-talla]');
            for (const input of tallaInputs) {
                const stock = parseInt(input.value);
                if (!isNaN(stock) && stock >= 0) {
                    await fetch(`${API}/api/products/${zapatoId}/tallas`, {
                        method:  'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body:    JSON.stringify({ numero_talla: input.dataset.talla, stock })
                    });
                }
            }

            // 7. Éxito — redirigir con flag de toast
            setTimeout(() => {
                window.location.href = 'manage-products.html?guardado=1';
            }, 500);

        } catch (err) {
            console.error(err);
            formStatus.textContent = `✗ ${err.message}`;
            formStatus.className   = 'error';
            btnSubmit.disabled     = false;
            btnSubmit.innerHTML    = '<i class="fas fa-save"></i> Guardar cambios';
        }
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

    // ── EXPONER FUNCIONES AL SCOPE GLOBAL (onclick en HTML dinámico) ──
    window.marcarPrincipalExistente = marcarPrincipalExistente;
    window.toggleEliminarImagen     = toggleEliminarImagen;

}); // fin DOMContentLoaded