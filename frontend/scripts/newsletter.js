const API = 'http://localhost:3000/api';

    // ── Cargar contador ───────────────────────────────────────────────
    async function cargarContador() {
        try {
            const res  = await fetch(API + '/suscripciones/stats', {
                headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('adminToken') }
            });
            const data = await res.json();
            document.getElementById('contadorSuscriptores').textContent =
                data.success ? data.total : '—';
        } catch {
            document.getElementById('contadorSuscriptores').textContent = '—';
        }
    }
    cargarContador();

    // ── Modal de confirmación ─────────────────────────────────────────
    let resolveConfirm = null;

    function mostrarConfirm(total) {
        return new Promise((resolve) => {
            resolveConfirm = resolve;
            document.getElementById('confirmText').innerHTML =
                'Se enviará el newsletter a <strong>' + total + '</strong> suscriptor(es) activo(s).<br>' +
                'Esta acción no se puede deshacer.';
            document.getElementById('confirmOverlay').classList.add('active');
        });
    }

    document.getElementById('confirmCancelar').addEventListener('click', function() {
        document.getElementById('confirmOverlay').classList.remove('active');
        if (resolveConfirm) resolveConfirm(false);
    });

    document.getElementById('confirmAceptar').addEventListener('click', function() {
        document.getElementById('confirmOverlay').classList.remove('active');
        if (resolveConfirm) resolveConfirm(true);
    });

    // Cerrar con clic en overlay
    document.getElementById('confirmOverlay').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
            if (resolveConfirm) resolveConfirm(false);
        }
    });

    // ── Enviar newsletter ─────────────────────────────────────────────
    document.getElementById('newsletterForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const asunto    = document.getElementById('asunto').value.trim();
        const contenido = document.getElementById('contenido').value.trim();
        const msgBox    = document.getElementById('msgBox');
        const btn       = document.getElementById('btnEnviar');

        msgBox.className   = 'msg-box';
        msgBox.textContent = '';

        if (!asunto) {
            mostrarMsg('Por favor escribe un asunto para el correo.', 'error');
            return;
        }
        if (!contenido) {
            mostrarMsg('Por favor escribe el contenido del newsletter.', 'error');
            return;
        }

        // Obtener total actual para mostrarlo en el modal
        let total = document.getElementById('contadorSuscriptores').textContent;

        const confirmado = await mostrarConfirm(total);
        if (!confirmado) return;

        btn.disabled  = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> &nbsp;Enviando...';

        try {
            const res  = await fetch(API + '/suscripciones/enviar-newsletter', {
                method:  'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': 'Bearer ' + sessionStorage.getItem('adminToken')
                },
                body: JSON.stringify({ asunto, contenido })
            });

            const data = await res.json();

            if (data.success) {
                mostrarMsg(
                    '✓ Newsletter enviado a ' + data.enviados + ' suscriptor(es).' +
                    (data.fallidos > 0 ? ' Fallidos: ' + data.fallidos + '.' : ''),
                    'success'
                );
                document.getElementById('newsletterForm').reset();
                cargarContador();
            } else {
                mostrarMsg(data.message || 'Ocurrió un error al enviar.', 'error');
            }

        } catch (err) {
            console.error(err);
            mostrarMsg('No se pudo conectar con el servidor.', 'error');
        } finally {
            btn.disabled  = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> &nbsp;Enviar a todos los suscriptores';
        }
    });

    function mostrarMsg(texto, tipo) {
        const el = document.getElementById('msgBox');
        el.textContent = texto;
        el.className   = 'msg-box ' + tipo;
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }