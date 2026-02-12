(function(){
    var form = document.getElementById('reviewForm');
    var list = document.getElementById('reviewsList');
    function starsVisual(n){
        n = parseInt(n,10)||0;
        return '★'.repeat(n) + '☆'.repeat(5-n);
    }

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
        });
    }
})();