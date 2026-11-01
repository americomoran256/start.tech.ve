document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById("login-form");
    const errorMsg = document.getElementById("error-login");

    // URL de tu API de SheetDB para administradores
    const API_URL = 'https://sheetdb.io/api/v1/hzufdm2jniqtd';

    // Si ya hay una sesión activa, redirigir directamente a admin.html
    if (sessionStorage.getItem("auth_starttech") === "true") {
        window.location.href = "admin.html";
        return;
    }

    // Manejar el evento de inicio de sesión consultando la base de datos
    loginForm.addEventListener("submit", function(e) {
        e.preventDefault();
        const userIngresado = document.getElementById("usuario").value.trim();
        const passIngresada = document.getElementById("password").value.trim();

        // Consultamos los registros en SheetDB para validar el usuario
        fetch(API_URL)
            .then(response => response.json())
            .then(data => {
                if (!Array.isArray(data)) {
                    throw new Error("Respuesta inválida de la API");
                }

                // Buscamos coincidencia en usuario y password
                const adminEncontrado = data.find(row => 
                    row.usuario === userIngresado && row.password === passIngresada
                );

                if (adminEncontrado) {
                    // Guardamos la sesión y redirigimos a admin.html
                    sessionStorage.setItem("auth_starttech", "true");
                    sessionStorage.setItem("username_starttech", userIngresado); // <--- Aquí guardamos el usuario
                    errorMsg.style.display = "none";
                    loginForm.reset();
                    window.location.href = "admin.html";
                } else {
                    // Credenciales incorrectas
                    errorMsg.style.display = "block";
                }
            })
            .catch(error => {
                console.error("Error al conectar con la base de datos de usuarios:", error);
                errorMsg.textContent = "Error de conexión al validar credenciales.";
                errorMsg.style.display = "block";
            });
    });
});