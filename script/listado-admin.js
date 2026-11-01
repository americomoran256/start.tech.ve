document.addEventListener("DOMContentLoaded", function() {
    const API_URL = 'https://sheetdb.io/api/v1/pybvudbsi2u4h'; 

    const tablaInventarioBody = document.getElementById("tabla-inventario-body");
    const btnMostrarFormProd = document.getElementById("btn-mostrar-form-prod");
    const formProdContainer = document.getElementById("form-prod-container");
    const formProducto = document.getElementById("form-producto");
    const btnCancelarProd = document.getElementById("btn-cancelar-prod");
    const mensajeProd = document.getElementById("mensaje-prod");
    const formTitulo = document.getElementById("form-titulo");

    const inputId = document.getElementById("input-id");
    const inputNombre = document.getElementById("input-nombre");
    const inputPrecio = document.getElementById("input-precio");
    const selectCategoria1 = document.getElementById("select-categoria1");
    const selectCategoria2 = document.getElementById("select-categoria2");
    const selectSubcategoria = document.getElementById("select-subcategoria");

    let modoEdicion = false;
    let inventarioGlobal = [];

    function actualizarOpcionesSubcategorias(catVal, valorPreseleccionado = "") {
        selectSubcategoria.innerHTML = "";
        
        const optionDefault = document.createElement("option");
        optionDefault.value = "";
        optionDefault.textContent = "-- Seleccione una subcategoría --";
        selectSubcategoria.appendChild(optionDefault);

        const subcatsUnicas = new Set();
        inventarioGlobal.forEach(item => {
            const c1 = item.categoria1 ? String(item.categoria1).toLowerCase().trim() : "";
            const c2 = item.categoria2 ? String(item.categoria2).toLowerCase().trim() : "";
            
            if (c1 === catVal || c2 === catVal) {
                const sub = item.listasubcategoria || item.subcategoria;
                if (sub && String(sub).trim() !== "") {
                    subcatsUnicas.add(String(sub).trim().toLowerCase());
                }
            }
        });

        const listaDinamica = Array.from(subcatsUnicas).sort();
        if (listaDinamica.length === 0) {
            listaDinamica.push("general");
        }

        listaDinamica.forEach(sub => {
            const opt = document.createElement("option");
            opt.value = sub;
            opt.textContent = capitalizar(sub);
            if (sub.toLowerCase() === String(valorPreseleccionado).toLowerCase().trim()) {
                opt.selected = true;
            }
            selectSubcategoria.appendChild(opt);
        });
    }

    selectCategoria1.addEventListener("change", function() {
        actualizarOpcionesSubcategorias(this.value);
    });

    function cargarInventario() {
        fetch(API_URL)
            .then(response => response.json())
            .then(data => {
                if (!Array.isArray(data)) return;
                
                inventarioGlobal = data;
                tablaInventarioBody.innerHTML = "";
                
                data.forEach(row => {
                    const tr = document.createElement("tr");
                    
                    const estadoVal = row.estado ? row.estado.toLowerCase().trim() : 'disponible';
                    const esAgotado = estadoVal === 'agotado';
                    const estadoClase = esAgotado ? 'estado-agotado' : 'estado-disponible';
                    const estadoTexto = esAgotado ? 'Agotado' : 'Disponible';
                    
                    const ocultoVal = row.oculto ? row.oculto.toLowerCase().trim() : 'no';
                    const esOculto = ocultoVal === 'si';
                    const ocultoClase = esOculto ? 'oculto-si' : 'oculto-no';
                    const ocultoTexto = esOculto ? 'Oculto' : 'Visible';

                    const cat1 = row.categoria1 || '-';
                    const cat2 = row.categoria2 || '-';
                    const subcat = row.listasubcategoria || row.subcategoria || '-';

                    tr.innerHTML = `
                        <td>${row.id}</td>
                        <td>${row.nombre || 'Sin nombre'}</td>
                        <td>$${row.precio || '0.00'}</td>
                        <td>${cat1} / ${cat2} (${subcat})</td>
                        <td>
                            <button type="button" class="btn-oculto-toggle ${ocultoClase}" data-id="${row.id}" data-actual="${ocultoVal}">
                                ${ocultoTexto}
                            </button>
                        </td>
                        <td>
                            <button type="button" class="btn-estado-toggle ${estadoClase}" data-id="${row.id}" data-actual="${estadoVal}">
                                ${estadoTexto}
                            </button>
                        </td>
                        <td>
                            <button type="button" class="btn-accion btn-cambiar btn-editar-prod" data-id="${row.id}">Editar</button>
                            <button type="button" class="btn-accion btn-eliminar-prod" data-id="${row.id}">Eliminar</button>
                        </td>
                    `;
                    tablaInventarioBody.appendChild(tr);
                });

                document.querySelectorAll(".btn-oculto-toggle").forEach(btn => {
                    btn.addEventListener("click", function() {
                        const id = this.getAttribute("data-id");
                        const actual = this.getAttribute("data-actual");
                        const nuevoOculto = actual === 'si' ? 'no' : 'si';
                        actualizarCampoRapido(id, { oculto: nuevoOculto });
                    });
                });

                document.querySelectorAll(".btn-estado-toggle").forEach(btn => {
                    btn.addEventListener("click", function() {
                        const id = this.getAttribute("data-id");
                        const actual = this.getAttribute("data-actual");
                        const nuevoEstado = actual === 'agotado' ? 'disponible' : 'agotado';
                        actualizarCampoRapido(id, { estado: nuevoEstado });
                    });
                });

                document.querySelectorAll(".btn-editar-prod").forEach(btn => {
                    btn.addEventListener("click", function() {
                        const id = this.getAttribute("data-id");
                        prepararEdicionProducto(id, inventarioGlobal);
                    });
                });

                document.querySelectorAll(".btn-eliminar-prod").forEach(btn => {
                    btn.addEventListener("click", function() {
                        const id = this.getAttribute("data-id");
                        eliminarProducto(id);
                    });
                });
            })
            .catch(error => console.error("Error al cargar inventario:", error));
    }

    cargarInventario();

    function actualizarCampoRapido(id, payloadData) {
        fetch(`${API_URL}/id/${id}`, {
            method: 'PATCH',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: payloadData })
        })
        .then(() => cargarInventario())
        .catch(error => {
            alert("Error al actualizar el registro.");
            console.error(error);
        });
    }

    btnMostrarFormProd.addEventListener("click", function() {
        modoEdicion = false;
        formTitulo.textContent = "Registrar Nuevo Producto";
        formProducto.reset();
        inputId.removeAttribute("readonly");
        
        actualizarOpcionesSubcategorias(selectCategoria1.value);

        formProdContainer.style.display = "block";
        mensajeProd.textContent = "";
        
        // Scroll suave directo hacia el contenedor del formulario
        formProdContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    btnCancelarProd.addEventListener("click", function() {
        formProdContainer.style.display = "none";
        formProducto.reset();
        mensajeProd.textContent = "";
    });

    function prepararEdicionProducto(id, data) {
        const prod = data.find(item => String(item.id) === String(id));
        if (!prod) return;

        modoEdicion = true;
        formTitulo.textContent = `Editar Producto ID: ${id}`;
        
        inputId.value = prod.id || "";
        inputId.setAttribute("readonly", true);
        inputNombre.value = prod.nombre || "";
        inputPrecio.value = prod.precio || "";
        selectCategoria1.value = prod.categoria1 ? prod.categoria1.toLowerCase() : "celular";
        selectCategoria2.value = prod.categoria2 ? prod.categoria2.toLowerCase() : "";
        
        const subcatValor = prod.listasubcategoria || prod.subcategoria || "";
        actualizarOpcionesSubcategorias(selectCategoria1.value, subcatValor);

        formProdContainer.style.display = "block";
        mensajeProd.textContent = "";
        
        // Scroll suave directo hacia el contenedor del formulario
        formProdContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    formProducto.addEventListener("submit", function(e) {
        e.preventDefault();
        
        const payload = {
            id: inputId.value.trim(),
            nombre: inputNombre.value.trim(),
            precio: inputPrecio.value.trim(),
            categoria1: selectCategoria1.value,
            categoria2: selectCategoria2.value,
            listasubcategoria: selectSubcategoria.value.trim().toLowerCase()
        };

        if (!modoEdicion) {
            payload.estado = "disponible";
            payload.oculto = "no";
        }

        mensajeProd.style.color = "#38bdf8";
        mensajeProd.textContent = "Guardando cambios...";

        if (!modoEdicion) {
            fetch(API_URL, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: [payload] })
            })
            .then(() => {
                mensajeProd.style.color = "#22c55e";
                mensajeProd.textContent = "¡Producto agregado con éxito!";
                formProducto.reset();
                formProdContainer.style.display = "none";
                cargarInventario();
            })
            .catch(error => {
                mensajeProd.style.color = "#ef4444";
                mensajeProd.textContent = "Error al agregar el producto.";
                console.error(error);
            });
        } else {
            fetch(`${API_URL}/id/${payload.id}`, {
                method: 'PATCH',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            })
            .then(() => {
                mensajeProd.style.color = "#22c55e";
                mensajeProd.textContent = "¡Producto actualizado con éxito!";
                formProducto.reset();
                formProdContainer.style.display = "none";
                cargarInventario();
            })
            .catch(error => {
                mensajeProd.style.color = "#ef4444";
                mensajeProd.textContent = "Error al actualizar el producto.";
                console.error(error);
            });
        }
    });

    function eliminarProducto(id) {
        if (!confirm(`¿Estás seguro de eliminar el producto con ID: ${id}?`)) return;

        fetch(`${API_URL}/id/${id}`, {
            method: 'DELETE',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        })
        .then(() => {
            alert("Producto eliminado correctamente.");
            cargarInventario();
        })
        .catch(error => {
            alert("Error al intentar eliminar el producto.");
            console.error(error);
        });
    }

    function capitalizar(texto) {
        if (!texto) return "";
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }
});