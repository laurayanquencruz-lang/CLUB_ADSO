// ============================================================================
// CONTROLADOR DE PERFIL (Perfil.js)
// Carga los datos personales del usuario desde MySQL y permite subir foto
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    // --- PARTE 1: Verificación de sesión activa en el navegador ---
    if (localStorage.getItem("logueado") !== "true") {
        window.location.replace("login.html");
        return;
    }

    // --- PARTE 2: Referencias a los elementos del HTML ---
    const inputFoto = document.getElementById("inputFotoPerfil");
    const btnCambiarFoto = document.getElementById("btnCambiarFoto");
    const btnActualizar = document.getElementById("btnActualizarPerfil");
    const imgAvatar = document.getElementById("imgAvatarPerfil");
    const iconoAvatar = document.getElementById("iconoAvatarPerfil");
    const mensajePerfil = document.getElementById("mensajePerfil");

    // --- PARTE 3: Funciones auxiliares de interfaz (mensajes y vista de foto) ---
    function mostrarMensaje(texto, tipo) {
        if (!mensajePerfil) return;
        mensajePerfil.className = `alert alert-${tipo} mt-3 mb-0 fw-semibold text-start`;
        mensajePerfil.textContent = texto;
    }

    // Muestra la imagen de perfil si existe, o el ícono por defecto
    function mostrarFoto(rutaFoto) {
        if (rutaFoto) {
            imgAvatar.src = rutaFoto;
            imgAvatar.classList.remove("d-none");
            iconoAvatar.classList.add("d-none");
        } else {
            imgAvatar.classList.add("d-none");
            iconoAvatar.classList.remove("d-none");
        }
    }

    // --- PARTE 4: Consultar datos del perfil desde PHP/MySQL (GET) ---
    async function cargarPerfil() {
        try {
            const respuesta = await fetch("../Modelo/gestionPerfil.php", {
                method: "GET",
                credentials: "same-origin"
            });

            const texto = await respuesta.text();
            let resultado;
            try {
                resultado = JSON.parse(texto);
            } catch {
                throw new Error(`Respuesta inválida del servidor (HTTP ${respuesta.status}).`);
            }

            if (respuesta.status === 401) {
                localStorage.clear();
                window.location.replace("login.html");
                return;
            }

            if (!respuesta.ok || !resultado.success) {
                throw new Error(resultado.mensaje || "No se pudo cargar el perfil.");
            }

            const p = resultado.perfil;
            const nombreCompleto = `${p.Nombre || ""} ${p.Apellido || ""}`.trim();

            document.getElementById("perfilNombreTitulo").textContent = nombreCompleto || "Usuario";
            document.getElementById("perfilRolBadge").textContent = p.rol || "Asociado";
            document.getElementById("datoDocumento").textContent = p.Documento || "-";
            document.getElementById("datoNombreCompleto").textContent = nombreCompleto || "-";
            document.getElementById("datoEmail").textContent = p.Email || "-";
            document.getElementById("datoTelefono").textContent = p.Telefono || "-";
            document.getElementById("datoFechaNacimiento").textContent = p.Fecha_Nacimiento || "-";
            document.getElementById("datoGenero").textContent = p.Genero || "-";
            document.getElementById("datoCiudad").textContent = p.Ciudad || "-";
            document.getElementById("datoDireccion").textContent = p.Direccion_Residencia || "-";

            // Actualiza localStorage y la foto del encabezado
            localStorage.setItem("nombre", nombreCompleto);
            localStorage.setItem("fotoPerfil", p.FotoPerfil || "");
            mostrarFoto(p.FotoPerfil || "");

            if (typeof window.actualizarFotoEncabezado === "function") {
                window.actualizarFotoEncabezado(p.FotoPerfil || "");
            }
        } catch (error) {
            console.error("Error al cargar perfil:", error);
            mostrarMensaje(error.message || "Error al cargar los datos del perfil.", "danger");
        }
    }

    // --- PARTE 5: Selección y subida de nueva foto de perfil (POST multipart) ---
    if (btnCambiarFoto && inputFoto) {
        btnCambiarFoto.addEventListener("click", () => inputFoto.click());

        // Sube la foto elegida al servidor PHP y actualiza el encabezado al instante
        inputFoto.addEventListener("change", async () => {
            const archivo = inputFoto.files?.[0];
            if (!archivo) return;

            const formData = new FormData();
            formData.append("foto", archivo);

            btnCambiarFoto.disabled = true;
            mostrarMensaje("Subiendo foto de perfil...", "info");

            try {
                const respuesta = await fetch("../Modelo/gestionPerfil.php", {
                    method: "POST",
                    credentials: "same-origin",
                    body: formData
                });

                const texto = await respuesta.text();
                let resultado;
                try {
                    resultado = JSON.parse(texto);
                } catch {
                    throw new Error(`Respuesta inválida del servidor (HTTP ${respuesta.status}).`);
                }

                if (!respuesta.ok || !resultado.success) {
                    throw new Error(resultado.mensaje || "No se pudo subir la foto.");
                }

                // Guarda la nueva foto y la actualiza tanto aquí como en el encabezado
                localStorage.setItem("fotoPerfil", resultado.fotoPerfil);
                mostrarFoto(resultado.fotoPerfil);

                if (typeof window.actualizarFotoEncabezado === "function") {
                    window.actualizarFotoEncabezado(resultado.fotoPerfil);
                }

                mostrarMensaje(resultado.mensaje || "Foto de perfil actualizada.", "success");
            } catch (error) {
                console.error("Error al subir foto:", error);
                mostrarMensaje(error.message || "Error al subir la foto de perfil.", "danger");
            } finally {
                btnCambiarFoto.disabled = false;
                inputFoto.value = "";
            }
        });
    }

    if (btnActualizar) {
        btnActualizar.addEventListener("click", cargarPerfil);
    }

    cargarPerfil();
});
