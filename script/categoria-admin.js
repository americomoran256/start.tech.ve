document.addEventListener("DOMContentLoaded", function() {
    const API_URL = 'https://sheetdb.io/api/v1/pybvudbsi2u4h';

    const tablaSubcatBody = document.getElementById("tabla-subcat-body");
    const formSubcategoria = document.getElementById("form-subcategoria");
    const inputSubcatNombre = document.getElementById("input-subcat-nombre");
    const inputSubcatAntigua = document.getElementById("input-subcat-antigua");
    const mensajeSubcat = document.getElementById("mensaje-subcat");
    const btnGuardar = document.getElementById("btn-guardar");
    const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");
    const formTitulo = document.getElementById("form-titulo");

    let inventarioGlobal = [];

    function cargarSubcategorias() {
        fetch(API_URL)
            .then(response => response.json())
            .then(data => {
                if (!Array.isArray(data)) return;
                inventarioGlobal = data;

                const subcatsUnicas = new Set();
                data.forEach(row => {
                    const sub = row.listasubcategoria || row.subcategoria;
                    if (sub && String(sub).trim() !== "") {
                        subcatsUnicas.add(String(sub).toLowerCase().trim());
                    }
                });

                const listaOrdenada = Array.from(subcatsUnicas).sort();

                tablaSubcatBody.innerHTML = "";
                if (listaOrdenada.length === 0) {
                    tablaSubcatBody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: #94a3b8; padding: 1rem;">No hay subcategorías registradas.</td></tr>`;
                    return;
                }

                listaOrdenada.forEach(sub => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><strong>${capitalizar(sub)}</strong></td>
                        <td>
                            <button type="button" class="btn-editar" data-sub="${sub}">Modificar</button>
                            <button type="button" class="btn-eliminar-sub" data-sub="${sub}">Eliminar</button>
                        </td>
                    `;
                    tablaSubcatBody.appendChild(tr);
                });
// Botón Modificar: Cambia el formulario a modo actualización
                document.querySelectorAll(".btn-editar").forEach(btn => {
                    btn.addEventListener("click", function() {
                        const subVal = this.getAttribute("data-sub");
                        inputSubcatAntigua.value = subVal;
                        inputSubcatNombre.value = subVal;
                        formTitulo.textContent = `Modificar Subcategoría: ${capitalizar(subVal)}`;
                        btnGuardar.textContent = "Actualizar Subcategoría";
                        btnGuardar.classList.add("btn-modo-actualizar");
                        btnCancelarEdicion.style.display = "inline-block";
                        mensajeSubcat.textContent = "";
                        
                        // Esto hace scroll suave directo hacia el formulario de arriba
                        document.querySelector(".product-form-box-fixed").scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start' 
                        });
                    });
                });

                // Botón Eliminar
                document.querySelectorAll(".btn-eliminar-sub").forEach(btn => {
                    btn.addEventListener("click", function() {
                        const subVal = this.getAttribute("data-sub");
                        eliminarSubcategoria(subVal);
                    });
                });
            })
            .catch(error => console.error("Error al cargar datos:", error));
    }

    cargarSubcategorias();

    // Botón Cancelar Edición
    btnCancelarEdicion.addEventListener("click", function() {
        resetearFormulario();
        mensajeSubcat.textContent = "";
    });

    formSubcategoria.addEventListener("submit", function(e) {
        e.preventDefault();
        const nombreNuevo = inputSubcatNombre.value.trim().toLowerCase();
        const nombreAntiguo = inputSubcatAntigua.value.trim().toLowerCase();

        if (!nombreNuevo) return;

        mensajeSubcat.style.color = "#38bdf8";
        mensajeSubcat.textContent = "Guardando cambios en la base de datos...";

        if (!nombreAntiguo) {
            // MODO CREAR: Añade un registro nuevo a SheetDB para que la subcategoría exista oficialmente
            const nuevoRegistro = {
                data: {
                    id: "sub_" + Date.now(),
                    producto: "Registro Subcategoría",
                    precio: "0",
                    stock: "disponible",
                    listasubcategoria: nombreNuevo,
                    oculto: "si" // Oculto para que no afecte el catálogo visible de la tienda
                }
            };

            fetch(API_URL, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoRegistro)
            })
            .then(res => res.json())
            .then(() => {
                mensajeSubcat.style.color = "#22c55e";
                mensajeSubcat.textContent = "¡Subcategoría agregada con éxito!";
                formSubcategoria.reset();
                resetearFormulario();
                cargarSubcategorias();
            })
            .catch(err => {
                mensajeSubcat.style.color = "#ef4444";
                mensajeSubcat.textContent = "Error al guardar.";
                console.error(err);
            });
        } else {
            // MODO MODIFICAR: Actualiza masivamente a todos los productos que tenían la subcategoría antigua
            const promesas = inventarioGlobal.map(row => {
                const subRow = (row.listasubcategoria || row.subcategoria || "").toLowerCase().trim();
                if (subRow === nombreAntiguo) {
                    return fetch(`${API_URL}/id/${row.id}`, {
                        method: 'PATCH',
                        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                        body: JSON.stringify({ data: { listasubcategoria: nombreNuevo } })
                    }).then(res => res.json());
                }
                return Promise.resolve();
            });

            Promise.all(promesas).then(() => {
                mensajeSubcat.style.color = "#22c55e";
                mensajeSubcat.textContent = "¡Subcategoría actualizada con éxito!";
                formSubcategoria.reset();
                resetearFormulario();
                cargarSubcategorias();
            }).catch(err => {
                mensajeSubcat.style.color = "#ef4444";
                mensajeSubcat.textContent = "Error al actualizar.";
                console.error(err);
            });
        }
    });

    function eliminarSubcategoria(subVal) {
        if (!confirm(`¿Estás seguro de eliminar la subcategoría "${subVal}"? Los productos asociados quedarán sin subcategoría.`)) return;

        const promesas = inventarioGlobal.map(row => {
            const subRow = (row.listasubcategoria || row.subcategoria || "").toLowerCase().trim();
            if (subRow === subVal) {
                return fetch(`${API_URL}/id/${row.id}`, {
                    method: 'PATCH',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: { listasubcategoria: "" } })
                }).then(res => res.json());
            }
            return Promise.resolve();
        });

        Promise.all(promesas).then(() => {
            alert("Subcategoría eliminada correctamente.");
            cargarSubcategorias();
        }).catch(err => {
            alert("Error al intentar eliminar.");
            console.error(err);
        });
    }

    function resetearFormulario() {
        formSubcategoria.reset();
        inputSubcatAntigua.value = "";
        formTitulo.textContent = "Registrar Nueva Subcategoría";
        btnGuardar.textContent = "Guardar Nueva Subcategoría";
        btnGuardar.classList.remove("btn-modo-actualizar");
        btnCancelarEdicion.style.display = "none";
    }

    function capitalizar(texto) {
        if (!texto) return "";
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }
});