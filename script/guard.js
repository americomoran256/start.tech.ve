// Script de protección para páginas de administración
document.addEventListener("DOMContentLoaded", function() {
    // Verifica si el usuario ha iniciado sesión correctamente
    if (sessionStorage.getItem("auth_starttech") !== "true") {
        // Si no hay sesión activa, redirige inmediatamente al login
        window.location.href = "system.html";
    }
});