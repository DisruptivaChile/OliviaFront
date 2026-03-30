// =============================================
// frontend/scripts/checkout.js
// Lógica del flujo de checkout y pago
// =============================================

const API_URL = 'http://localhost:3000';

// ---- Referencias DOM ----
const checkoutBtn    = document.getElementById('checkoutBtn');
const checkoutModal  = document.getElementById('checkoutModal');
const closeCheckout  = document.getElementById('closeCheckout');
const checkoutForm   = document.getElementById('checkoutForm');
const submitCheckout = document.getElementById('submitCheckout');
const checkoutError  = document.getElementById('checkoutError');
const checkoutSummary = document.getElementById('checkoutSummary');

// ---- Abrir modal checkout ----
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        // Verificar que hay items
        const cart = JSON.parse(localStorage.getItem('oliviaCart') || '[]');
        if (cart.length === 0) return;

        // Pre-fill si hay usuario logueado
        const token = localStorage.getItem('userToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.nombre)   document.getElementById('chk_nombre').value  = `${payload.nombre} ${payload.apellido || ''}`.trim();
                if (payload.email)    document.getElementById('chk_email').value   = payload.email;
            } catch(_) {}
        }

        // Renderizar resumen del carrito
        renderCheckoutSummary(cart);

        // Cerrar carrito y abrir checkout
        const cartModal = document.getElementById('cartModal');
        if (cartModal) cartModal.classList.remove('active');
        checkoutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

function renderCheckoutSummary(cart) {
    if (!checkoutSummary) return;
    const total = cart.reduce((s, i) => s + i.precio * i.quantity, 0);
    checkoutSummary.innerHTML = `
        <p style="font-weight:600;margin-bottom:0.75rem;font-size:0.9rem;">Resumen de tu pedido</p>
        ${cart.map(i => `
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;padding:0.3rem 0;border-bottom:1px solid #eee;">
                <span>${i.nombre} — T.${i.talla} × ${i.quantity}</span>
                <span>$${(i.precio * i.quantity).toLocaleString('es-CL')}</span>
            </div>`).join('')}
        <div style="display:flex;justify-content:space-between;font-weight:700;margin-top:0.75rem;font-size:1rem;">
            <span>Total</span>
            <span>$${total.toLocaleString('es-CL')}</span>
        </div>`;
}

// ---- Autocompletar por email (clientes históricos) ----
const chkEmail = document.getElementById('chk_email');
if (chkEmail) {
    chkEmail.addEventListener('blur', async () => {
        const email = chkEmail.value.trim();
        if (!email || !email.includes('@')) return;

        try {
            const res  = await fetch(`${API_URL}/api/clientes/lookup?email=${encodeURIComponent(email)}`);
            const data = await res.json();
            if (!data.success || !data.encontrado) return;

            const d = data.datos;

            // Solo rellenar campos que estén vacíos (no pisar lo que el usuario ya escribió)
            const setIfEmpty = (id, value) => {
                const el = document.getElementById(id);
                if (el && !el.value.trim() && value) el.value = value;
            };

            const nombreCompleto = [d.nombre, d.apellido].filter(Boolean).join(' ');
            setIfEmpty('chk_nombre',    nombreCompleto);
            setIfEmpty('chk_telefono',  d.telefono);
            setIfEmpty('chk_direccion', d.direccion_apt
                ? `${d.direccion}, ${d.direccion_apt}`
                : d.direccion);
            setIfEmpty('chk_ciudad',    d.ciudad);
            setIfEmpty('chk_region',    d.region);

            // Mostrar aviso suave al usuario
            const hint = document.getElementById('chk_autocompletar_hint');
            if (hint) {
                hint.textContent = '✓ Datos completados automáticamente';
                hint.style.display = 'block';
                setTimeout(() => { hint.style.display = 'none'; }, 3500);
            }
        } catch(_) {
            // Silencioso — si falla el lookup el usuario sigue normalmente
        }
    });
}

// ---- Cerrar checkout ----
if (closeCheckout) {
    closeCheckout.addEventListener('click', () => {
        checkoutModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
}

// ---- Enviar formulario ----
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const nombre    = document.getElementById('chk_nombre').value.trim();
        const email     = document.getElementById('chk_email').value.trim();
        const telefono  = document.getElementById('chk_telefono').value.trim();
        const direccion = document.getElementById('chk_direccion').value.trim();
        const ciudad    = document.getElementById('chk_ciudad').value.trim();
        const region    = document.getElementById('chk_region').value.trim();
        const pais      = document.getElementById('chk_pais').value.trim() || 'Chile';
        const notas     = document.getElementById('chk_notas').value.trim();

        // Validación frontend
        if (!nombre || !email || !direccion || !ciudad) {
            return showError('Por favor completa todos los campos obligatorios.');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return showError('El email ingresado no es válido.');
        }

        const cart = JSON.parse(localStorage.getItem('oliviaCart') || '[]');
        if (cart.length === 0) {
            return showError('Tu carrito está vacío.');
        }

        // Preparar items para el API
        const items = cart.map(i => ({
            zapato_id: i.id,
            nombre:    i.nombre,
            precio:    i.precio,
            talla:     i.talla,
            cantidad:  i.quantity,
        }));

        // Estado loading
        submitCheckout.disabled     = true;
        submitCheckout.innerHTML    = '<i class="fas fa-circle-notch fa-spin"></i> Procesando...';

        try {
            const headers = { 'Content-Type': 'application/json' };
            const token   = localStorage.getItem('userToken');
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const resp = await fetch(`${API_URL}/api/orders`, {
                method:  'POST',
                headers,
                body: JSON.stringify({
                    items,
                    nombre_cliente:   nombre,
                    email_cliente:    email,
                    telefono_cliente: telefono || null,
                    direccion,
                    ciudad,
                    region:           region  || null,
                    pais,
                    notas:            notas   || null,
                }),
            });

            const data = await resp.json();

            if (!resp.ok || !data.success) {
                throw new Error(data.message || 'Error al procesar el pedido');
            }

            // Redirigir a Flow para completar el pago
            if (data.flow_url) {
                window.location.href = data.flow_url;
            } else {
                window.location.href = `checkout-resultado.html?orden=${data.orden_codigo}`;
            }

        } catch (err) {
            console.error('Error checkout:', err);
            showError(err.message || 'Ocurrió un error. Por favor intenta de nuevo.');
            submitCheckout.disabled  = false;
            submitCheckout.innerHTML = '<i class="fas fa-lock" style="margin-right:0.5rem;"></i> Pagar con Flow';
        }
    });
}

function showError(msg) {
    if (!checkoutError) return;
    checkoutError.textContent = msg;
    checkoutError.style.display = 'block';
    checkoutError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
    if (checkoutError) checkoutError.style.display = 'none';
}

// Cerrar al click fuera del modal
if (checkoutModal) {
    checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) {
            checkoutModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
}
