// Busca el formulario de inicio de sesión por el id "formLogin" (o "Login" como respaldo)
const formLogin = document.getElementById('formLogin') || document.getElementById('Login');

// Verifica que el formulario exista en la página antes de agregarle eventos
if (formLogin) {
    // Escucha cuando el usuario presiona el botón "Ingresar" (evento submit)
    formLogin.addEventListener('submit', async function (e) {
        // Evita que el navegador recargue la página de forma tradicional
        e.preventDefault();
        // Obtiene el botón de enviar dentro del formulario para poder deshabilitarlo
        const boton = formLogin.querySelector('button[type="submit"]');
        // Obtiene el párrafo donde se mostrarán los mensajes de estado del login
        const mensaje = document.getElementById('mensajeLogin');

        // Desactiva el botón mientras se validan los datos para evitar doble clic
        if (boton) boton.disabled = true;

        // Si existe el elemento de mensaje, muestra que se están verificando las credenciales
        if (mensaje) {
            mensaje.textContent = "Verificando credenciales..."; // Texto de carga
            mensaje.style.color = "#333";                        // Color gris oscuro
            mensaje.style.fontWeight = "bold";                   // Texto en negrita
        }

        // Bloque try/catch para manejar errores de red o del servidor
        try {
            // Convierte todos los campos del formulario (usuario y contraseña) en un objeto JS
            const datosForm = Object.fromEntries(new FormData(formLogin));
            // Toma la ruta del atributo action del formulario (o usa iniciar_sesion.php por defecto)
            const ruta = formLogin.action || '../Modelo/iniciar_sesion.php';

            // Envía una petición HTTP POST al servidor PHP con los datos en formato JSON
            const respuesta = await fetch(ruta, {
                method: "POST",                                 // Método POST para enviar credenciales
                headers: { "Content-Type": "application/json" },// Indica que el cuerpo va en JSON
                body: JSON.stringify(datosForm)                 // Convierte el objeto JS a texto JSON
            });

            // Variable donde se guardará la respuesta JSON del servidor
            let resultado;
            try {
                // Intenta leer y convertir la respuesta del servidor a objeto JS
                resultado = await respuesta.json();
            } catch {
                // Si el servidor no devolvió un JSON válido, lanza un error con el código HTTP
                throw new Error(`El servidor respondió con código HTTP ${respuesta.status}`);
            }

            // Si el servidor indicó que las credenciales no son válidas (success === false)
            if (!resultado.success) {
                // Muestra el mensaje de error en rojo debajo del formulario
                if (mensaje) {
                    mensaje.textContent = resultado.error || resultado.message || resultado.mensaje || "Usuario o contraseña incorrectos.";
                    mensaje.style.color = "red";
                    mensaje.style.fontWeight = "bold";
                } else {
                    // Si no hay elemento de mensaje, muestra una ventana emergente alert
                    alert(resultado.error || resultado.message || resultado.mensaje || "Usuario o contraseña incorrectos.");
                }
                // Detiene el proceso para no redirigir al panel
                return;
            }

            // Guarda en el navegador (localStorage) que el usuario está autenticado
            localStorage.setItem('logueado', 'true');
            // Guarda el rol devuelto por PHP (admin o asociado)
            localStorage.setItem('rol', resultado.rol || resultado.Rol || 'Asociado');
            // Guarda el nombre completo para mostrarlo en el dashboard
            localStorage.setItem('nombre', resultado.nombre || 'Asociado');
            // Guarda la ruta de la foto de perfil para mostrarla en el encabezado
            localStorage.setItem('fotoPerfil', resultado.fotoPerfil || '');

            // Muestra un mensaje verde indicando que el inicio de sesión fue correcto
            if (mensaje) {
                mensaje.textContent = "¡Inicio de sesión exitoso! Redirigiendo...";
                mensaje.style.color = "green";
                mensaje.style.fontWeight = "bold";
            }

            // Espera 600 milisegundos (0.6 s) y redirige al panel principal
            setTimeout(() => {
                window.location.href = '../Vista/dashboard.html';
            }, 600);

        } catch (error) {
            // Imprime el error en la consola del navegador (F12) para depuración
            console.error('Error al iniciar sesión:', error);
            // Muestra el error en rojo en pantalla o con un alert si no existe el párrafo
            if (mensaje) {
                mensaje.textContent = error.message || "Ocurrió un error al intentar iniciar sesión.";
                mensaje.style.color = "red";
                mensaje.style.fontWeight = "bold";
            } else {
                alert("Ocurrió un error al intentar iniciar sesión.");
            }
        } finally {
            // Siempre vuelve a activar el botón al finalizar (haya salido bien o mal)
            if (boton) boton.disabled = false;
        }
    });
}
