document.addEventListener('DOMContentLoaded', () => {

const API = 'http://localhost:3000';

// ── PROTECCIÓN — redirigir si no hay sesión ──
const userToken  = sessionStorage.getItem('userToken');
const userId     = sessionStorage.getItem('userId');
const userNombre = sessionStorage.getItem('userNombre');


// ── Helper: headers con JWT ──
function authHeaders() {
    return {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('userToken')}`
    };
}

if (!userToken || !userId) {
    window.location.href = '../../index.html';
    return;
}

// ── CARGAR DATOS DEL USUARIO DESDE EL BACKEND ──
async function cargarPerfil() {
    try {
        const res  = await fetch(`${API}/api/auth/perfil`, { headers: authHeaders() });
        const data = await res.json();

        if (!data.success) {
            if (data.code === 'TOKEN_EXPIRADO' || data.code === 'TOKEN_INVALIDO') {
                sessionStorage.clear();
                window.location.href = '../../index.html';
                return;
            }
            throw new Error(data.message);
        }

        const u = data.user;

        // Hero
        const nombreCompleto = `${u.nombre} ${u.apellido}`;
        document.getElementById('avatarInicial').textContent  = u.nombre.charAt(0).toUpperCase();
        document.getElementById('perfilNombre').textContent   = nombreCompleto;
        document.getElementById('perfilEmail').textContent    = u.email;

        const fecha = new Date(u.fecha_creacion).toLocaleDateString('es-CL', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        document.getElementById('perfilFecha').textContent        = `Miembro desde ${fecha}`;
        document.getElementById('displayNombreCompleto').textContent = nombreCompleto;
        document.getElementById('displayEmail').textContent          = u.email;
        document.getElementById('displayFecha').textContent          = fecha;

        // Pre-rellenar campos de edición
        document.getElementById('editNombre').value   = u.nombre;
        document.getElementById('editApellido').value = u.apellido;

    } catch (err) {
        console.error('Error cargando perfil:', err);
        document.getElementById('perfilNombre').textContent = userNombre || 'Usuario';
    }
}

cargarPerfil();

// ── EDITAR INFORMACIÓN PERSONAL ──
const btnEditarInfo   = document.getElementById('btnEditarInfo');
const infoDisplay     = document.getElementById('infoDisplay');
const infoEdit        = document.getElementById('infoEdit');
const btnCancelarEdit = document.getElementById('btnCancelarEdit');
const btnGuardarEdit  = document.getElementById('btnGuardarEdit');
const editError       = document.getElementById('editError');
const editSuccess     = document.getElementById('editSuccess');

btnEditarInfo.addEventListener('click', () => {
    infoDisplay.style.display = 'none';
    infoEdit.style.display    = 'block';
    btnEditarInfo.style.display = 'none';
    editError.textContent   = '';
    editSuccess.textContent = '';
});

btnCancelarEdit.addEventListener('click', () => {
    infoDisplay.style.display = 'block';
    infoEdit.style.display    = 'none';
    btnEditarInfo.style.display = '';
    editError.textContent   = '';
    editSuccess.textContent = '';
});

btnGuardarEdit.addEventListener('click', async () => {
    const nombre   = document.getElementById('editNombre').value.trim();
    const apellido = document.getElementById('editApellido').value.trim();

    editError.textContent   = '';
    editSuccess.textContent = '';

    if (!nombre || !apellido) {
        editError.textContent = 'Nombre y apellido son obligatorios.';
        return;
    }

    if (nombre.length < 2 || apellido.length < 2) {
        editError.textContent = 'Mínimo 2 caracteres en cada campo.';
        return;
    }

    btnGuardarEdit.disabled     = true;
    btnGuardarEdit.innerHTML    = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    try {
        const res  = await fetch(`${API}/api/auth/perfil`, {
            method:  'PUT',
            headers: authHeaders(),
            body:    JSON.stringify({ nombre, apellido })
        });
        const data = await res.json();

        if (!data.success) {
            if (data.code === 'TOKEN_EXPIRADO' || data.code === 'TOKEN_INVALIDO') {
                sessionStorage.clear();
                window.location.href = '../../index.html';
                return;
            }
            throw new Error(data.message);
        }

        // Actualizar UI
        const nombreCompleto = `${nombre} ${apellido}`;
        document.getElementById('perfilNombre').textContent          = nombreCompleto;
        document.getElementById('displayNombreCompleto').textContent = nombreCompleto;
        document.getElementById('avatarInicial').textContent         = nombre.charAt(0).toUpperCase();

        // Actualizar sessionStorage
        sessionStorage.setItem('userNombre', nombre);

        editSuccess.textContent = '✓ Cambios guardados correctamente.';

        setTimeout(() => {
            infoDisplay.style.display   = 'block';
            infoEdit.style.display      = 'none';
            btnEditarInfo.style.display = '';
            editSuccess.textContent     = '';
        }, 1500);

    } catch (err) {
        editError.textContent = err.message || 'Error al guardar los cambios.';
    } finally {
        btnGuardarEdit.disabled  = false;
        btnGuardarEdit.innerHTML = '<i class="fas fa-save"></i> Guardar cambios';
    }
});

// ── CERRAR SESIÓN ──
function cerrarSesion() {
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userNombre');
    sessionStorage.removeItem('userId');
    window.location.href = '../../index.html';
}

document.getElementById('btnCerrarSesion').addEventListener('click', cerrarSesion);
document.getElementById('btnCerrarSesionNav').addEventListener('click', cerrarSesion);

// ── ELIMINAR CUENTA ──
const confirmModal        = document.getElementById('confirmEliminar');
const confirmOverlay      = document.getElementById('confirmOverlay');
const btnEliminarCuenta   = document.getElementById('btnEliminarCuenta');
const btnCancelarEliminar = document.getElementById('btnCancelarEliminar');
const btnConfirmarEliminar = document.getElementById('btnConfirmarEliminar');

btnEliminarCuenta.addEventListener('click', () => {
    confirmModal.classList.add('active');
});

function cerrarConfirm() {
    confirmModal.classList.remove('active');
}

btnCancelarEliminar.addEventListener('click', cerrarConfirm);
confirmOverlay.addEventListener('click', cerrarConfirm);

btnConfirmarEliminar.addEventListener('click', async () => {
    btnConfirmarEliminar.disabled  = true;
    btnConfirmarEliminar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';

    try {
        const res  = await fetch(`${API}/api/auth/perfil`, {
            method:  'DELETE',
            headers: authHeaders()
        });
        const data = await res.json();

        if (!data.success) {
            if (data.code === 'TOKEN_EXPIRADO' || data.code === 'TOKEN_INVALIDO') {
                sessionStorage.clear();
                window.location.href = '../../index.html';
                return;
            }
            throw new Error(data.message);
        }

        // Limpiar sesión y redirigir
        sessionStorage.clear();
        window.location.href = '../../index.html';

    } catch (err) {
        cerrarConfirm();
        console.error('Error eliminando cuenta:', err);
        // Mostrar error en la página
        alert('No se pudo eliminar la cuenta. Intenta más tarde.');
    }
});

}); // fin DOMContentLoaded