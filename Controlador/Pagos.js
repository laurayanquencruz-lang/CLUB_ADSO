// Controlador CRUD de Pagos con tabla independiente por cada asociado
document.addEventListener("DOMContentLoaded", () => {
    const formPago = document.getElementById("formPago");
    const contenedorForm = document.getElementById("contenedorFormPago");
    const inputId = document.getElementById("idPago");
    const selectAsociado = document.getElementById("asociadoPago");
    const botonGuardar = document.getElementById("btnGuardarPago");
    const botonCancelar = document.getElementById("btnCancelarPago");
    const botonRecargar = document.getElementById("btnRecargarPagos");
    const tituloForm = document.getElementById("tituloFormPago");
    const mensajePago = document.getElementById("mensajePago");
    const listaTablasPagos = document.getElementById("listaTablasPagos");

    let esAdministrador = (localStorage.getItem("rol") || "").toLowerCase() === "admin";

    if (localStorage.getItem("logueado") !== "true") {
        window.location.replace("login.html");
        return;
    }

    function aplicarPermisosRol() {
        if (!esAdministrador) {
            if (contenedorForm) contenedorForm.classList.add("d-none");
            const contTabla = document.getElementById("contenedorTablaPago");
            if (contTabla) contTabla.classList.replace("col-lg-8", "col-lg-12");
        }
    }

    aplicarPermisosRol();

    function mostrarMensaje(texto, tipo) {
        if (!mensajePago) return;
        mensajePago.className = `alert alert-${tipo} mb-0 fw-semibold`;
        mensajePago.textContent = texto;
        mensajePago.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

        const respuesta = await fetch("../Modelo/gestionPagos.php", opciones);
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

    // Llena el desplegable con los asociados reales (valor = Documento)
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
            opt.value = a.Documento;
            opt.textContent = `${a.Nombre} ${a.Apellido} - Doc. ${a.Documento}`;
            selectAsociado.append(opt);
        });

        if (valorPrevio) selectAsociado.value = valorPrevio;
    }

    // Construye una tarjeta + tabla independiente para los pagos/abonos de un asociado
    function crearTarjetaAsociado(grupo) {
        const card = document.createElement("div");
        card.className = "card tabla-modulo-card shadow-sm border-0";

        const totalAbonado = grupo.pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0);
        const cant = grupo.pagos.length;

        const header = document.createElement("div");
        header.className = "card-header py-3 d-flex flex-wrap justify-content-between align-items-center gap-2";

        const titulo = document.createElement("h6");
        titulo.className = "mb-0 fw-bold";
        titulo.style.color = "#114f4b";
        titulo.innerHTML = '<i class="bi bi-person-badge-fill me-2"></i>';
        titulo.append(document.createTextNode(`${grupo.nombre} (Doc. ${grupo.documento})`));

        const resumen = document.createElement("span");
        resumen.className = "badge rounded-pill px-3 py-2";
        resumen.style.backgroundColor = "#1b6b66";
        resumen.textContent = `${cant} ${cant === 1 ? "pago" : "pagos"} · Total abonado: ${formatearMoneda(totalAbonado)}`;

        header.append(titulo, resumen);

        const body = document.createElement("div");
        body.className = "card-body p-0";

        const responsive = document.createElement("div");
        responsive.className = "table-responsive";

        const table = document.createElement("table");
        table.className = "table table-hover align-middle mb-0";

        const thead = document.createElement("thead");
        const trHead = document.createElement("tr");
        const encabezados = ["#", "Concepto", "Monto", "Fecha", "Método", "Comprobante", "Observaciones"];
        if (esAdministrador) encabezados.push("Acciones");

        encabezados.forEach((textoCol, idx) => {
            const th = document.createElement("th");
            th.textContent = textoCol;
            if (esAdministrador && idx === encabezados.length - 1) th.className = "text-center";
            trHead.append(th);
        });
        thead.append(trHead);

        const tbody = document.createElement("tbody");
        grupo.pagos.forEach((pago, indice) => {
            const fila = document.createElement("tr");
            fila.append(
                crearCelda(`#${indice + 1}`, "fw-bold text-nowrap"),
                crearCelda(pago.concepto || "-"),
                crearCelda(formatearMoneda(pago.monto), "text-nowrap"),
                crearCelda(pago.fechaPago || "-", "text-nowrap"),
                crearCelda(pago.metodoPago || "-"),
                crearCelda(pago.numeroComprobante || "-"),
                crearCelda(pago.observaciones || "-")
            );

            if (esAdministrador) {
                const tdAcciones = document.createElement("td");
                tdAcciones.className = "text-center text-nowrap";

                const btnEditar = document.createElement("button");
                btnEditar.type = "button";
                btnEditar.className = "btn btn-sm btn-outline-primary me-1";
                btnEditar.innerHTML = '<i class="bi bi-pencil-square"></i> Editar';
                btnEditar.addEventListener("click", () => cargarEnFormulario(pago));

                const btnEliminar = document.createElement("button");
                btnEliminar.type = "button";
                btnEliminar.className = "btn btn-sm btn-outline-danger";
                btnEliminar.innerHTML = '<i class="bi bi-trash"></i> Eliminar';
                btnEliminar.addEventListener("click", () => eliminarPago(pago));

                tdAcciones.append(btnEditar, btnEliminar);
                fila.append(tdAcciones);
            }

            tbody.append(fila);
        });

        table.append(thead, tbody);
        responsive.append(table);
        body.append(responsive);
        card.append(header, body);
        return card;
    }

    // Carga los pagos desde MySQL y los agrupa en una tabla independiente por asociado
    async function cargarPagos() {
        if (!listaTablasPagos) return;
        try {
            const resultado = await solicitarApi("GET");
            esAdministrador = (resultado.rol || "").toLowerCase() === "admin";
            aplicarPermisosRol();
            if (esAdministrador) {
                llenarSelectAsociados(resultado.asociados);
            }

            const lista = resultado.pagos || [];
            listaTablasPagos.replaceChildren();

            if (lista.length === 0) {
                listaTablasPagos.innerHTML = `
                    <div class="card tabla-modulo-card shadow-sm border-0 p-4 text-center text-muted">
                        No hay pagos registrados todavía.
                    </div>`;
                return;
            }

            // Agrupa los pagos por documento del asociado
            const grupos = new Map();
            lista.forEach((pago) => {
                const clave = String(pago.documento);
                if (!grupos.has(clave)) {
                    const nombreCompleto = pago.Nombre
                        ? `${pago.Nombre} ${pago.Apellido || ""}`.trim()
                        : `Asociado ${pago.documento}`;
                    grupos.set(clave, {
                        documento: pago.documento,
                        nombre: nombreCompleto,
                        pagos: []
                    });
                }
                grupos.get(clave).pagos.push(pago);
            });

            grupos.forEach((grupo) => {
                listaTablasPagos.append(crearTarjetaAsociado(grupo));
            });
        } catch (error) {
            console.error("Error al cargar pagos:", error);
            listaTablasPagos.innerHTML = `
                <div class="card tabla-modulo-card shadow-sm border-0 p-4 text-center text-danger">
                    ${error.message}
                </div>`;
        }
    }

    function cargarEnFormulario(pago) {
        inputId.value = pago.idPago;
        selectAsociado.value = pago.documento;
        document.getElementById("conceptoPago").value = pago.concepto || "";
        document.getElementById("montoPago").value = Number(pago.monto);
        document.getElementById("fechaPago").value = pago.fechaPago || "";
        document.getElementById("metodoPago").value = pago.metodoPago || "";
        document.getElementById("comprobante").value = pago.numeroComprobante || "";
        document.getElementById("notasPago").value = pago.observaciones || "";

        tituloForm.innerHTML = `<i class="fas fa-edit me-2"></i> Editar Pago #${pago.idPago}`;
        botonGuardar.innerHTML = '<i class="fas fa-sync-alt me-2"></i> Actualizar Pago';
        botonCancelar.classList.remove("d-none");
        formPago.classList.remove("was-validated");
        mostrarMensaje(`Editando pago #${pago.idPago}. Modifica los campos y pulsa Actualizar.`, "info");
        formPago.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function cancelarEdicion() {
        inputId.value = "";
        formPago.reset();
        formPago.classList.remove("was-validated");
        tituloForm.innerHTML = '<i class="fas fa-cash-register me-2"></i> Registro de Pagos';
        botonGuardar.innerHTML = '<i class="fas fa-check-circle me-2"></i> Registrar Pago';
        botonCancelar.classList.add("d-none");
    }

    async function eliminarPago(pago) {
        const confirmar = confirm(`¿Seguro que deseas eliminar el pago #${pago.idPago} por ${formatearMoneda(pago.monto)}?`);
        if (!confirmar) return;

        try {
            const resultado = await solicitarApi("DELETE", { idPago: Number(pago.idPago) });
            if (String(inputId.value) === String(pago.idPago)) {
                cancelarEdicion();
            }
            mostrarMensaje(resultado.mensaje || "Pago eliminado correctamente.", "success");
            await cargarPagos();
        } catch (error) {
            mostrarMensaje(error.message || "Error al eliminar el pago.", "danger");
        }
    }

    if (botonCancelar) {
        botonCancelar.addEventListener("click", () => {
            cancelarEdicion();
            mensajePago.classList.add("d-none");
        });
    }

    if (botonRecargar) {
        botonRecargar.addEventListener("click", cargarPagos);
    }

    if (formPago) {
        formPago.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!formPago.checkValidity()) {
                formPago.classList.add("was-validated");
                mostrarMensaje("Por favor completa todos los campos obligatorios.", "warning");
                return;
            }

            const editando = inputId.value !== "";
            const datos = {
                documento: selectAsociado.value,
                concepto: document.getElementById("conceptoPago").value,
                monto: Number(document.getElementById("montoPago").value),
                fechaPago: document.getElementById("fechaPago").value,
                metodoPago: document.getElementById("metodoPago").value,
                numeroComprobante: document.getElementById("comprobante").value.trim(),
                observaciones: document.getElementById("notasPago").value.trim()
            };
            if (editando) datos.idPago = Number(inputId.value);

            botonGuardar.disabled = true;
            mostrarMensaje(editando ? "Actualizando pago..." : "Registrando pago...", "info");

            try {
                const resultado = await solicitarApi(editando ? "PUT" : "POST", datos);
                cancelarEdicion();
                mostrarMensaje(resultado.mensaje || "Operación exitosa.", "success");
                await cargarPagos();
            } catch (error) {
                console.error("Error en pago:", error);
                mostrarMensaje(error.message || "Error al guardar el pago.", "danger");
            } finally {
                botonGuardar.disabled = false;
            }
        });
    }

    cargarPagos();
});
