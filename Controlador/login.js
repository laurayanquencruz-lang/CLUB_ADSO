
const usuarios = [
    { usuario: 'admin@gmail.com', clave: '123', rol: 'admin', nombre: 'admin MR'},
    { usuario: 'laura@gmail.com', clave: '123', rol: 'asociado', nombre: 'Laura Yanquen'}
];

document.getElementById('formlogin').addEventListener('submit', function(e) {
    e.preventDefault();

    alert('Formulario enviado');

    const usuarioInput = document.getElementById('email').value;
    const claveInput = document.getElementById('contraseña').value;

    const usuarioEncontrado = usuarios.find(
        u => u.usuario === usuarioInput && u.clave === claveInput
    );

    if (usuarioEncontrado) {
        localStorage.setItem('logueado', 'true');
        localStorage.setItem('rol', usuarioEncontrado.rol);
        localStorage.setItem('nombre', usuarioEncontrado.nombre);
        window.location.href = 'dashboard.html';
    }else{
        alert('Usuario o contraseña incorrectos');
    }
});