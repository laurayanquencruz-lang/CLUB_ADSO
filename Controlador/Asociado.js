const formulario = document.getElementById("formRegistro");

formulario.addEventListener("submit", async function (event) {
    event.preventDefault();

    const botonGuardar = formulario.querySelector('button[type="submit"]');
    const mensaje = document.getElementById("mensajeRegistro");

    const datosFormulario = new FormData(formulario);
    const contrasena = datosFormulario.get("contrasena");
    const confirmarContrasena = datosFormulario.get("confirmarContrasena");

    // Validaciones
    if (contrasena.length < 8) {
        mensaje.textContent = "⚠️ La contraseña debe tener al menos 8 caracteres.";
        mensaje.style.color = "#e74c3c";
        return;
    }

    if (contrasena !== confirmarContrasena) {
        mensaje.textContent = "⚠️ Las contraseñas no coinciden.";
        mensaje.style.color = "#e74c3c";
        return;
    }

    botonGuardar.disabled = true;
    mensaje.textContent = "Guardando...";
    mensaje.style.color = "";

    try {
        // Enviamos los datos tal cual los lee el formulario
        const respuesta = await fetch(formulario.action, {
            method: "POST",
            body: datosFormulario
        });

        const textoRespuesta = await respuesta.text(); // Lee lo que devuelve el PHP
        console.log("Respuesta del servidor:", textoRespuesta); // Muestra en consola

        try {
            const resultado = JSON.parse(textoRespuesta);
            mensaje.textContent = resultado.mensaje;
            mensaje.style.color = resultado.success ? "#27ae60" : "#e74c3c";

            if (respuesta.ok && resultado.success) {
                formulario.reset();
            }
        } catch (e) {
            mensaje.textContent = "El servidor devolvió un error. Revisa GuardarAsociado.php";
            mensaje.style.color = "#e74c3c";
        }

    } catch (error) {
        console.error("Error:", error);
        mensaje.textContent = "Ocurrió un error al enviar. Inténtelo de nuevo.";
        mensaje.style.color = "#e74c3c";
    } finally {
        botonGuardar.disabled = false;
    }
});
