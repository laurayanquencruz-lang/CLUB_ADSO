// ============================================================================
// CONTROLADOR CRUD DE PRÉSTAMOS (Prestamos.js)
// Muestra una tabla independiente por asociado; Admin edita/elimina, Asociado abona
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    // --- PARTE 1: Referencias al DOM y validación de sesión/rol ---
    const formPrestamo = document.getElementById("formPrestamo");
    const contenedorForm = document.getElementById("contenedorFormPrestamo");
    const inputId = document.getElementById("idPrestamos");
    const selectAsociado = document.getElementById("asociadoPrestamo");
    const botonGuardar = document.getElementById("btnGuardarPrestamo");
    const botonCancelar = document.getElementById("btnCancelarPrestamo");
    const botonRecargar = document.getElementById("btnRecargarPrestamos");
    const tituloForm = document.getElementById("tituloFormPrestamo");
    const mensajePrestamo = document.getElementById("mensajePrestamo");
    const listaTablasPrestamos = document.getElementById("listaTablasPrestamos");

    let esAdministrador = (localStorage.getItem("rol") || "").toLowerCase() === "admin";

    if (localStorage.getItem("logueado") !== "true") {
        window.location.replace("login.html");
        return;
    }

    function aplicarPermisosRol() {
        if (!esAdministrador) {
            if (contenedorForm) contenedorForm.classList.add("d-none");
            const contTabla = document.getElementById("contenedorTablaPrestamo");
            if (contTabla) contTabla.classList.replace("col-lg-8", "col-lg-12");
        }
    }

    aplicarPermisosRol();

    // --- PARTE 2: Funciones auxiliares (mensajes, formato COP y llamadas a la API) ---
    function mostrarMensaje(texto, tipo) {
        if (!mensajePrestamo) return;
        mensajePrestamo.className = `alert alert-${tipo} mb-0 fw-semibold`;
        mensajePrestamo.textContent = texto;
        mensajePrestamo.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function formatearMoneda(valor) {
        return Number(valor || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
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

        const respuesta = await fetch("../Modelo/gestionPrestamos.php", opciones);
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

    function crearCelda(texto, clase = "") {
        const td = document.createElement("td");
        if (clase) td.className = clase;
        td.textContent = texto ?? "-";
        return td;
    }

    // Llena el desplegable con los asociados reales de MySQL
    function llenarSelectAsociados(asociados) {
        if (!selectAsociado || !Array.isArray(asociados) || asociados.length === 0) return;
        const valorPrevio = selectAsociado.value;
        selectAsociado.replaceChildren();

        const opcionDefault = document.createElement("option");
        opcionDefault.value = "";
        opcionDefault.textContent = "Seleccione el asociado...";
        opcionDefault.disabled = true;
        opcionDefault.selected = true;
        selectAsociado.append(opcionDefault);

        asociados.forEach((a) => {
            const opt = document.createElement("option");
            opt.value = a.idAsociado;
            opt.textContent = `${a.Nombre} ${a.Apellido} - Doc. ${a.Documento}`;
            selectAsociado.append(opt);
        });

        if (valorPrevio) selectAsociado.value = valorPrevio;
    }

    // --- PARTE 3: Construcción de tarjeta + tabla independiente por asociado ---
    function crearTarjetaAsociado(grupo) {
        const card = document.createElement("div");
        card.className = "card tabla-modulo-card shadow-sm border-0";

        const totalMonto = grupo.prestamos.reduce((acc, p) => acc + Number(p.ValorPrestamo || 0), 0);
        const cant = grupo.prestamos.length;

        const header = document.createElement("div");
        header.className = "card-header py-3 d-flex flex-wrap justify-content-between align-items-center gap-2";

        const titulo = document.createElement("h6");
        titulo.className = "mb-0 fw-bold";
        titulo.style.color = "#452678";
        titulo.innerHTML = '<i class="bi bi-person-badge-fill me-2"></i>';
        titulo.append(document.createTextNode(`${grupo.nombre} (Doc. ${grupo.documento})`));

        const resumen = document.createElement("span");
        resumen.className = "badge rounded-pill px-3 py-2";
        resumen.style.backgroundColor = "#653fa8";
        resumen.textContent = `${cant} ${cant === 1 ? "préstamo" : "préstamos"} · Total: ${formatearMoneda(totalMonto)}`;

        header.append(titulo, resumen);

        const body = document.createElement("div");
        body.className = "card-body p-0";

        const responsive = document.createElement("div");
        responsive.className = "table-responsive";

        const table = document.createElement("table");
        table.className = "table table-hover align-middle mb-0";

        const thead = document.createElement("thead");
        const trHead = document.createElement("tr");
        const encabezados = ["#", "Monto", "Cuotas", "Interés", "Fecha", "Garantía", "Propósito", esAdministrador ? "Acciones" : "Abonar"];
        encabezados.forEach((textoCol, idx) => {
            const th = document.createElement("th");
            th.textContent = textoCol;
            if (idx === encabezados.length - 1) th.className = "text-center";
            trHead.append(th);
        });
        thead.append(trHead);

        const tbody = document.createElement("tbody");
        grupo.prestamos.forEach((p, indice) => {
            const fila = document.createElement("tr");
            fila.append(
                crearCelda(`#${indice + 1}`, "fw-bold text-nowrap"),
                crearCelda(formatearMoneda(p.ValorPrestamo), "text-nowrap"),
                crearCelda(p.NumeroCuotas),
                crearCelda(`${Number(p.TasaInteres || 0)}%`),
                crearCelda(p.FechaPrestamo || "-", "text-nowrap"),
                crearCelda(p.Garantia || "-"),
                crearCelda(p.Proposito || "-")
            );

            const tdAcciones = document.createElement("td");
            tdAcciones.className = "text-center text-nowrap";

            if (esAdministrador) {
                const btnEditar = document.createElement("button");
                btnEditar.type = "button";
                btnEditar.className = "btn btn-sm btn-outline-primary me-1";
                btnEditar.innerHTML = '<i class="bi bi-pencil-square"></i> Editar';
                btnEditar.addEventListener("click", () => cargarEnFormulario(p));

                const btnEliminar = document.createElement("button");
                btnEliminar.type = "button";
                btnEliminar.className = "btn btn-sm btn-outline-danger";
                btnEliminar.innerHTML = '<i class="bi bi-trash"></i> Eliminar';
                btnEliminar.addEventListener("click", () => eliminarPrestamo(p));

                tdAcciones.append(btnEditar, btnEliminar);
            } else {
                const btnAbonar = document.createElement("a");
                btnAbonar.href = `Comprobantes.html?idPrestamo=${encodeURIComponent(p.idPrestamos)}`;
                btnAbonar.className = "btn btn-sm btn-success fw-semibold";
                btnAbonar.innerHTML = '<i class="bi bi-cash-coin me-1"></i> Abonar';
                tdAcciones.append(btnAbonar);
            }

            fila.append(tdAcciones);
            tbody.append(fila);
        });

        table.append(thead, tbody);
        responsive.append(table);
        body.append(responsive);
        card.append(header, body);
        return card;
    }

    // --- PARTE 4: Cargar préstamos desde MySQL y agruparlos por asociado ---
    async function cargarPrestamos() {
        if (!listaTablasPrestamos) return;
        try {
            const resultado = await solicitarApi("GET");
            esAdministrador = (resultado.rol || "").toLowerCase() === "admin";
            aplicarPermisosRol();
            if (esAdministrador) {
                llenarSelectAsociados(resultado.asociados);
            }

            const lista = resultado.prestamos || [];
            listaTablasPrestamos.replaceChildren();

            if (lista.length === 0) {
                listaTablasPrestamos.innerHTML = `
                    <div class="card tabla-modulo-card shadow-sm border-0 p-4 text-center text-muted">
                        No hay préstamos registrados todavía.
                    </div>`;
                return;
            }

            // Agrupa los préstamos por idAsociado manteniendo el orden ascendente
            const grupos = new Map();
            lista.forEach((p) => {
                const clave = String(p.idAsociado);
                if (!grupos.has(clave)) {
                    grupos.set(clave, {
                        idAsociado: p.idAsociado,
                        documento: p.Documento || "-",
                        nombre: `${p.Nombre || ""} ${p.Apellido || ""}`.trim() || "Asociado",
                        prestamos: []
                    });
                }
                grupos.get(clave).prestamos.push(p);
            });

            grupos.forEach((grupo) => {
                listaTablasPrestamos.append(crearTarjetaAsociado(grupo));
            });
        } catch (error) {
            console.error("Error al cargar préstamos:", error);
            listaTablasPrestamos.innerHTML = `
                <div class="card tabla-modulo-card shadow-sm border-0 p-4 text-center text-danger">
                    ${error.message}
                </div>`;
        }
    }

    // --- PARTE 5: Editar, cancelar, eliminar y envío del formulario (POST / PUT) ---
    function cargarEnFormulario(p) {
        inputId.value = p.idPrestamos;
        selectAsociado.value = p.idAsociado;
        document.getElementById("montoPrestamo").value = Number(p.ValorPrestamo);
        document.getElementById("cuotas").value = p.NumeroCuotas;
        document.getElementById("tasaInteres").value = Number(p.TasaInteres);
        document.getElementById("fechaDesembolso").value = p.FechaPrestamo || "";
        document.getElementById("garantia").value = p.Garantia || "";
        document.getElementById("observacionesPrestamo").value = p.Proposito || "";

        tituloForm.innerHTML = `<i class="fas fa-edit me-2"></i> Editar Préstamo #${p.idPrestamos}`;
        botonGuardar.innerHTML = '<i class="fas fa-sync-alt me-2"></i> Actualizar Préstamo';
        botonCancelar.classList.remove("d-none");
        formPrestamo.classList.remove("was-validated");
        mostrarMensaje(`Editando préstamo #${p.idPrestamos} de ${p.Nombre} ${p.Apellido}. Modifica y pulsa Actualizar.`, "info");
        formPrestamo.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function cancelarEdicion() {
        inputId.value = "";
        formPrestamo.reset();
        formPrestamo.classList.remove("was-validated");
        tituloForm.innerHTML = '<i class="fas fa-hand-holding-usd me-2"></i> Registro de Préstamos';
        botonGuardar.innerHTML = '<i class="fas fa-paper-plane me-2"></i> Registrar Préstamo';
        botonCancelar.classList.add("d-none");
    }

    async function eliminarPrestamo(p) {
        const confirmar = confirm(`¿Seguro que deseas eliminar el préstamo #${p.idPrestamos} de ${p.Nombre} ${p.Apellido}?`);
        if (!confirmar) return;

        try {
            const resultado = await solicitarApi("DELETE", { idPrestamos: Number(p.idPrestamos) });
            if (String(inputId.value) === String(p.idPrestamos)) {
                cancelarEdicion();
            }
            mostrarMensaje(resultado.mensaje || "Préstamo eliminado correctamente.", "success");
            await cargarPrestamos();
        } catch (error) {
            mostrarMensaje(error.message || "Error al eliminar el préstamo.", "danger");
        }
    }

    if (botonCancelar) {
        botonCancelar.addEventListener("click", () => {
            cancelarEdicion();
            mensajePrestamo.classList.add("d-none");
        });
    }

    if (botonRecargar) {
        botonRecargar.addEventListener("click", cargarPrestamos);
    }

    if (formPrestamo) {
        formPrestamo.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!formPrestamo.checkValidity()) {
                formPrestamo.classList.add("was-validated");
                mostrarMensaje("Por favor completa todos los campos obligatorios.", "warning");
                return;
            }

            const editando = inputId.value !== "";
            const datos = {
                idAsociado: Number(selectAsociado.value),
                ValorPrestamo: Number(document.getElementById("montoPrestamo").value),
                NumeroCuotas: Number(document.getElementById("cuotas").value),
                TasaInteres: Number(document.getElementById("tasaInteres").value),
                FechaPrestamo: document.getElementById("fechaDesembolso").value,
                Garantia: document.getElementById("garantia").value.trim(),
                Proposito: document.getElementById("observacionesPrestamo").value.trim()
            };
            if (editando) datos.idPrestamos = Number(inputId.value);

            botonGuardar.disabled = true;
            mostrarMensaje(editando ? "Actualizando préstamo..." : "Registrando préstamo...", "info");

            try {
                const resultado = await solicitarApi(editando ? "PUT" : "POST", datos);
                cancelarEdicion();
                mostrarMensaje(resultado.mensaje || "Operación exitosa.", "success");
                await cargarPrestamos();
            } catch (error) {
                console.error("Error en préstamo:", error);
                mostrarMensaje(error.message || "Error al guardar el préstamo.", "danger");
            } finally {
                botonGuardar.disabled = false;
            }
        });
    }

    cargarPrestamos();
});
