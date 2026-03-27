document.addEventListener('DOMContentLoaded', () => {

const API = 'http://localhost:3000';

// ── PROTECCIÓN ──
const userToken = sessionStorage.getItem('userToken');
const userId    = sessionStorage.getItem('userId');


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

// ── TOGGLE VISIBILIDAD ──
function setupToggle(btnId, inputId) {
    const btn   = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.addEventListener('click', () => {
        const isPass  = input.type === 'password';
        input.type    = isPass ? 'text' : 'password';
        btn.querySelector('i').className = isPass ? 'fas fa-eye-slash' : 'fas fa-eye';
    });
}

setupToggle('toggleActual',    'passwordActual');
setupToggle('toggleNueva',     'passwordNueva');
setupToggle('toggleConfirmar', 'passwordConfirmar');

// ── FORTALEZA DE CONTRASEÑA ──
const inputNueva    = document.getElementById('passwordNueva');
const strengthWrap  = document.getElementById('strengthWrap');
const strengthLabel = document.getElementById('strengthLabel');
const bars = [
    document.getElementById('bar1'),
    document.getElementById('bar2'),
    document.getElementById('bar3'),
    document.getElementById('bar4'),
];

// Requisitos
const reqLength = document.getElementById('req-length');
const reqUpper  = document.getElementById('req-upper');
const reqNumber = document.getElementById('req-number');

inputNueva.addEventListener('input', () => {
    const val = inputNueva.value;

    // Requisitos
    reqLength.classList.toggle('met', val.length >= 8);
    reqUpper.classList.toggle('met',  /[A-Z]/.test(val));
    reqNumber.classList.toggle('met', /[0-9]/.test(val));

    if (!val) { strengthWrap.classList.remove('visible'); return; }

    // Fortaleza
    let score = 0;
    if (val.length >= 8)          score++;
    if (/[A-Z]/.test(val))        score++;
    if (/[0-9]/.test(val))        score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    strengthWrap.classList.add('visible');

    const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
    const clases = ['', 'weak',  'fair',    'good',  'strong'];
    const colores = ['', '#e74c3c', '#f39c12', '#27ae60', '#1a7a3c'];

    bars.forEach((bar, i) => {
        bar.className = 'bar';
        if (i < score) bar.classList.add(clases[score]);
    });

    strengthLabel.textContent  = labels[score] || '';
    strengthLabel.style.color  = colores[score] || '';

    // Validar confirmación en tiempo real si ya tiene valor
    const confirmar = document.getElementById('passwordConfirmar').value;
    if (confirmar) validarConfirmar();
});

// ── VALIDACIONES ──
function setError(grupoId, errorId, msg) {
    document.getElementById(grupoId).classList.add('has-error');
    document.getElementById(grupoId).classList.remove('has-success');
    document.getElementById(errorId).textContent = msg;
}

function setSuccess(grupoId, errorId) {
    document.getElementById(grupoId).classList.remove('has-error');
    document.getElementById(grupoId).classList.add('has-success');
    document.getElementById(errorId).textContent = '';
}

function clearField(grupoId, errorId) {
    document.getElementById(grupoId).classList.remove('has-error', 'has-success');
    document.getElementById(errorId).textContent = '';
}

function validarConfirmar() {
    const nueva     = inputNueva.value;
    const confirmar = document.getElementById('passwordConfirmar').value;
    if (!confirmar) { clearField('grupo-confirmar', 'error-confirmar'); return; }
    if (confirmar !== nueva) {
        setError('grupo-confirmar', 'error-confirmar', 'Las contraseñas no coinciden.');
    } else {
        setSuccess('grupo-confirmar', 'error-confirmar');
    }
}

document.getElementById('passwordConfirmar').addEventListener('input', validarConfirmar);

document.getElementById('passwordActual').addEventListener('blur', () => {
    const val = document.getElementById('passwordActual').value;
    if (!val) setError('grupo-actual', 'error-actual', 'Ingresa tu contraseña actual.');
    else      setSuccess('grupo-actual', 'error-actual');
});

// ── FEEDBACK GENERAL ──
function mostrarFeedback(mensaje, tipo) {
    const el = document.getElementById('formFeedback');
    el.innerHTML  = `<i class="fas fa-${tipo === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${mensaje}`;
    el.className  = `form-feedback ${tipo}`;
}

function ocultarFeedback() {
    const el = document.getElementById('formFeedback');
    el.className  = 'form-feedback';
    el.textContent = '';
}

// ── SUBMIT ──
document.getElementById('cambiarPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    ocultarFeedback();

    const actual    = document.getElementById('passwordActual').value;
    const nueva     = inputNueva.value;
    const confirmar = document.getElementById('passwordConfirmar').value;

    let valido = true;

    if (!actual) {
        setError('grupo-actual', 'error-actual', 'Ingresa tu contraseña actual.');
        valido = false;
    } else {
        setSuccess('grupo-actual', 'error-actual');
    }

    if (!nueva) {
        setError('grupo-nueva', 'error-nueva', 'Ingresa una nueva contraseña.');
        valido = false;
    } else if (nueva.length < 8) {
        setError('grupo-nueva', 'error-nueva', 'La contraseña debe tener al menos 8 caracteres.');
        valido = false;
    } else if (nueva === actual) {
        setError('grupo-nueva', 'error-nueva', 'La nueva contraseña debe ser diferente a la actual.');
        valido = false;
    } else {
        setSuccess('grupo-nueva', 'error-nueva');
    }

    if (!confirmar) {
        setError('grupo-confirmar', 'error-confirmar', 'Confirma tu nueva contraseña.');
        valido = false;
    } else if (confirmar !== nueva) {
        setError('grupo-confirmar', 'error-confirmar', 'Las contraseñas no coinciden.');
        valido = false;
    } else {
        setSuccess('grupo-confirmar', 'error-confirmar');
    }

    if (!valido) return;

    const btn = document.getElementById('btnGuardar');
    btn.disabled  = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';

    try {
        const res  = await fetch(`${API}/api/auth/cambiar-password`, {
            method:  'PUT',
            headers: authHeaders(),
            body:    JSON.stringify({ passwordActual: actual, passwordNueva: nueva })
        });

        const data = await res.json();

        if (!data.success) {
            // Error específico de contraseña actual incorrecta
            if (data.code === 'PASSWORD_INCORRECTO') {
                setError('grupo-actual', 'error-actual', 'La contraseña actual es incorrecta.');
            } else {
                mostrarFeedback(data.message || 'Ocurrió un error. Intenta nuevamente.', 'error');
            }
            btn.disabled  = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Actualizar contraseña';
            return;
        }

        // Éxito
        mostrarFeedback('Contraseña actualizada correctamente.', 'success');
        document.getElementById('cambiarPasswordForm').reset();
        strengthWrap.classList.remove('visible');
        [reqLength, reqUpper, reqNumber].forEach(r => r.classList.remove('met'));
        ['grupo-actual','grupo-nueva','grupo-confirmar'].forEach(g => {
            document.getElementById(g).classList.remove('has-success', 'has-error');
        });

        // Redirigir al perfil después de 2 segundos
        setTimeout(() => {
            window.location.href = 'perfil.html';
        }, 2000);

    } catch (err) {
        console.error('Error cambiando contraseña:', err);
        mostrarFeedback('No se pudo conectar con el servidor.', 'error');
        btn.disabled  = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Actualizar contraseña';
    }
});

}); // fin DOMContentLoaded