document.addEventListener('DOMContentLoaded', () => {
    const viewport = document.querySelector('.testimonios-viewport');
    const track = document.getElementById('testimoniosTrack');
    const cards = track.querySelectorAll('.testimonio-card');
    const btnPrev = document.getElementById('testimonioPrev');
    const btnNext = document.getElementById('testimonioNext');
    
    let currentIndex = 0;
    let autoPlayInterval;
    const speed = 3000; // 3 segundos para que sea más dinámico

    function moveSlider(index) {
        if (window.innerWidth <= 900) {
            const width = viewport.offsetWidth;
            
            // Forzamos el scroll. Si se siente lento, el problema puede ser 
            // que el ancho calculado no es exacto por padding.
            viewport.scrollTo({
                left: index * width,
                behavior: 'smooth'
            });
            currentIndex = index;
        }
    }

    function handleNext() {
        currentIndex = (currentIndex + 1) % cards.length;
        moveSlider(currentIndex);
    }

    function handlePrev() {
        currentIndex = (currentIndex - 1 + cards.length) % cards.length;
        moveSlider(currentIndex);
    }

    // Eventos de botones
    btnNext.addEventListener('click', () => {
        handleNext();
        resetAutoPlay();
    });

    btnPrev.addEventListener('click', () => {
        handlePrev();
        resetAutoPlay();
    });

    // Auto Play más agresivo
    function startAutoPlay() {
        // Evitamos duplicar intervalos
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        
        autoPlayInterval = setInterval(() => {
            if (window.innerWidth <= 900) {
                handleNext();
            }
        }, speed);
    }

    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }

    // Sincronización inmediata al dejar de tocar (scroll con dedo)
    let isScrolling;
    viewport.addEventListener('scroll', () => {
        window.clearTimeout(isScrolling);
        isScrolling = setTimeout(() => {
            if (window.innerWidth <= 900) {
                const width = viewport.offsetWidth;
                currentIndex = Math.round(viewport.scrollLeft / width);
            }
        }, 100); // Detecta la posición final 100ms después de parar el scroll
    });

    // Pausar automático si el usuario mantiene el mouse/dedo encima
    viewport.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
    viewport.addEventListener('mouseleave', startAutoPlay);
    viewport.addEventListener('touchstart', () => clearInterval(autoPlayInterval), {passive: true});
    viewport.addEventListener('touchend', startAutoPlay);

    // Inicializar
    startAutoPlay();
});