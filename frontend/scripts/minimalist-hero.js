/* ============================================
   MINIMALIST HERO  –  Vanilla JS
   Intersection Observer entrance animations
   Replaces Framer Motion from React component
   ============================================ */

(function () {
    'use strict';

    function initMinimalistHero() {
        const hero = document.querySelector('.minimalist-hero');
        if (!hero) return;

        // Collect all elements that need entrance animations
        const animTargets = hero.querySelectorAll(
            '.mh-header, .mh-left, .mh-circle, .mh-image, .mh-right, .mh-social, .mh-location'
        );

        // Use IntersectionObserver so animations fire when the hero is visible
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animTargets.forEach((el) => {
                            el.classList.add('anim-in');
                        });
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );

        observer.observe(hero);
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMinimalistHero);
    } else {
        initMinimalistHero();
    }
})();
