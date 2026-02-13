// Product Image Gallery
const thumbnails = document.querySelectorAll('.thumbnail');
const mainImage = document.getElementById('mainProductImage');

thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
        thumbnails.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        mainImage.src = thumb.src;
    });
});

// Size Selection
const sizeButtons = document.querySelectorAll('.size-btn');
sizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        sizeButtons.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});

// Accordion
const accordionHeaders = document.querySelectorAll('.accordion-header');
accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        item.classList.toggle('active');
    });
});

(function(){
    var openBtn = document.getElementById('openReviewBtn');
    var modal = document.getElementById('reviewModal');
    var overlay = document.getElementById('reviewModalOverlay');
    var closeBtn = document.getElementById('closeReviewBtn');
    var cancelBtn = document.getElementById('cancelReviewBtn');
    var form = document.getElementById('reviewForm');
    var list = document.getElementById('reviewsList');

    function openModal(){ modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false'); }
    function closeModal(){ modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true'); }

    if(openBtn) openBtn.addEventListener('click', openModal);
    if(overlay) overlay.addEventListener('click', closeModal);
    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    if(cancelBtn) cancelBtn.addEventListener('click', closeModal);

    function starsVisual(n){ n = parseInt(n,10)||0; return '★'.repeat(n) + '☆'.repeat(5-n); }

    if(form){
        form.addEventListener('submit', function(e){
            e.preventDefault();
            var name = document.getElementById('reviewName').value.trim();
            var rating = form.rating.value;
            var text = document.getElementById('reviewText').value.trim();
            if(!name || !rating || !text) return;

            var article = document.createElement('article');
            article.className = 'review';
            article.innerHTML = '<div class="review-header"><div class="review-author">'+
                (name)+'</div><div class="review-rating">'+starsVisual(rating)+
                '</div></div><p class="review-text">'+(text)+'</p>';

            list.insertBefore(article, list.firstChild);
            form.reset();
            closeModal();
        });
    }
})();