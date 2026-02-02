// ============================================
// MODAL DE SUSCRIPCIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const giftFloatBtn = document.getElementById('giftFloatBtn');
    const subscriptionModal = document.getElementById('subscriptionModal');
    const subscriptionModalOverlay = document.getElementById('subscriptionModalOverlay');
    const closeSubscriptionBtn = document.getElementById('closeSubscriptionBtn');
    const subscriptionForm = document.getElementById('subscriptionForm');

    // Abrir modal al hacer clic en el botón de regalo
    if (giftFloatBtn) {
        giftFloatBtn.addEventListener('click', () => {
            subscriptionModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevenir scroll del body
        });
    }

    // Cerrar modal al hacer clic en el botón de cierre
    if (closeSubscriptionBtn) {
        closeSubscriptionBtn.addEventListener('click', () => {
            subscriptionModal.classList.remove('active');
            document.body.style.overflow = ''; // Restaurar scroll
        });
    }

    // Cerrar modal al hacer clic en el overlay
    if (subscriptionModalOverlay) {
        subscriptionModalOverlay.addEventListener('click', () => {
            subscriptionModal.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && subscriptionModal.classList.contains('active')) {
            subscriptionModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Manejo del envío del formulario
    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Obtener valores del formulario
            const nombres = subscriptionForm.querySelector('input[placeholder="Nombres"]').value;
            const apellidos = subscriptionForm.querySelector('input[placeholder="Apellidos"]').value;
            const email = subscriptionForm.querySelector('input[type="email"]').value;
            const sexo = subscriptionForm.querySelector('.subscription-select').value;
            const privacyAccepted = subscriptionForm.querySelector('input[type="checkbox"]').checked;

            // Validación básica
            if (!nombres || !apellidos || !email || !sexo || !privacyAccepted) {
                alert('Por favor, completa todos los campos y acepta las políticas de privacidad.');
                return;
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Por favor, ingresa un correo electrónico válido.');
                return;
            }

            // Aquí irían las acciones de envío (API, etc.)
            console.log('Formulario de suscripción enviado:', {
                nombres,
                apellidos,
                email,
                sexo,
                privacyAccepted
            });

            // Mostrar mensaje de éxito
            alert('¡Gracias por suscribirte! Recibirás tu código de descuento en tu correo.');

            // Limpiar formulario
            subscriptionForm.reset();

            // Cerrar modal
            subscriptionModal.classList.remove('active');
            document.body.style.overflow = '';

            // Opcional: redirigir a ofertas después de un delay
            setTimeout(() => {
                window.location.href = 'frontend/pages/ofertas.html';
            }, 1500);
        });
    }
});
