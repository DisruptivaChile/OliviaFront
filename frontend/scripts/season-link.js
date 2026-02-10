document.addEventListener('DOMContentLoaded', () => {
    const seasonFilter = document.getElementById('seasonFilter');
    
    // 1. Obtener los parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const temporada = urlParams.get('temporada');

    // 2. Si existe el parámetro en la URL
    if (temporada && seasonFilter) {
        // Cambiamos el valor del select al que recibimos por URL
        seasonFilter.value = temporada;

        // 3. Forzamos el evento 'change' para que tus funciones 
        // actuales de filtrado se ejecuten automáticamente
        seasonFilter.dispatchEvent(new Event('change'));
        
        // Opcional: Si tienes una función específica tipo 'filterProducts()' 
        // puedes llamarla directamente aquí también.
    }
});