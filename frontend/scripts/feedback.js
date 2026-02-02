// ========================================
// FEEDBACK MODAL
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const contactFloatBtn = document.getElementById('contactFloatBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const feedbackCloseBtn = document.getElementById('feedbackCloseBtn');
    const ratingBtns = document.querySelectorAll('.rating-btn');
    const feedbackSubmitBtn = document.querySelector('.feedback-submit-btn');

    // Abrir modal
    if (contactFloatBtn) {
        contactFloatBtn.addEventListener('click', () => {
            feedbackModal.classList.add('active');
        });
    }

    // Cerrar modal
    if (feedbackCloseBtn) {
        feedbackCloseBtn.addEventListener('click', () => {
            feedbackModal.classList.remove('active');
        });
    }

    // Cerrar al hacer click fuera del modal
    if (feedbackModal) {
        feedbackModal.addEventListener('click', (e) => {
            if (e.target === feedbackModal) {
                feedbackModal.classList.remove('active');
            }
        });
    }

    // Selección de rating
    ratingBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            ratingBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    // Enviar feedback
    if (feedbackSubmitBtn) {
        feedbackSubmitBtn.addEventListener('click', () => {
            const selectedRating = document.querySelector('.rating-btn.selected');
            const selectedSpecification = document.querySelector('input[name="specifications"]:checked');
            const selectedStoreInfo = document.querySelector('input[name="store-info"]:checked');
            const feedbackEmail = document.querySelector('.feedback-email').value;
            const feedbackText = document.querySelector('.feedback-textarea').value;
            
            if (!selectedRating) {
                alert('Por favor selecciona una puntuación');
                return;
            }
            
            if (!selectedSpecification) {
                alert('Por favor selecciona una opción de claridad en especificaciones');
                return;
            }
            
            if (!selectedStoreInfo) {
                alert('Por favor selecciona una opción de facilidad para encontrar información de tiendas');
                return;
            }
            
            if (!feedbackEmail || !feedbackEmail.includes('@')) {
                alert('Por favor ingresa un correo electrónico válido');
                return;
            }
            
            // Aquí puedes agregar la lógica para enviar el feedback al backend
            console.log('Rating:', selectedRating.dataset.value);
            console.log('Especificaciones:', selectedSpecification.value);
            console.log('Info Tiendas:', selectedStoreInfo.value);
            console.log('Email:', feedbackEmail);
            console.log('Comentarios:', feedbackText);
            
            alert('¡Gracias por tu feedback!');
            feedbackModal.classList.remove('active');
            
            // Limpiar formulario
            ratingBtns.forEach(b => b.classList.remove('selected'));
            document.querySelectorAll('input[name="specifications"]').forEach(r => r.checked = false);
            document.querySelectorAll('input[name="store-info"]').forEach(r => r.checked = false);
            document.querySelector('.feedback-email').value = '';
            document.querySelector('.feedback-textarea').value = '';
        });
    }
});
