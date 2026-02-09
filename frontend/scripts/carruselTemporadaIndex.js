document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('nuevaTemporadaTrack');
    const prevBtn = document.getElementById('nuevaTemporadaPrev');
    const nextBtn = document.getElementById('nuevaTemporadaNext');
    let items = Array.from(track.children);
    
    const itemsToShow = 3;
    
    // Clonación para loop infinito
    const firstClones = items.slice(0, itemsToShow).map(el => el.cloneNode(true));
    const lastClones = items.slice(-itemsToShow).map(el => el.cloneNode(true));
    
    firstClones.forEach(clone => track.appendChild(clone));
    lastClones.reverse().forEach(clone => track.insertBefore(clone, track.firstChild));

    let currentIndex = itemsToShow; 

    // --- FUNCIÓN: RESET CON FUNDIDO ---
    function resetAllImages() {
        const allImages = track.querySelectorAll('.product-panel-image');
        allImages.forEach(imgDiv => {
            const currentIndexImg = imgDiv.getAttribute('data-index');
            
            // Solo aplicamos el efecto si la imagen NO es la principal
            if (currentIndexImg !== "0") {
                const images = imgDiv.getAttribute('data-images').split(',');
                
                imgDiv.classList.remove('fade-in');
                void imgDiv.offsetWidth; // Reiniciar animación
                
                imgDiv.style.backgroundImage = `url('${images[0].trim()}')`;
                imgDiv.setAttribute('data-index', '0');
                imgDiv.classList.add('fade-in');
            }
        });
    }

    function updateCarousel(instant = false) {
        const amountToMove = track.children[0].offsetWidth + 24; 
        track.style.transition = instant ? 'none' : 'transform 0.5s ease-in-out';
        track.style.transform = `translateX(-${currentIndex * amountToMove}px)`;
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
        resetAllImages(); // Ahora el reset es suave
        currentIndex++;
        updateCarousel();
    });

    prevBtn.addEventListener('click', () => {
        resetAllImages(); // Ahora el reset es suave
        currentIndex--;
        updateCarousel();
    });

    // LÓGICA DE CAMBIO INTERNO (CON SINCRONIZACIÓN)
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.internal-prev, .internal-next');
        if (!btn) return;

        // Prevenir que el click en las flechas active el enlace del producto
        e.preventDefault();
        e.stopPropagation();

        const panelWrapper = btn.closest('.product-panel-wrapper');
        // Usamos el nombre del producto como identificador único para sincronizar clones
        const productName = panelWrapper.querySelector('.product-name-panel').innerText;
        const imgDiv = panelWrapper.querySelector('.product-panel-image');
        
        const images = imgDiv.getAttribute('data-images').split(',');
        let localIdx = parseInt(imgDiv.getAttribute('data-index') || 0);

        if (btn.classList.contains('internal-next')) {
            localIdx = (localIdx + 1) % images.length;
        } else {
            localIdx = (localIdx - 1 + images.length) % images.length;
        }

        // Sincronizar todos los paneles que se llamen igual (clones incluidos)
        const allWrappers = track.querySelectorAll('.product-panel-wrapper');
        allWrappers.forEach(wrapper => {
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

    // Hacer clickeable todo el producto (excepto las flechas internas)
    track.addEventListener('click', (e) => {
        // Si se hizo click en una flecha interna, no hacer nada (ya se maneja arriba)
        if (e.target.closest('.internal-prev, .internal-next')) {
            return;
        }

        // Buscar el product-panel-wrapper más cercano
        const wrapper = e.target.closest('.product-panel-wrapper');
        if (wrapper && wrapper.dataset.productUrl) {
            window.location.href = wrapper.dataset.productUrl;
        }
    });

    // Precarga automática de todas las variantes
    const preload = () => {
        track.querySelectorAll('.product-panel-image').forEach(div => {
            div.getAttribute('data-images').split(',').forEach(src => {
                const img = new Image();
                img.src = src.trim();
            });
        });
    };

    preload();
    setTimeout(updateCarousel, 100);
});