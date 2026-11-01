document.addEventListener("DOMContentLoaded", function() {
    const API_URL = 'https://sheetdb.io/api/v1/pybvudbsi2u4h'; // Tu URL de SheetDB

    fetch(API_URL)
        .then(response => response.json())
        .then(productos => {
            productos.forEach(producto => {
                // 1. Convertimos el ID a texto y aseguramos que mantenga los ceros a la izquierda (ej: 8 dígitos)
                let idOriginal = String(producto.id);
                let idFormateado = idOriginal.padStart(8, '0');

                // 2. Usamos selector de atributo [class~="..."] para evitar el error de sintaxis con los números
                const tarjeta = document.querySelector(`[class~="${idFormateado}"]`);

                // 3. Si la tarjeta existe y el estado es agotado, agregamos la clase visual
                if (tarjeta && producto.estado && producto.estado.toLowerCase() === 'agotado') {
                    tarjeta.classList.add('agotado');
                }
            });
        })
        .catch(error => console.error('Error cargando inventario:', error));
});