document.addEventListener('DOMContentLoaded', () => {
    const logueado = localStorage.getItem('logueado');

    if(logueado !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    const nombre = localStorage.getItem('nombre');
    const rol = localStorage.getItem('rol');

    document.getElementById('nombreUsuario').textContent = `bienvenido, ${nombre}`;
    if(rol === 'admin') {
        document.getElementById('tarjetasAdministrador').classList.remove('d-none');
        document.getElementById('tarjetaAsociados').classList.add('d-none');
    }else{
        document.getElementById('tarjetasAdministrador').classList.add('d-none');
        document.getElementById('tarjetaAsociados').classList.remove('d-none');
    }
});


function cerrarSecion() {
    localStorage.clear();
    window.location.href = '../Vista/login.html';
}