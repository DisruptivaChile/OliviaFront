document.addEventListener('DOMContentLoaded', () => {

    const API = 'http://localhost:3000';

    // ── TOGGLE CONTRASEÑA ──
    function setupToggle(btnId, inputId) {
        const btn   = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        if (!btn || !input) return;
        btn.addEventListener('click', () => {
            const isPass = input.type === 'password';
            input.type   = isPass ? 'text' : 'password';
            btn.querySelector('i').className = isPass ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    }

    setupToggle('togglePass',    'password');
    setupToggle('toggleConfirm', 'confirmPassword');

    // ── FORTALEZA DE CONTRASEÑA ──
    const passInput      = document.getElementById('password');
    const strengthBox    = document.getElementById('passwordStrength');
    const strengthLabel  = document.getElementById('strengthLabel');
    const bars           = [
        document.getElementById('bar1'),
        document.getElementById('bar2'),
        document.getElementById('bar3'),
        document.getElementById('bar4'),
    ];

    function evaluarFortaleza(pass) {
        let score = 0;
        if (pass.length >= 8)                    score++;
        if (/[A-Z]/.test(pass))                  score++;
        if (/[0-9]/.test(pass))                  score++;
        if (/[^A-Za-z0-9]/.test(pass))           score++;
        return score;
    }

    passInput.addEventListener('input', () => {
        const val   = passInput.value;
        const score = evaluarFortaleza(val);

        if (!val) {
            strengthBox.classList.remove('visible');
            return;
        }

        strengthBox.classList.add('visible');

        const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
        const clases = ['', 'weak',  'fair',    'good',  'strong'];

        bars.forEach((bar, i) => {
            bar.className = 'bar';
            if (i < score) bar.classList.add(clases[score]);
        });

        strengthLabel.textContent = labels[score] || '';
        strengthLabel.style.color = score <= 1 ? '#e74c3c'
                                : score === 2 ? '#f39c12'
                                : score === 3 ? '#27ae60'
                                : '#1a7a3c';
    });

    // ── VALIDACIONES ──
    function setError(grupoId, errorId, mensaje) {
        document.getElementById(grupoId).classList.add('has-error');
        document.getElementById(grupoId).classList.remove('has-success');
        document.getElementById(errorId).textContent = mensaje;
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

    function mostrarErrorGeneral(mensaje) {
        const el = document.getElementById('errorGeneral');
        el.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensaje}`;
        el.classList.add('visible');
    }

    function ocultarErrorGeneral() {
        const el = document.getElementById('errorGeneral');
        el.classList.remove('visible');
        el.textContent = '';
    }

    function validarCampos() {
        let valido = true;

        // Nombre
        const nombre = document.getElementById('nombre').value.trim();
        if (!nombre) {
            setError('grupo-nombre', 'error-nombre', 'El nombre es obligatorio.');
            valido = false;
        } else if (nombre.length < 2) {
            setError('grupo-nombre', 'error-nombre', 'El nombre debe tener al menos 2 caracteres.');
            valido = false;
        } else {
            setSuccess('grupo-nombre', 'error-nombre');
        }

        // Apellido
        const apellido = document.getElementById('apellido').value.trim();
        if (!apellido) {
            setError('grupo-apellido', 'error-apellido', 'El apellido es obligatorio.');
            valido = false;
        } else if (apellido.length < 2) {
            setError('grupo-apellido', 'error-apellido', 'El apellido debe tener al menos 2 caracteres.');
            valido = false;
        } else {
            setSuccess('grupo-apellido', 'error-apellido');
        }

        // Email
        const email = document.getElementById('email').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setError('grupo-email', 'error-email', 'El correo es obligatorio.');
            valido = false;
        } else if (!emailRegex.test(email)) {
            setError('grupo-email', 'error-email', 'Ingresa un correo electrónico válido.');
            valido = false;
        } else {
            setSuccess('grupo-email', 'error-email');
        }

        // Contraseña
        const password = document.getElementById('password').value;
        if (!password) {
            setError('grupo-password', 'error-password', 'La contraseña es obligatoria.');
            valido = false;
        } else if (password.length < 8) {
            setError('grupo-password', 'error-password', 'La contraseña debe tener al menos 8 caracteres.');
            valido = false;
        } else {
            setSuccess('grupo-password', 'error-password');
        }

        // Confirmar contraseña
        const confirm = document.getElementById('confirmPassword').value;
        if (!confirm) {
            setError('grupo-confirm', 'error-confirm', 'Por favor confirma tu contraseña.');
            valido = false;
        } else if (confirm !== password) {
            setError('grupo-confirm', 'error-confirm', 'Las contraseñas no coinciden.');
            valido = false;
        } else {
            setSuccess('grupo-confirm', 'error-confirm');
        }

        return valido;
    }

    // ── Validación en tiempo real al salir de cada campo ──
    document.getElementById('nombre').addEventListener('blur', () => {
        const val = document.getElementById('nombre').value.trim();
        if (val.length > 0 && val.length < 2) setError('grupo-nombre', 'error-nombre', 'Mínimo 2 caracteres.');
        else if (val.length >= 2) setSuccess('grupo-nombre', 'error-nombre');
        else clearField('grupo-nombre', 'error-nombre');
    });

    document.getElementById('apellido').addEventListener('blur', () => {
        const val = document.getElementById('apellido').value.trim();
        if (val.length > 0 && val.length < 2) setError('grupo-apellido', 'error-apellido', 'Mínimo 2 caracteres.');
        else if (val.length >= 2) setSuccess('grupo-apellido', 'error-apellido');
        else clearField('grupo-apellido', 'error-apellido');
    });

    document.getElementById('email').addEventListener('blur', () => {
        const val   = document.getElementById('email').value.trim();
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (val && !regex.test(val)) setError('grupo-email', 'error-email', 'Ingresa un correo válido.');
        else if (regex.test(val)) setSuccess('grupo-email', 'error-email');
        else clearField('grupo-email', 'error-email');
    });

    document.getElementById('confirmPassword').addEventListener('input', () => {
        const pass    = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;
        if (confirm && confirm !== pass) {
            setError('grupo-confirm', 'error-confirm', 'Las contraseñas no coinciden.');
        } else if (confirm && confirm === pass) {
            setSuccess('grupo-confirm', 'error-confirm');
        } else {
            clearField('grupo-confirm', 'error-confirm');
        }
    });

    // ── SUBMIT ──
    document.getElementById('registroForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        ocultarErrorGeneral();

        if (!validarCampos()) return;

        const btn = document.getElementById('btnSubmit');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Creando cuenta...</span>';

        const payload = {
            nombre:   document.getElementById('nombre').value.trim(),
            apellido: document.getElementById('apellido').value.trim(),
            email:    document.getElementById('email').value.trim().toLowerCase(),
            password: document.getElementById('password').value,
            genero:   document.getElementById('genero').value || null,
        };

        try {
            const res  = await fetch(`${API}/api/auth/registro`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            });

            const data = await res.json();

            if (!data.success) {
                // Errores específicos del servidor
                if (data.code === 'EMAIL_DUPLICADO') {
                    setError('grupo-email', 'error-email', 'Este correo ya está registrado.');
                } else {
                    mostrarErrorGeneral(data.message || 'Ocurrió un error. Intenta nuevamente.');
                }
                btn.disabled = false;
                btn.innerHTML = '<span class="btn-text">Crear mi cuenta</span><i class="fas fa-arrow-right btn-icon"></i>';
                return;
            }

            // Guardar sesión automáticamente
            sessionStorage.setItem('userToken',  data.token);
            sessionStorage.setItem('userNombre', data.user.nombre);
            sessionStorage.setItem('userId',     data.user.id);

            // Redirigir al inicio
            window.location.href = '../../index.html';

        } catch (err) {
            console.error('Error en registro:', err);
            mostrarErrorGeneral('No se pudo conectar con el servidor. Intenta más tarde.');
            btn.disabled = false;
            btn.innerHTML = '<span class="btn-text">Crear mi cuenta</span><i class="fas fa-arrow-right btn-icon"></i>';
        }
    });

}); // fin DOMContentLoaded