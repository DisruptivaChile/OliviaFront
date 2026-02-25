/* ============================================
   STICKY SCROLL REVEAL  –  Vanilla JS
   Converted from React + framer-motion component
   ============================================ */
(function () {
    'use strict';

    /* ---------- palette (white theme) ---------- */
    const BG_COLORS = [
        '#ffffff',
        '#ffffff',
        '#ffffff',
    ];

    /* ---------- init ---------- */
    function initStickyScroll() {
        const container = document.querySelector('.sticky-scroll');
        if (!container) return;

        const cards     = container.querySelectorAll('.sticky-scroll__card');
        const mediaBox  = container.querySelector('.sticky-scroll__media');
        const mediaItems = container.querySelectorAll('.sticky-scroll__media-item');
        const total     = cards.length;
        if (!total) return;

        let activeIndex = 0;
        applyActive(0);

        /* listen to scroll inside container */
        container.addEventListener('scroll', function () {
            const scrollTop  = container.scrollTop;
            const scrollMax  = container.scrollHeight - container.clientHeight;
            if (scrollMax <= 0) return;

            const progress   = scrollTop / scrollMax;           // 0 → 1
            const breakpoints = Array.from({ length: total }, (_, i) => i / total);

            let closest = 0;
            let minDist = Infinity;
            breakpoints.forEach(function (bp, i) {
                const d = Math.abs(progress - bp);
                if (d < minDist) { minDist = d; closest = i; }
            });

            if (closest !== activeIndex) {
                activeIndex = closest;
                applyActive(closest);
            }
        }, { passive: true });

        function applyActive(idx) {
            /* toggle active class on cards */
            cards.forEach(function (c, i) {
                c.classList.toggle('active', i === idx);
            });

            /* toggle active class on media items */
            mediaItems.forEach(function (m, i) {
                m.classList.toggle('active', i === idx);
            });
        }
    }

    /* ---------- bootstrap ---------- */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStickyScroll);
    } else {
        initStickyScroll();
    }
})();
