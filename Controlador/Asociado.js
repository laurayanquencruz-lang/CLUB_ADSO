const formregistro = document.getElementById('formRegistroAsociado');

formregistro.addEventListener('submit', async function (e) {
    e.preventDefault();
    const botonGuardar = document.querySelector('button[type="submit"]');
    const asociado = Object.fromEntries(new FormData(formregistro).entries());

    if (asociado.Contraseña !== asociado.ConfirmarContraseña) {
        document.getElementById('mensajeRegistro').textContent = 'Las contraseñas no coinciden.';
        return;
    }

    delete asociado.ConfirmarContraseña; // Eliminar el campo de confirmación de contraseña antes de enviar los datos

    botonGuardar.disabled = true; // Deshabilitar el botón de envío
    document.getElementById('mensajeRegistro').textContent = 'Guardando...';
    document.getElementById('mensajeRegistro').dataset.tipo = '';
    try {
        const respuesta = await fetch(formregistro.action,{method: 'POST',headers: {'Content-Type': 'application/json'}, body: JSON.stringify(asociado)});
        // Pasar la respuesta JSON a un objeto JavaScript
        const resultado = await respuesta.json();
        
        document.getElementById('mensajeRegistro').textContent = resultado.mensaje;

        if (respuesta.ok && resultado.success) {
            formregistro.reset(); // Limpiar el formulario si la respuesta es exitosa
        }

    }catch (error) {
        console.error('Error:', error);
        document.getElementById('mensajeRegistro').textContent = 'Error al guardar los datos.';
    } finally {
        botonGuardar.disabled = false; // Habilitar el botón de envío nuevamente
    }

});