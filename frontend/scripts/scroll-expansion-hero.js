/**
 * Scroll Expansion Hero - Vanilla JS
 * Converts React ScrollExpandMedia component to vanilla JS
 * Features: Scroll-driven media expansion, split title animation, content reveal
 */

(function () {
    'use strict';

    function initScrollExpansionHero() {
        const section = document.getElementById('expansionHero');
        if (!section) return;

        const bgEl = section.querySelector('.expansion-hero__bg');
        const mediaFrame = section.querySelector('.expansion-hero__media-frame');
        const mediaOverlay = section.querySelector('.expansion-hero__media-overlay');
        const titleLine1 = section.querySelector('.expansion-hero__title-first');
        const titleLine2 = section.querySelector('.expansion-hero__title-rest');
        const dateEl = section.querySelector('.expansion-hero__date');
        const scrollHintEl = section.querySelector('.expansion-hero__scroll-hint');
        const contentSection = section.querySelector('.expansion-hero__content');

        // --- State ---
        let scrollProgress = 0;
        let showContent = false;
        let mediaFullyExpanded = false;
        let touchStartY = 0;
        let isMobile = window.innerWidth < 768;

        // --- Resize ---
        window.addEventListener('resize', () => {
            isMobile = window.innerWidth < 768;
        });

        // --- Wheel Handler ---
        function handleWheel(e) {
            if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
                // Scroll back up — collapse
                mediaFullyExpanded = false;
                showContent = false;
                scrollProgress = 0.99;
                e.preventDefault();
                render();
                return;
            }

            if (!mediaFullyExpanded) {
                e.preventDefault();
                const scrollDelta = e.deltaY * 0.0009;
                scrollProgress = Math.min(Math.max(scrollProgress + scrollDelta, 0), 1);

                if (scrollProgress >= 1) {
                    mediaFullyExpanded = true;
                    showContent = true;
                } else if (scrollProgress < 0.75) {
                    showContent = false;
                }

                render();
            }
        }

        // --- Touch Handlers ---
        function handleTouchStart(e) {
            touchStartY = e.touches[0].clientY;
        }

        function handleTouchMove(e) {
            if (!touchStartY) return;

            const touchY = e.touches[0].clientY;
            const deltaY = touchStartY - touchY;

            if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
                mediaFullyExpanded = false;
                showContent = false;
                scrollProgress = 0.99;
                e.preventDefault();
                render();
                touchStartY = touchY;
                return;
            }

            if (!mediaFullyExpanded) {
                e.preventDefault();
                const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
                const scrollDelta = deltaY * scrollFactor;
                scrollProgress = Math.min(Math.max(scrollProgress + scrollDelta, 0), 1);

                if (scrollProgress >= 1) {
                    mediaFullyExpanded = true;
                    showContent = true;
                } else if (scrollProgress < 0.75) {
                    showContent = false;
                }

                touchStartY = touchY;
                render();
            }
        }

        function handleTouchEnd() {
            touchStartY = 0;
        }

        // --- Keep scroll at top while expanding ---
        function handleScroll() {
            if (!mediaFullyExpanded) {
                window.scrollTo(0, 0);
            }
        }

        // --- Render ---
        function render() {
            // Media dimensions
            const mediaWidth = 300 + scrollProgress * (isMobile ? 650 : 1250);
            const mediaHeight = 400 + scrollProgress * (isMobile ? 200 : 400);
            const textTranslateX = scrollProgress * (isMobile ? 180 : 150);

            // Background fade
            if (bgEl) {
                bgEl.style.opacity = 1 - scrollProgress;
            }

            // Media frame expansion
            if (mediaFrame) {
                mediaFrame.style.width = mediaWidth + 'px';
                mediaFrame.style.height = mediaHeight + 'px';
            }

            // Media overlay
            if (mediaOverlay) {
                mediaOverlay.style.opacity = 0.7 - scrollProgress * 0.3;
            }

            // Title split animation
            if (titleLine1) {
                titleLine1.style.transform = 'translateX(-' + textTranslateX + 'vw)';
            }
            if (titleLine2) {
                titleLine2.style.transform = 'translateX(' + textTranslateX + 'vw)';
            }

            // Date and hint
            if (dateEl) {
                dateEl.style.transform = 'translateX(-' + textTranslateX + 'vw)';
            }
            if (scrollHintEl) {
                scrollHintEl.style.transform = 'translateX(' + textTranslateX + 'vw)';
            }

            // Content reveal
            if (contentSection) {
                if (showContent) {
                    contentSection.classList.add('visible');
                } else {
                    contentSection.classList.remove('visible');
                }
            }
        }

        // --- Attach Events ---
        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);

        // Initial render
        render();
    }

    // --- Boot ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollExpansionHero);
    } else {
        initScrollExpansionHero();
    }
})();
