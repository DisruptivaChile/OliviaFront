// =============================================
// frontend/scripts/carruselTemporadaIndex.js
//
// Lógica de navegación del carrusel.
// Espera el evento 'carruselListo' que dispara
// carruselTemporadaDatabase.js una vez que
// los productos están en el DOM.
// =============================================

function iniciarCarrusel() {
    const track = document.getElementById('nuevaTemporadaTrack');
    const prevBtn = document.getElementById('nuevaTemporadaPrev');
    const nextBtn = document.getElementById('nuevaTemporadaNext');

    if (!track || !prevBtn || !nextBtn) return;

    let items = Array.from(track.children);
    if (items.length === 0) return;

    const itemsToShow = 3;

    // Clonación para loop infinito
    const firstClones = items.slice(0, itemsToShow).map(el => el.cloneNode(true));
    const lastClones  = items.slice(-itemsToShow).map(el => el.cloneNode(true));

    firstClones.forEach(clone => track.appendChild(clone));
    lastClones.reverse().forEach(clone => track.insertBefore(clone, track.firstChild));

    let currentIndex = itemsToShow;

    // --- SWIPE ---
    let touchStartX = 0;
    let touchEndX   = 0;

    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchStartX - touchEndX > swipeThreshold) {
            resetAllImages();
            currentIndex++;
            updateCarousel();
        }
        if (touchEndX - touchStartX > swipeThreshold) {
            resetAllImages();
            currentIndex--;
            updateCarousel();
        }
    }

    // --- RESET CON FUNDIDO ---
    function resetAllImages() {
        const allImages = track.querySelectorAll('.product-panel-image');
        allImages.forEach(imgDiv => {
            const currentIndexImg = imgDiv.getAttribute('data-index');
            if (currentIndexImg !== '0') {
                const images = imgDiv.getAttribute('data-images').split(',');
                imgDiv.classList.remove('fade-in');
                void imgDiv.offsetWidth;
                imgDiv.style.backgroundImage = `url('${images[0].trim()}')`;
                imgDiv.setAttribute('data-index', '0');
                imgDiv.classList.add('fade-in');
            }
        });
    }

    function updateCarousel(instant = false) {
        const amountToMove = track.children[0].offsetWidth + 24;
        track.style.transition = instant ? 'none' : 'transform 0.5s ease-in-out';
        track.style.transform  = `translateX(-${currentIndex * amountToMove}px)`;
    }

    track.addEventListener('transitionend', () => {
        const totalItems = track.children.length;
        if (currentIndex >= totalItems - itemsToShow) {
            currentIndex = itemsToShow;
            updateCarousel(true);
        }
        if (currentIndex <= 0) {
            currentIndex = totalItems - (itemsToShow * 2);
            updateCarousel(true);
        }
    });

    nextBtn.addEventListener('click', () => {
        resetAllImages();
        currentIndex++;
        updateCarousel();
    });

    prevBtn.addEventListener('click', () => {
        resetAllImages();
        currentIndex--;
        updateCarousel();
    });

    // --- FLECHAS INTERNAS ---
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.internal-prev, .internal-next');
        if (!btn) return;

        e.preventDefault();
        e.stopPropagation();

        const panelWrapper = btn.closest('.product-panel-wrapper');
        const productName  = panelWrapper.querySelector('.product-name-panel').innerText;
        const imgDiv       = panelWrapper.querySelector('.product-panel-image');

        const images   = imgDiv.getAttribute('data-images').split(',');
        let localIdx   = parseInt(imgDiv.getAttribute('data-index') || 0);

        if (btn.classList.contains('internal-next')) {
            localIdx = (localIdx + 1) % images.length;
        } else {
            localIdx = (localIdx - 1 + images.length) % images.length;
        }

        // Sincronizar clones
        track.querySelectorAll('.product-panel-wrapper').forEach(wrapper => {
            if (wrapper.querySelector('.product-name-panel').innerText === productName) {
                const targetImg = wrapper.querySelector('.product-panel-image');
                targetImg.classList.remove('fade-in');
                void targetImg.offsetWidth;
                targetImg.style.backgroundImage = `url('${images[localIdx].trim()}')`;
                targetImg.setAttribute('data-index', localIdx);
                targetImg.classList.add('fade-in');
            }
        });
    });

    // --- CLICK EN TARJETA → redirigir al producto ---
    track.addEventListener('click', (e) => {
        if (e.target.closest('.internal-prev, .internal-next')) return;

        const wrapper = e.target.closest('.product-panel-wrapper');
        if (wrapper && wrapper.dataset.productUrl) {
            window.location.href = wrapper.dataset.productUrl;
        }
    });

    // Precarga de imágenes
    track.querySelectorAll('.product-panel-image').forEach(div => {
        div.getAttribute('data-images').split(',').forEach(src => {
            const img = new Image();
            img.src = src.trim();
        });
    });

    setTimeout(updateCarousel, 100);
}

// Esperar a que carruselTemporadaDatabase.js termine de cargar los productos
document.addEventListener('carruselListo', iniciarCarrusel);