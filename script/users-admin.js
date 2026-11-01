document.addEventListener("DOMContentLoaded", function() {
    const API_URL = 'https://sheetdb.io/api/v1/hzufdm2jniqtd';

    const tablaUsuariosBody = document.getElementById("tabla-usuarios-body");
    const formUser = document.getElementById("form-user");
    const formTitulo = document.getElementById("form-titulo");
    const inputUsuario = document.getElementById("input-usuario");
    const inputPassword = document.getElementById("input-password");
    const btnGuardar = document.getElementById("btn-guardar");
    const btnCancelar = document.getElementById("btn-cancelar");
    const mensajeUser = document.getElementById("mensaje-user");
    const formContainer = document.getElementById("form-container");

    let modoEdicion = false; // False = Crear, True = Modificar contraseña

    function cargarUsuarios() {
        fetch(API_URL)
            .then(response => response.json())
            .then(data => {
                if (!Array.isArray(data)) return;
                
                const totalUsuarios = data.length;
                tablaUsuariosBody.innerHTML = "";

                data.forEach(row => {
                    const tr = document.createElement("tr");
                    
                    let botonEliminarHTML = '';
                    if (totalUsuarios <= 1) {
                        botonEliminarHTML = `<button type="button" class="btn-accion btn-eliminar" style="opacity: 0.5; cursor: not-allowed;" title="No puedes eliminar al último administrador">Eliminar</button>`;
                    } else {
                        botonEliminarHTML = `<button type="button" class="btn-accion btn-eliminar" data-user="${row.usuario}">Eliminar</button>`;
                    }

                    tr.innerHTML = `
                        <td>${row.usuario}</td>
                        <td>••••••••</td>
                        <td>
                            <button type="button" class="btn-accion btn-editar" data-user="${row.usuario}">Cambiar Clave</button>
                            ${botonEliminarHTML}
                        </td>
                    `;
                    tablaUsuariosBody.appendChild(tr);
                });

                document.querySelectorAll(".btn-eliminar[data-user]").forEach(btn => {
                    btn.addEventListener("click", function() {
                        const usuarioAEliminar = this.getAttribute("data-user");
                        if (usuarioAEliminar && usuarioAEliminar !== "null") {
                            eliminarUsuario(usuarioAEliminar, totalUsuarios);
                        }
                    });
                });

                document.querySelectorAll(".btn-editar").forEach(btn => {
                    btn.addEventListener("click", function() {
                        const usuarioAEditar = this.getAttribute("data-user");
                        if (usuarioAEditar && usuarioAEditar !== "null") {
                            prepararModificacion(usuarioAEditar);
                        }
                    });
                });
            })
            .catch(error => console.error("Error al cargar usuarios:", error));
    }

    cargarUsuarios();

    btnCancelar.addEventListener("click", function() {
        resetearFormularioUser();
        mensajeUser.textContent = "";
    });

    function prepararModificacion(usuario) {
        modoEdicion = true;
        formTitulo.textContent = `Cambiar Clave para: ${usuario}`;
        inputUsuario.value = usuario;
        inputUsuario.setAttribute("readonly", true);
        inputPassword.value = "";
        btnGuardar.textContent = "Actualizar Contraseña";
        btnGuardar.classList.add("btn-modo-actualizar");
        btnCancelar.style.display = "inline-block";
        mensajeUser.textContent = "";

        formContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }

    function resetearFormularioUser() {
        modoEdicion = false;
        formUser.reset();
        inputUsuario.removeAttribute("readonly");
        formTitulo.textContent = "Agregar Nuevo Administrador";
        btnGuardar.textContent = "Guardar Administrador";
        btnGuardar.classList.remove("btn-modo-actualizar");
        btnCancelar.style.display = "none";
    }

    formUser.addEventListener("submit", function(e) {
        e.preventDefault();
        const usuarioVal = inputUsuario.value.trim();
        const passwordVal = inputPassword.value.trim();

        if (!usuarioVal || !passwordVal) return;

        if (passwordVal.length < 8) {
            mensajeUser.style.color = "#ef4444";
            mensajeUser.textContent = "La contraseña debe tener al menos 8 caracteres.";
            return;
        }

        const contraseniasDebiles = [
            "12345678", "01234567", "23456789", "34567890", 
            "45678901", "56789012", "67890123", "78901234", 
            "89012345", "90123456", "1234abcd", "password", 
            "admin123", "123456789", "abcdefgh"
        ];

        if (contraseniasDebiles.includes(passwordVal.toLowerCase())) {
            mensajeUser.style.color = "#ef4444";
            mensajeUser.textContent = "Por seguridad, no puedes usar contraseñas secuenciales o fáciles de adivinar.";
            return;
        }

        mensajeUser.style.color = "#38bdf8";
        mensajeUser.textContent = "Guardando cambios...";

        if (!modoEdicion) {
            fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: [
                        { usuario: usuarioVal, password: passwordVal }
                    ]
                })
            })
            .then(response => response.json())
            .then(() => {
                mensajeUser.style.color = "#22c55e";
                mensajeUser.textContent = "¡Usuario creado con éxito!";
                resetearFormularioUser();
                cargarUsuarios();
            })
            .catch(error => {
                mensajeUser.style.color = "#ef4444";
                mensajeUser.textContent = "Error al crear el usuario.";
                console.error(error);
            });
        } else {
            fetch(`${API_URL}/usuario/${usuarioVal}`, {
                method: 'PATCH',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: { password: passwordVal }
                })
            })
            .then(response => response.json())
            .then(() => {
                mensajeUser.style.color = "#22c55e";
                mensajeUser.textContent = "¡Contraseña actualizada con éxito!";
                resetearFormularioUser();
                cargarUsuarios();
            })
            .catch(error => {
                mensajeUser.style.color = "#ef4444";
                mensajeUser.textContent = "Error al actualizar la contraseña.";
                console.error(error);
            });
        }
    });

    function eliminarUsuario(usuario, totalUsuarios) {
        if (totalUsuarios <= 1) {
            alert("No puedes eliminar al único administrador disponible en el sistema.");
            return;
        }

        if (!confirm(`¿Estás seguro de eliminar al usuario "${usuario}"?`)) return;

        fetch(`${API_URL}/usuario/${usuario}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(() => {
            alert("Usuario eliminado correctamente.");
            cargarUsuarios();
        })
        .catch(error => {
            alert("Error al intentar eliminar el usuario.");
            console.error(error);
        });
    }
});