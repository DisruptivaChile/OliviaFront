document.addEventListener('DOMContentLoaded', () => {
    const accordions = document.querySelectorAll('.accordion-header');

    accordions.forEach(header => {
        header.addEventListener('click', () => {
            const parent = header.parentElement;
            
            // Opcional: Cerrar los demás al abrir uno (estilo acordeón real)
            /*
            document.querySelectorAll('.accordion-section').forEach(sec => {
                if(sec !== parent) sec.classList.remove('active');
            });
            */

            parent.classList.toggle('active');
        });
    });
});