/* ========================================
   X-SCROLL COMPONENT - OLIVIA MERINO
   Vanilla conversion of React XScroll
   Drag-to-scroll + edge fade indicators
   ======================================== */

(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        const scrollAreas = document.querySelectorAll('.x-scroll');

        scrollAreas.forEach(function (scrollEl) {
            const wrapper = scrollEl.closest('.x-scroll-wrapper');
            if (!wrapper) return;

            let isDragging = false;
            let startX = 0;
            let scrollLeft = 0;

            // ── Edge fade indicators ──
            function updateEdgeFades() {
                const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
                const currentScroll = scrollEl.scrollLeft;

                if (currentScroll > 5) {
                    wrapper.classList.add('scrolled-start');
                } else {
                    wrapper.classList.remove('scrolled-start');
                }

                if (currentScroll >= maxScroll - 5) {
                    wrapper.classList.add('scrolled-end');
                } else {
                    wrapper.classList.remove('scrolled-end');
                }
            }

            scrollEl.addEventListener('scroll', updateEdgeFades, { passive: true });
            updateEdgeFades();

            // ── Drag to scroll (mouse) ──
            scrollEl.addEventListener('mousedown', function (e) {
                // Ignore if clicking a link or button
                if (e.target.closest('a, button')) return;

                isDragging = true;
                startX = e.pageX - scrollEl.offsetLeft;
                scrollLeft = scrollEl.scrollLeft;
                scrollEl.classList.add('is-dragging');
                e.preventDefault();
            });

            document.addEventListener('mousemove', function (e) {
                if (!isDragging) return;
                e.preventDefault();
                var x = e.pageX - scrollEl.offsetLeft;
                var walk = (x - startX) * 1.5; // Speed multiplier
                scrollEl.scrollLeft = scrollLeft - walk;
            });

            document.addEventListener('mouseup', function () {
                if (isDragging) {
                    isDragging = false;
                    scrollEl.classList.remove('is-dragging');
                }
            });

            // ── Recalc on resize ──
            var resizeTimer;
            window.addEventListener('resize', function () {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(updateEdgeFades, 150);
            });
        });
    });
})();
