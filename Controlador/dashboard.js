// Se ejecuta cuando el HTML termina de cargar
document.addEventListener('DOMContentLoaded', () => {
    // Verifica si el usuario inició sesión
    const logueado = localStorage.getItem('logueado');

    // Si no está logueado, lo devuelve al login
    if (logueado !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // Obtiene el nombre y rol guardados en el navegador
    const nombre = localStorage.getItem('nombre');
    const rol = (localStorage.getItem('rol') || '').toLowerCase();

    // Muestra el nombre del usuario en la barra superior
    document.getElementById('nombreUsuario').textContent = nombre;

    // Muestra solo las tarjetas que corresponden al rol del usuario
    if (rol === 'admin') {
        document.getElementById('tarjetasAdministrador').classList.remove('d-none');
        document.getElementById('tarjetasAsociado').classList.add('d-none');

        // Consulta cuántas solicitudes de comprobante pendientes tiene el administrador
        fetch('../Modelo/gestionComprobantes.php', { method: 'GET', credentials: 'same-origin' })
            .then((r) => (r.ok ? r.json() : null))
            .then((res) => {
                if (res && res.success) {
                    const total = Number(res.pendientes || 0);
                    const badgeCard = document.getElementById('badgeSolicitudesCard');
                    if (badgeCard) {
                        badgeCard.textContent = total;
                        badgeCard.style.backgroundColor = total > 0 ? '#d92d46' : '#1b6b66';
                    }
                    if (typeof window.actualizarContadorSolicitudes === 'function') {
                        window.actualizarContadorSolicitudes(total);
                    }
                }
            })
            .catch(() => {});
    } else {
        document.getElementById('tarjetasAdministrador').classList.add('d-none');
        document.getElementById('tarjetasAsociado').classList.remove('d-none');
    }
});

// Función que se ejecuta al hacer clic en "Cerrar sesión"
async function cerrarSesion() {
    try {
        // Envía una petición POST al servidor para destruir la sesión en PHP
        const respuesta = await fetch("../Modelo/cerrar_sesion.php", {
            method: "POST"
        });

        // Convierte la respuesta del servidor (JSON) en un objeto JS
        const resultado = await respuesta.json();

        // Si hubo error HTTP o el servidor indicó fallo, lanza un error
        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.mensaje || 'Error al cerrar sesión');
        }

        // Borra los datos guardados del usuario en el navegador (logueado, rol, nombre)
        localStorage.clear();

        // Redirige al login reemplazando el historial para que no vuelva atrás
        window.location.replace('login.html');

    } catch (error) {
        // Muestra el error en consola y avisa al usuario si algo falla
        console.error("Error al cerrar sesión:", error);
        alert("No se pudo cerrar la sesión: " + error.message);
    }
}
