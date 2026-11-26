// ============================================================================
// CONTROLADOR CRUD DE ACTIVIDADES (Actividades.js)
// Maneja listar (GET), crear (POST), editar/actualizar (PUT) y eliminar (DELETE)
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    // --- PARTE 1: Referencias al DOM y estado del rol ---
    const formularioActividad = document.getElementById("formActividad");
    const botonGuardar = document.getElementById("btnGuardarActividad");
    const botonCancelar = document.getElementById("btnCancelarEdicion");
    const botonRecargar = document.getElementById("btnRecargarActividades");
    const tituloForm = document.getElementById("tituloFormActividad");
    const contenedorForm = document.getElementById("contenedorFormActividad");
    const mensajeActividad = document.getElementById("mensajeActividad");
    const tablaActividades = document.getElementById("tablaActividades");
    const colAcciones = document.getElementById("colAccionesActividades");
    const inputId = document.getElementById("idActividad");

    let esAdministrador = (localStorage.getItem("rol") || "").toLowerCase() === "admin";

    // Verifica que el usuario haya iniciado sesión
    if (localStorage.getItem("logueado") !== "true") {
        window.location.replace("login.html");
        return;
    }

    // Si es asociado (no admin), oculta el formulario y la columna de acciones (solo ver y actualizar lista)
    function aplicarPermisosRol() {
        if (!esAdministrador) {
            if (contenedorForm) contenedorForm.classList.add("d-none");
            if (colAcciones) colAcciones.classList.add("d-none");
            const contTabla = document.getElementById("contenedorTablaActividad");
            if (contTabla) contTabla.classList.replace("col-lg-8", "col-lg-12");
        }
    }

    aplicarPermisosRol();

    // Muestra un mensaje de estado (success, danger, warning o info)
    function mostrarMensaje(texto, tipo) {
        if (!mensajeActividad) return;
        const iconos = {
            success: "fa-check-circle",
            danger: "fa-times-circle",
            warning: "fa-exclamation-triangle",
            info: "fa-spinner fa-spin"
        };
        const icono = iconos[tipo] || "fa-info-circle";
        mensajeActividad.className = `alert alert-${tipo} mb-0 fw-semibold`;
        mensajeActividad.innerHTML = `<i class="fas ${icono} me-2"></i>${texto}`;
        mensajeActividad.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // --- PARTE 2: Comunicación con el backend PHP (gestionActividades.php) ---
    async function solicitarApi(metodo, datos = null) {
        const opciones = {
            method: metodo,
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" }
        };
        if (datos !== null) {
            opciones.body = JSON.stringify(datos);
        }

        const respuesta = await fetch("../Modelo/gestionActividades.php", opciones);
        const texto = await respuesta.text();
        let resultado;
        try {
            resultado = JSON.parse(texto);
        } catch {
            throw new Error(`Respuesta inválida del servidor (HTTP ${respuesta.status}).`);
        }

        if (respuesta.status === 401) {
            mostrarMensaje(resultado.mensaje || "Tu sesión expiró. Redirigiendo al login...", "danger");
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

    // Crea una celda <td> segura con texto plano
    function crearCelda(texto) {
        const td = document.createElement("td");
        td.textContent = texto ?? "-";
        return td;
    }

    // --- PARTE 3: Cargar y renderizar la tabla de actividades ---
    async function cargarActividades() {
        if (!tablaActividades) return;
        try {
            const resultado = await solicitarApi("GET");
            esAdministrador = (resultado.rol || "").toLowerCase() === "admin";
            aplicarPermisosRol();
            const lista = resultado.actividades || [];

            tablaActividades.replaceChildren();

            if (lista.length === 0) {
                const fila = document.createElement("tr");
                const celda = document.createElement("td");
                celda.colSpan = esAdministrador ? 8 : 7;
                celda.className = "text-center py-4 text-muted";
                celda.textContent = "No hay actividades registradas todavía.";
                fila.append(celda);
                tablaActividades.append(fila);
                return;
            }

            lista.forEach((act) => {
                const fila = document.createElement("tr");
                const horaCorta = act.HoraInicio ? String(act.HoraInicio).slice(0, 5) : "-";

                fila.append(
                    crearCelda(act.NombreActividad),
                    crearCelda(act.TipoActividad || "-"),
                    crearCelda(act.FechaEvento || "-"),
                    crearCelda(horaCorta),
                    crearCelda(act.Cupos ?? "-"),
                    crearCelda(act.Responsable || "-"),
                    crearCelda(act.Descripcion || "-")
                );

                // Agrega botones Editar y Eliminar si es administrador
                if (esAdministrador) {
                    const tdAcciones = document.createElement("td");
                    tdAcciones.className = "text-center text-nowrap";

                    const btnEditar = document.createElement("button");
                    btnEditar.type = "button";
                    btnEditar.className = "btn btn-sm btn-outline-primary me-1";
                    btnEditar.innerHTML = '<i class="bi bi-pencil-square"></i> Editar';
                    btnEditar.addEventListener("click", () => cargarEnFormulario(act));

                    const btnEliminar = document.createElement("button");
                    btnEliminar.type = "button";
                    btnEliminar.className = "btn btn-sm btn-outline-danger";
                    btnEliminar.innerHTML = '<i class="bi bi-trash"></i> Eliminar';
                    btnEliminar.addEventListener("click", () => eliminarActividad(act));

                    tdAcciones.append(btnEditar, btnEliminar);
                    fila.append(tdAcciones);
                }

                tablaActividades.append(fila);
            });
        } catch (error) {
            console.error("Error al cargar actividades:", error);
            tablaActividades.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">${error.message}</td></tr>`;
        }
    }

    // --- PARTE 4: Acciones de edición, cancelación y eliminación ---
    function cargarEnFormulario(act) {
        inputId.value = act.idActividad;
        document.getElementById("nombreActividad").value = act.NombreActividad || "";
        document.getElementById("tipoActividad").value = act.TipoActividad || "";
        document.getElementById("fechaActividad").value = act.FechaEvento || "";
        document.getElementById("horaInicio").value = act.HoraInicio ? String(act.HoraInicio).slice(0, 5) : "";
        document.getElementById("cupos").value = act.Cupos ?? "";
        document.getElementById("responsable").value = act.Responsable || "";
        document.getElementById("descripcion").value = act.Descripcion || "";

        tituloForm.innerHTML = `<i class="fas fa-edit me-2"></i> Editar Actividad #${act.idActividad}`;
        botonGuardar.innerHTML = '<i class="fas fa-sync-alt me-2"></i> Actualizar Actividad';
        botonGuardar.classList.replace("btn-primary", "btn-warning");
        botonCancelar.classList.remove("d-none");
        formularioActividad.classList.remove("was-validated");
        mostrarMensaje(`Editando la actividad "${act.NombreActividad}". Modifica los campos y pulsa Actualizar.`, "info");
        formularioActividad.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Restaura el formulario al modo "Crear nueva actividad"
    function cancelarEdicion() {
        inputId.value = "";
        formularioActividad.reset();
        formularioActividad.classList.remove("was-validated");
        tituloForm.innerHTML = '<i class="fas fa-calendar-alt me-2"></i> Registro de Actividades';
        botonGuardar.innerHTML = '<i class="fas fa-save me-2"></i> Guardar Actividad';
        botonGuardar.classList.replace("btn-warning", "btn-primary");
        botonCancelar.classList.add("d-none");
    }

    // Elimina una actividad tras confirmar con el usuario
    async function eliminarActividad(act) {
        const confirmar = confirm(`¿Seguro que deseas eliminar la actividad "${act.NombreActividad}"?`);
        if (!confirmar) return;

        try {
            const resultado = await solicitarApi("DELETE", { idActividad: Number(act.idActividad) });
            if (String(inputId.value) === String(act.idActividad)) {
                cancelarEdicion();
            }
            mostrarMensaje(resultado.mensaje || "Actividad eliminada correctamente.", "success");
            await cargarActividades();
        } catch (error) {
            mostrarMensaje(error.message || "Error al eliminar la actividad.", "danger");
        }
    }

    if (botonCancelar) {
        botonCancelar.addEventListener("click", () => {
            cancelarEdicion();
            mensajeActividad.classList.add("d-none");
        });
    }

    if (botonRecargar) {
        botonRecargar.addEventListener("click", cargarActividades);
    }

    // --- PARTE 5: Evento submit del formulario (POST crear / PUT actualizar) ---
    if (formularioActividad) {
        formularioActividad.addEventListener("submit", async (evento) => {
            evento.preventDefault();

            if (!formularioActividad.checkValidity()) {
                formularioActividad.classList.add("was-validated");
                mostrarMensaje("Por favor completa todos los campos obligatorios.", "warning");
                return;
            }

            const editando = inputId.value !== "";
            const datos = {
                nombreActividad: document.getElementById("nombreActividad").value.trim(),
                tipoActividad: document.getElementById("tipoActividad").value,
                fechaActividad: document.getElementById("fechaActividad").value,
                horaInicio: document.getElementById("horaInicio").value,
                cupos: Number(document.getElementById("cupos").value),
                responsable: document.getElementById("responsable").value.trim(),
                descripcion: document.getElementById("descripcion").value.trim()
            };

            if (editando) {
                datos.idActividad = Number(inputId.value);
            }

            botonGuardar.disabled = true;
            mostrarMensaje(editando ? "Actualizando actividad..." : "Guardando actividad...", "info");

            try {
                const resultado = await solicitarApi(editando ? "PUT" : "POST", datos);
                cancelarEdicion();
                mostrarMensaje(resultado.mensaje || (editando ? "Actividad actualizada." : "Actividad guardada."), "success");
                await cargarActividades();
            } catch (error) {
                console.error("Error al guardar/actualizar actividad:", error);
                mostrarMensaje(error.message || "Ocurrió un error al procesar la actividad.", "danger");
            } finally {
                botonGuardar.disabled = false;
            }
        });
    }

    // Carga inicial de la tabla al abrir la página
    cargarActividades();
});
