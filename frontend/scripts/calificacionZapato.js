// =============================================
// frontend/scripts/calificacionZapato.js
// Reseñas — solo compradores verificados
// =============================================

const RESENAS_API = 'http://localhost:3000/api/resenas';

// zapatoId se obtiene de la URL (igual que productoDatabase.js)
const urlParams = new URLSearchParams(window.location.search);
const zapatoId  = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async function() {
    if (!zapatoId) return;

    await cargarResenas();
    await verificarPermiso();

    // ── Abrir modal ───────────────────────────────────────────────────
    var openBtn = document.getElementById('openReviewBtn');
    if (openBtn) {
        openBtn.addEventListener('click', function() {
            if (!sessionStorage.getItem('userToken')) {
                mostrarToastResena('Debes iniciar sesión para dejar una reseña.', 'error');
                return;
            }
            document.getElementById('reviewModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // ── Cerrar modal ──────────────────────────────────────────────────
    var closeBtn = document.getElementById('closeReviewBtn');
    var overlay  = document.getElementById('reviewModalOverlay');

    if (closeBtn) closeBtn.addEventListener('click', cerrarModal);
    if (overlay)  overlay.addEventListener('click', cerrarModal);

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') cerrarModal();
    });

    // ── Submit reseña ─────────────────────────────────────────────────
    var form = document.getElementById('reviewForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await enviarResena();
        });
    }
});


// ── Cargar y renderizar reseñas desde la BD ───────────────────────────
async function cargarResenas() {
    var lista = document.getElementById('reviewsList');
    if (!lista) return;

    try {
        var res  = await fetch(RESENAS_API + '/' + zapatoId);
        var data = await res.json();

        if (!data.success) {
            lista.innerHTML = '<p class="reviews-empty">No hay reseñas aún. ¡Sé el primero!</p>';
            return;
        }

        if (data.resenas.length === 0) {
            lista.innerHTML = '<p class="reviews-empty">No hay reseñas aún. ¡Sé el primero en opinar!</p>';
            return;
        }

        lista.innerHTML = data.resenas.map(function(r) {
            return `
                <article class="review">
                    <div class="review-header">
                        <div class="review-author">
                            ${r.nombre} ${r.apellido ? r.apellido.charAt(0) + '.' : ''}
                            <span class="review-verified">
                                <i class="fas fa-check-circle"></i> Compra verificada
                            </span>
                        </div>
                        <div class="review-rating">${estrellas(r.estrellas)}</div>
                    </div>
                    <p class="review-text">${r.comentario}</p>
                    <span class="review-date">${formatearFecha(r.fecha)}</span>
                </article>
            `;
        }).join('');

    } catch (err) {
        console.error('❌ Error cargando reseñas:', err);
        lista.innerHTML = '<p class="reviews-empty">No se pudieron cargar las reseñas.</p>';
    }
}


// ── Verificar si el usuario puede reseñar ────────────────────────────
// Muestra, oculta o cambia el texto del botón según el caso
async function verificarPermiso() {
    var btn = document.getElementById('openReviewBtn');
    if (!btn) return;

    var token = sessionStorage.getItem('userToken');

    // Sin sesión → botón visible pero al hacer clic pedirá login (manejado en el listener)
    if (!token) return;

    try {
        var res  = await fetch(RESENAS_API + '/' + zapatoId + '/puede-resenar', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        var data = await res.json();

        if (!data.puede) {
            if (data.razon === 'YA_RESENO') {
                btn.textContent = 'Ya reseñaste este producto';
                btn.disabled    = true;
                btn.style.opacity = '0.6';
                btn.style.cursor  = 'not-allowed';
            } else {
                // NO_COMPRADOR → ocultar botón
                btn.style.display = 'none';
            }
        }

    } catch (err) {
        console.error('❌ Error verificando permiso:', err);
    }
}


// ── Enviar reseña al backend ──────────────────────────────────────────
async function enviarResena() {
    var token   = sessionStorage.getItem('userToken');
    var rating  = document.querySelector('input[name="rating"]:checked');
    var texto   = document.getElementById('reviewText').value.trim();
    var btnEnviar = document.querySelector('.btn-review');

    limpiarErrorResena();

    if (!rating) {
        mostrarErrorResena('Por favor selecciona una calificación.');
        return;
    }

    if (!texto || texto.length < 5) {
        mostrarErrorResena('El comentario debe tener al menos 5 caracteres.');
        return;
    }

    btnEnviar.disabled     = true;
    btnEnviar.textContent  = 'Enviando...';

    try {
        var res  = await fetch(RESENAS_API + '/' + zapatoId, {
            method:  'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                estrellas: parseInt(rating.value),
                comentario:   texto
            })
        });

        var data = await res.json();

        if (data.success) {
            cerrarModal();
            document.getElementById('reviewForm').reset();

            // Agregar la nueva reseña al tope de la lista sin recargar
            agregarResenaDOM(data.resena);

            mostrarToastResena('¡Gracias por tu reseña!', 'success');

            // Actualizar botón
            var btn = document.getElementById('openReviewBtn');
            if (btn) {
                btn.textContent   = 'Ya reseñaste este producto';
                btn.disabled      = true;
                btn.style.opacity = '0.6';
                btn.style.cursor  = 'not-allowed';
            }

        } else if (data.code === 'NO_COMPRADOR') {
            cerrarModal();
            mostrarToastResena('Solo puedes reseñar productos que hayas comprado y recibido.', 'error');
        } else if (data.code === 'YA_RESENO') {
            cerrarModal();
            mostrarToastResena('Ya dejaste una reseña para este producto.', 'error');
        } else {
            mostrarErrorResena(data.message || 'Ocurrió un error. Intenta de nuevo.');
        }

    } catch (err) {
        console.error('❌ Error enviando reseña:', err);
        mostrarErrorResena('No se pudo conectar con el servidor.');
    } finally {
        btnEnviar.disabled    = false;
        btnEnviar.textContent = 'Enviar Reseña';
    }
}


// ── Agregar reseña nueva al DOM sin recargar ──────────────────────────
function agregarResenaDOM(resena) {
    var lista = document.getElementById('reviewsList');
    if (!lista) return;

    // Quitar mensaje de "sin reseñas" si existe
    var empty = lista.querySelector('.reviews-empty');
    if (empty) empty.remove();

    var article = document.createElement('article');
    article.className = 'review review-nueva';
    article.innerHTML = `
        <div class="review-header">
            <div class="review-author">
                ${resena.nombre} ${resena.apellido ? resena.apellido.charAt(0) + '.' : ''}
                <span class="review-verified">
                    <i class="fas fa-check-circle"></i> Compra verificada
                </span>
            </div>
            <div class="review-rating">${estrellas(resena.estrellas)}</div>
        </div>
        <p class="review-text">${resena.comentario}</p>
        <span class="review-date">${formatearFecha(resena.fecha_resena)}</span>
    `;

    lista.insertBefore(article, lista.firstChild);
}


// ── Helpers ───────────────────────────────────────────────────────────
function cerrarModal() {
    var modal = document.getElementById('reviewModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    limpiarErrorResena();
}

function estrellas(n) {
    n = parseInt(n) || 0;
    return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    var fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function mostrarErrorResena(mensaje) {
    limpiarErrorResena();
    var btn = document.querySelector('.btn-review');
    if (!btn) return;
    var el = document.createElement('p');
    el.id = 'resenaErrorMsg';
    el.textContent = mensaje;
    el.style.cssText =
        'color:#c0392b;font-size:0.82rem;margin:0 0 0.75rem;' +
        'padding:0.5rem 0.75rem;background:#fdecea;border-radius:4px;' +
        'border:1px solid #f5c6c2;';
    btn.parentElement.insertBefore(el, btn);
}

function limpiarErrorResena() {
    var el = document.getElementById('resenaErrorMsg');
    if (el) el.remove();
}

function mostrarToastResena(mensaje, tipo) {
    var toast = document.createElement('div');
    toast.textContent = mensaje;
    toast.style.cssText =
        'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);' +
        'background:' + (tipo === 'success' ? '#2d6a4f' : '#c0392b') + ';' +
        'color:white;padding:1rem 2rem;border-radius:8px;' +
        'font-family:Poppins,sans-serif;font-size:0.9rem;' +
        'z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);' +
        'max-width:90%;text-align:center;';
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 4000);
}