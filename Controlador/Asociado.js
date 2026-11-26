// ============================================================================
// CONTROLADOR CRUD DE ASOCIADOS (Asociado.js)
// Maneja listar (GET), crear (POST), editar/actualizar (PUT) y eliminar (DELETE)
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    // --- PARTE 1: Referencias a los elementos del formulario y la tabla ---
    const formRegistro = document.getElementById("formRegistroAsociado");
    if (!formRegistro) return;

    const inputId = document.getElementById("idAsociado");
    const botonGuardar = document.getElementById("btnGuardarAsociado");
    const botonCancelar = document.getElementById("btnCancelarAsociado");
    const botonRecargar = document.getElementById("btnRecargarAsociados");
    const tituloForm = document.getElementById("tituloFormAsociado");
    const mensajeRegistro = document.getElementById("mensajeRegistro");
    const tablaAsociados = document.getElementById("tablaAsociados");
    const colAcciones = document.getElementById("colAccionesAsociados");
    const inputPass = document.getElementById("contraseña");
    const inputConfirmar = document.getElementById("confirmarContraseña");

    let esAdministrador = (localStorage.getItem("rol") || "").toLowerCase() === "admin";

    if (localStorage.getItem("logueado") !== "true") {
        window.location.replace("login.html");
        return;
    }

    // Aplica el modo solo lectura cuando el rol es Asociado (solo ver tabla y actualizar lista)
    function aplicarPermisosRol() {
        const contForm = document.getElementById("contenedorFormAsociado");
        const contTabla = document.getElementById("contenedorTablaAsociado");
        const tituloTabla = document.querySelector("#contenedorTablaAsociado .card-header h5");
        if (!esAdministrador) {
            if (contForm) contForm.classList.add("d-none");
            if (colAcciones) colAcciones.classList.add("d-none");
            if (contTabla) contTabla.classList.replace("col-lg-8", "col-lg-12");
            if (tituloTabla) tituloTabla.innerHTML = '<i class="bi bi-person-circle me-2"></i> Mi Perfil';
        }
    }

    aplicarPermisosRol();

    // --- PARTE 2: Mensajes y peticiones HTTP a gestionAsociados.php ---
    function mostrarMensaje(texto, tipo) {
        if (!mensajeRegistro) return;
        mensajeRegistro.className = `alert alert-${tipo} mb-0 fw-semibold`;
        mensajeRegistro.textContent = texto;
        mensajeRegistro.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    async function solicitarApi(metodo, datos = null) {
        const opciones = {
            method: metodo,
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" }
        };
        if (datos !== null) {
            opciones.body = JSON.stringify(datos);
        }

        const respuesta = await fetch("../Modelo/gestionAsociados.php", opciones);
        const texto = await respuesta.text();
        let resultado;
        try {
            resultado = JSON.parse(texto);
        } catch {
            throw new Error(`Respuesta inválida del servidor (HTTP ${respuesta.status}).`);
        }

        if (respuesta.status === 401) {
            mostrarMensaje("Tu sesión expiró. Redirigiendo al login...", "danger");
            setTimeout(() => {
                localStorage.clear();
                window.location.replace("login.html");
            }, 1500);
            throw new Error("Sesión expirada.");
        }

        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.mensaje || `Error en la solicitud (HTTP ${respuesta.status}).`);
        }
        return resultado;
    }

    function crearCelda(texto) {
        const td = document.createElement("td");
        td.textContent = texto ?? "-";
        return td;
    }

    // --- PARTE 3: Cargar y dibujar la tabla de asociados registrados ---
    async function cargarAsociados() {
        if (!tablaAsociados) return;
        try {
            const resultado = await solicitarApi("GET");
            esAdministrador = (resultado.rol || "").toLowerCase() === "admin";
            aplicarPermisosRol();
            const lista = resultado.asociados || [];

            tablaAsociados.replaceChildren();

            if (lista.length === 0) {
                const fila = document.createElement("tr");
                const celda = document.createElement("td");
                celda.colSpan = esAdministrador ? 7 : 6;
                celda.className = "text-center py-4 text-muted";
                celda.textContent = "No hay asociados registrados.";
                fila.append(celda);
                tablaAsociados.append(fila);
                return;
            }

            lista.forEach((asoc) => {
                const fila = document.createElement("tr");
                const nombreCompleto = `${asoc.Nombre || ""} ${asoc.Apellido || ""}`.trim();

                fila.append(
                    crearCelda(asoc.Documento),
                    crearCelda(nombreCompleto),
                    crearCelda(asoc.Ciudad || "-"),
                    crearCelda(asoc.Telefono || "-"),
                    crearCelda(asoc.Email || "-"),
                    crearCelda(asoc.rol || "Asociado")
                );

                if (esAdministrador) {
                    const tdAcciones = document.createElement("td");
                    tdAcciones.className = "text-center text-nowrap";

                    const btnEditar = document.createElement("button");
                    btnEditar.type = "button";
                    btnEditar.className = "btn btn-sm btn-outline-primary me-1";
                    btnEditar.innerHTML = '<i class="bi bi-pencil-square"></i> Editar';
                    btnEditar.addEventListener("click", () => cargarEnFormulario(asoc));

                    const btnEliminar = document.createElement("button");
                    btnEliminar.type = "button";
                    btnEliminar.className = "btn btn-sm btn-outline-danger";
                    btnEliminar.innerHTML = '<i class="bi bi-trash"></i> Eliminar';
                    btnEliminar.addEventListener("click", () => eliminarAsociado(asoc));

                    tdAcciones.append(btnEditar, btnEliminar);
                    fila.append(tdAcciones);
                }

                tablaAsociados.append(fila);
            });
        } catch (error) {
            console.error("Error al cargar asociados:", error);
            tablaAsociados.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">${error.message}</td></tr>`;
        }
    }

    // --- PARTE 4: Cargar en formulario para editar, cancelar edición y eliminar ---
    function cargarEnFormulario(asoc) {
        inputId.value = asoc.idAsociado;
        document.getElementById("documento").value = asoc.Documento || "";
        document.getElementById("nombres").value = asoc.Nombre || "";
        document.getElementById("apellidos").value = asoc.Apellido || "";
        document.getElementById("fechaNacimiento").value = asoc.Fecha_Nacimiento || "";
        document.getElementById("direccion").value = asoc.Direccion_Residencia || "";
        document.getElementById("telefono").value = asoc.Telefono || "";
        document.getElementById("ciudad").value = asoc.Ciudad || "";
        document.getElementById("correo").value = asoc.Email || "";
        document.getElementById("rolAsociado").value = asoc.rol || "Asociado";

        // Selecciona el radio de género correspondiente
        const generoVal = (asoc.Genero || "").toUpperCase();
        const radioGenero = document.querySelector(`input[name="Genero"][value="${generoVal}"]`);
        if (radioGenero) radioGenero.checked = true;

        // Al editar, la contraseña pasa a ser opcional
        inputPass.value = "";
        inputConfirmar.value = "";
        inputPass.required = false;
        inputConfirmar.required = false;
        inputPass.placeholder = "Dejar vacío para mantener la actual";
        inputConfirmar.placeholder = "Dejar vacío para mantener la actual";

        tituloForm.textContent = `Editar Asociado #${asoc.idAsociado}`;
        botonGuardar.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i> Actualizar Asociado';
        botonCancelar.classList.remove("d-none");
        mostrarMensaje(`Editando a ${asoc.Nombre} ${asoc.Apellido}. Modifica y pulsa Actualizar.`, "info");
        formRegistro.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Vuelve el formulario al modo "Crear nuevo asociado"
    function cancelarEdicion() {
        inputId.value = "";
        formRegistro.reset();
        inputPass.required = true;
        inputConfirmar.required = true;
        inputPass.placeholder = "Ingrese su contraseña";
        inputConfirmar.placeholder = "Confirme su contraseña";
        tituloForm.textContent = "Registro de Asociados";
        botonGuardar.innerHTML = '<i class="bi bi-person-plus me-1"></i> Guardar Asociado';
        botonCancelar.classList.add("d-none");
    }

    // Elimina un asociado tras confirmación
    async function eliminarAsociado(asoc) {
        const confirmar = confirm(`¿Seguro que deseas eliminar a ${asoc.Nombre} ${asoc.Apellido} (Doc. ${asoc.Documento})?`);
        if (!confirmar) return;

        try {
            const resultado = await solicitarApi("DELETE", { idAsociado: Number(asoc.idAsociado) });
            if (String(inputId.value) === String(asoc.idAsociado)) {
                cancelarEdicion();
            }
            mostrarMensaje(resultado.mensaje || "Asociado eliminado correctamente.", "success");
            await cargarAsociados();
        } catch (error) {
            mostrarMensaje(error.message || "Error al eliminar el asociado.", "danger");
        }
    }

    if (botonCancelar) {
        botonCancelar.addEventListener("click", () => {
            cancelarEdicion();
            mensajeRegistro.classList.add("d-none");
        });
    }

    if (botonRecargar) {
        botonRecargar.addEventListener("click", cargarAsociados);
    }

    // --- PARTE 5: Envío del formulario (POST para nuevo / PUT para actualizar) ---
    formRegistro.addEventListener("submit", async (e) => {
        e.preventDefault();
        const editando = inputId.value !== "";
        const datos = Object.fromEntries(new FormData(formRegistro).entries());

        if (datos.Contraseña !== datos.ConfirmarContraseña) {
            mostrarMensaje("Las contraseñas no coinciden.", "warning");
            return;
        }
        delete datos.ConfirmarContraseña;

        if (editando) {
            datos.idAsociado = Number(inputId.value);
        } else {
            delete datos.idAsociado;
        }

        botonGuardar.disabled = true;
        mostrarMensaje(editando ? "Actualizando asociado..." : "Guardando asociado...", "info");

        try {
            const resultado = await solicitarApi(editando ? "PUT" : "POST", datos);
            cancelarEdicion();
            mostrarMensaje(resultado.mensaje || "Operación exitosa.", "success");
            await cargarAsociados();
        } catch (error) {
            console.error("Error al guardar/actualizar asociado:", error);
            mostrarMensaje(error.message || "Error al guardar los datos.", "danger");
        } finally {
            botonGuardar.disabled = false;
        }
    });

    cargarAsociados();
});
