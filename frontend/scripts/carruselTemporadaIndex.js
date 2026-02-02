// Carrusel Nueva Temporada
const track = document.getElementById('nuevaTemporadaTrack');
const prevBtn = document.getElementById('nuevaTemporadaPrev');
const nextBtn = document.getElementById('nuevaTemporadaNext');

if (track && prevBtn && nextBtn) {
    let currentIndex = 0;
    const totalPanels = 6;
    const panelsToShow = 3;
    const maxIndex = totalPanels - panelsToShow;
    
    function updateCarousel() {
        const translateValue = -(currentIndex * (100 / panelsToShow + 1.5));
        track.style.transform = `translateX(${translateValue}%)`;
    }
    
    nextBtn.addEventListener('click', () => {
        if (currentIndex < maxIndex) {
            currentIndex++;
            updateCarousel();
        }
    });
    
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        }
    });
}