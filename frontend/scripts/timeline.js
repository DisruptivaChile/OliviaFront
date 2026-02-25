/* ============================================
   TIMELINE SCROLL  –  Vanilla JS
   Scroll-driven progress line animation
   Replaces Framer Motion useScroll/useTransform
   ============================================ */

(function () {
    'use strict';

    function initTimeline() {
        const container = document.querySelector('.timeline');
        const body = document.querySelector('.timeline__body');
        const progressBar = document.querySelector('.timeline__line-progress');

        if (!container || !body || !progressBar) return;

        const bodyHeight = body.getBoundingClientRect().height;

        function updateProgress() {
            const containerRect = container.getBoundingClientRect();
            const viewportH = window.innerHeight;

            // Start when top of container reaches 10% from top of viewport
            const startOffset = viewportH * 0.1;
            // End when bottom of container reaches 50% of viewport
            const endOffset = viewportH * 0.5;

            const scrollStart = containerRect.top - startOffset;
            const scrollEnd = containerRect.bottom - endOffset;
            const totalRange = scrollEnd - scrollStart;

            let progress = 0;
            if (totalRange > 0) {
                progress = -scrollStart / totalRange;
            }

            progress = Math.max(0, Math.min(1, progress));

            const lineHeight = bodyHeight * progress;
            const opacity = Math.min(1, progress / 0.1);

            progressBar.style.height = lineHeight + 'px';
            progressBar.style.opacity = opacity;

            requestAnimationFrame(updateProgress);
        }

        requestAnimationFrame(updateProgress);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTimeline);
    } else {
        initTimeline();
    }
})();
