const formulario = document.getElementById("formRegistro");

formulario.addEventListener("submit", async function (event) {
    event.preventDefault(); 

    const botonGuardar = formulario.querySelector('button[type="submit"]');
    const mensaje = document.getElementById("mensajeRegistro"); 

    const asociado = Object.fromEntries(new FormData(formulario).entries());

    alert("Formulario enviado");
    alert("Datos del asociado: " + JSON.stringify(asociado));

    // validacion de 8 numeros para la contraseña
    if (asociado.contrasena.length < 8) {
        mensaje.textContent = "La contraseña debe tener al menos 8 caracteres.";
        mensaje.style.color = "#e74c3c";
        return;
    }

    if (asociado.contrasena !== asociado.confirmarContrasena) {
        mensaje.textContent = "Las contraseñas no coinciden.";
        mensaje.style.color = "#e74c3c";
        return;
    }

    delete asociado.confirmarContrasena;
    botonGuardar.disabled = true;
    mensaje.textContent = "Guardando...";
    mensaje.style.color = "";

    try {
        const respuesta = await fetch(formulario.action, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(asociado)
        });

        const resultado = await respuesta.json()

        mensaje.textContent = resultado.mensaje;
        mensaje.style.color = resultado.success ? "#27ae60" : "#e74c3c";    

        if (respuesta.ok && resultado.success) {
            formulario.reset();
        }
    } catch (error) {
        console.error("Error al enviar el formulario:", error);
        mensaje.textContent = "Ocurrió un error al enviar el formulario. Por favor, inténtelo de nuevo.";
        mensaje.style.color = "#e74c3c";
    } finally {
        botonGuardar.disabled = false;
    }
});
