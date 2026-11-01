document.addEventListener("DOMContentLoaded", function() {
    const API_URL = 'https://sheetdb.io/api/v1/pybvudbsi2u4h';

    const categoriasGrid = document.getElementById("categorias-grid");
    const contenedorPrincipal = document.getElementById("contenedor-principal");
    const tituloSeccion = document.getElementById("titulo-seccion");
    const descripcionSeccion = document.getElementById("descripcion-seccion");
    const sidebarContainer = document.getElementById("sidebar-container");

    const params = new URLSearchParams(window.location.search);
    const categoriaActiva = params.get("cat");

    // Categorías principales ordenadas alfabéticamente
    const categoriasMenu = [
        { id: "celular", nombre: "Celulares" },
        { id: "electronica", nombre: "Electrónica" },
        { id: "hogar", nombre: "Hogar" },
        { id: "pc", nombre: "Computadoras" },
        { id: "vehiculo", nombre: "Vehículos" }
    ].sort((a, b) => a.nombre.localeCompare(b.nombre));

    if (!categoriaActiva) {
        if (categoriasGrid) categoriasGrid.style.display = "flex";
        if (contenedorPrincipal) contenedorPrincipal.innerHTML = "";
        if (sidebarContainer) sidebarContainer.style.display = "none";
    } else {
        if (categoriasGrid) categoriasGrid.style.display = "none";
        if (sidebarContainer) sidebarContainer.style.display = "block";
        
        if (tituloSeccion) tituloSeccion.textContent = capitalizar(categoriaActiva);
        if (descripcionSeccion) descripcionSeccion.textContent = "Artículos disponibles con precios y especificaciones actualizadas.";

        cargarProductosYAgrupar(categoriaActiva);
    }

    function renderizarSidebar(catActual, listaSubcategorias) {
        if (!sidebarContainer) return;
        
        let htmlLinks = `<h3>Categorías</h3><nav class="sidebar-nav"><div class="sidebar-cat-group">`;
        
        categoriasMenu.forEach(cat => {
            const esActivo = cat.id === catActual ? "active" : "";
            htmlLinks += `<a href="catalogo.html?cat=${cat.id}" class="sidebar-cat-link ${esActivo}">${cat.nombre}</a>`;
            
            if (cat.id === catActual && listaSubcategorias.length > 0) {
                htmlLinks += `<ul class="sidebar-sublist">`;
                listaSubcategorias.sort((a, b) => a.localeCompare(b)).forEach(subcat => {
                    const subcatId = subcat.toLowerCase().replace(/\s+/g, '-');
                    htmlLinks += `<li><a href="#${subcatId}">${capitalizar(subcat)}</a></li>`;
                });
                htmlLinks += `</ul>`;
            }
        });

        htmlLinks += `</div></nav>`;
        sidebarContainer.innerHTML = htmlLinks;
    }

    function cargarProductosYAgrupar(catFiltro) {
        if (!contenedorPrincipal) return;

        contenedorPrincipal.innerHTML = `<p style="text-align: center; color: #94a3b8; width: 100%;">Cargando productos...</p>`;

        fetch(API_URL)
            .then(response => response.json())
            .then(data => {
                if (!Array.isArray(data)) {
                    contenedorPrincipal.innerHTML = `<p style="text-align: center; color: #ef4444; width: 100%;">Error al cargar los datos.</p>`;
                    return;
                }

                const productosFiltrados = data.filter(item => {
                    const ocultoVal = item.oculto ? String(item.oculto).toLowerCase().trim() : "";
                    if (ocultoVal === "si" || ocultoVal === "true" || ocultoVal === "1") return false;

                    const cat1 = item.categoria1 ? String(item.categoria1).toLowerCase().trim() : "";
                    const cat2 = item.categoria2 ? String(item.categoria2).toLowerCase().trim() : "";
                    const target = catFiltro.toLowerCase().trim();

                    return cat1 === target || cat2 === target;
                });

                contenedorPrincipal.innerHTML = "";

                if (productosFiltrados.length === 0) {
                    renderizarSidebar(catFiltro, []);
                    contenedorPrincipal.innerHTML = `<p style="text-align: center; color: #94a3b8; width: 100%;">No hay productos disponibles en esta categoría por el momento.</p>`;
                    return;
                }

                const agrupadosPorSubcat = {};
                productosFiltrados.forEach(prod => {
                    let subcatValor = prod.listasubcategoria ? String(prod.listasubcategoria).trim() : "";
                    if (!subcatValor) {
                        subcatValor = prod.subcategoria ? String(prod.subcategoria).trim() : "General";
                    }
                    let subcat = subcatValor !== "" ? subcatValor : "General";

                    if (!agrupadosPorSubcat[subcat]) {
                        agrupadosPorSubcat[subcat] = [];
                    }
                    agrupadosPorSubcat[subcat].push(prod);
                });

                // Ordenar las llaves (nombres de subcategorías) alfabéticamente
                const nombresSubcategorias = Object.keys(agrupadosPorSubcat).sort((a, b) => a.localeCompare(b));
                
                renderizarSidebar(catFiltro, nombresSubcategorias);

                // Renderizar las secciones respetando el orden alfabético de las subcategorías
                nombresSubcategorias.forEach(subcatNombre => {
                    const listaProds = agrupadosPorSubcat[subcatNombre];
                    const subcatTituloId = subcatNombre.toLowerCase().replace(/\s+/g, '-');
                    const subcatHeader = document.createElement("h3");
                    subcatHeader.id = subcatTituloId;
                    subcatHeader.className = "subcategory-title";
                    subcatHeader.textContent = capitalizar(subcatNombre);
                    contenedorPrincipal.appendChild(subcatHeader);

                    const gridDiv = document.createElement("div");
                    gridDiv.className = "products-grid";

                    listaProds.forEach(prod => {
                        const idProd = prod.id || "00000000";
                        const nombreProd = prod.nombre || "Sin nombre";
                        const precioProd = prod.precio || "0.00";
                        const estadoProd = prod.estado ? String(prod.estado).toLowerCase().trim() : "disponible";
                        
                        const esAgotado = estadoProd === "agotado";
                        const claseAgotado = esAgotado ? "agotado" : "";

                        const tarjetaDiv = document.createElement("div");
                        tarjetaDiv.className = `${idProd} ${claseAgotado}`;
                        
                        tarjetaDiv.innerHTML = `
                            <h3>${nombreProd}</h3>
                            <img src="picture/catalogo/${idProd}.png" alt="${idProd}" onerror="this.src='picture/Logo V.png'">
                            <p>${prod.descripcion || 'Artículo de tecnología y calidad garantizada.'}</p>
                            <span class="precio">$ ${precioProd}</span>
                        `;

                        gridDiv.appendChild(tarjetaDiv);
                    });

                    contenedorPrincipal.appendChild(gridDiv);
                });
            })
            .catch(error => {
                console.error("Error al obtener el catálogo:", error);
                contenedorPrincipal.innerHTML = `<p style="text-align: center; color: #ef4444; width: 100%;">Hubo un error de conexión con la base de datos.</p>`;
            });
    }

    function capitalizar(texto) {
        if (!texto) return "";
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }
});