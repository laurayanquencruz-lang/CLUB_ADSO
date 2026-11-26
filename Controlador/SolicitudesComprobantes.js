// ============================================================================
// CONTROLADOR DE SOLICITUDES DE COMPROBANTE (SolicitudesComprobantes.js - Admin)
// Muestra comprobantes recibidos, préstamo abonado, foto ampliada y acciones Aprobar/Rechazar
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {
    // --- PARTE 1: Validación de sesión de administrador y referencias al DOM ---
    const rol = (localStorage.getItem("rol") || "").toLowerCase();
    if (localStorage.getItem("logueado") !== "true") {
        window.location.replace("login.html");
        return;
    }
    if (rol !== "admin") {
        window.location.replace("dashboard.html");
        return;
    }

    const tabla = document.getElementById("tablaSolicitudesComprobantes");
    const alerta = document.getElementById("mensajeSolicitudes");
    const badgePagina = document.getElementById("badgePendientesPagina");
    const btnRecargar = document.getElementById("btnRecargarSolicitudes");
    const imgModal = document.getElementById("imgModalSolicitud");
    const tituloModal = document.getElementById("tituloModalSolicitud");
    const mensajeModal = document.getElementById("mensajeModalSolicitud");
    const modal = new bootstrap.Modal(document.getElementById("modalVerSolicitud"));

    // --- PARTE 2: Mensajes, contadores de pendientes y formato de préstamo ---
    function mostrarMensaje(texto, tipo) {
        alerta.className = `alert alert-${tipo} mb-3 fw-semibold`;
        alerta.textContent = texto;
    }

    function actualizarContadores(pendientes) {
        const total = Number(pendientes || 0);
        badgePagina.textContent = total === 1 ? "1 pendiente" : `${total} pendientes`;
        badgePagina.className = `badge rounded-pill fs-6 px-3 ${total > 0 ? "bg-danger" : "bg-success"}`;

        if (typeof window.actualizarContadorSolicitudes === "function") {
            window.actualizarContadorSolicitudes(total);
        }
    }

    function formatearMoneda(valor) {
        return Number(valor || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
    }

    function describirPrestamo(sol) {
        if (!sol.idPrestamo) return "Pago general";
        const monto = sol.ValorPrestamo ? ` - ${formatearMoneda(sol.ValorPrestamo)}` : "";
        const cuotas = sol.NumeroCuotas ? ` (${sol.NumeroCuotas} cuotas)` : "";
        return `Préstamo #${sol.idPrestamo}${monto}${cuotas}`;
    }

    function crearBadgeEstado(estado) {
        const span = document.createElement("span");
        const colores = {
            Pendiente: "bg-warning text-dark",
            Aprobado:  "bg-success text-white",
            Rechazado: "bg-danger text-white"
        };
        span.className = `badge rounded-pill px-3 py-2 ${colores[estado] || "bg-secondary"}`;
        span.textContent = estado;
        return span;
    }

    // --- PARTE 3: Consultar solicitudes recibidas y construir la tabla (GET) ---
    async function cargarSolicitudes() {
        try {
            const respuesta = await fetch("../Modelo/gestionComprobantes.php", {
                method: "GET",
                credentials: "same-origin"
            });

            if (respuesta.status === 401) {
                localStorage.clear();
                window.location.replace("login.html");
                return;
            }

            const resultado = await respuesta.json();
            if (!respuesta.ok || !resultado.success) {
                throw new Error(resultado.mensaje || "No se pudieron cargar las solicitudes.");
            }

            actualizarContadores(resultado.pendientes);
            const lista = resultado.comprobantes || [];
            tabla.replaceChildren();

            if (lista.length === 0) {
                tabla.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No hay solicitudes de comprobante por el momento.</td></tr>';
                return;
            }

            lista.forEach((sol) => {
                const fila = document.createElement("tr");
                const nombre = sol.Nombre
                    ? `${sol.Nombre} ${sol.Apellido || ""} (Doc. ${sol.documento})`.trim()
                    : `Doc. ${sol.documento}`;
                const textoPrestamo = describirPrestamo(sol);

                const tdAsociado = document.createElement("td");
                tdAsociado.textContent = nombre;

                const tdPrestamo = document.createElement("td");
                if (sol.idPrestamo) {
                    const badgePrestamo = document.createElement("span");
                    badgePrestamo.className = "badge rounded-pill px-3 py-2";
                    badgePrestamo.style.backgroundColor = "#653fa8";
                    badgePrestamo.textContent = textoPrestamo;
                    tdPrestamo.append(badgePrestamo);
                } else {
                    const badgeGeneral = document.createElement("span");
                    badgeGeneral.className = "badge rounded-pill bg-secondary px-3 py-2";
                    badgeGeneral.textContent = "Pago general";
                    tdPrestamo.append(badgeGeneral);
                }

                const tdFecha = document.createElement("td");
                tdFecha.className = "text-nowrap";
                tdFecha.textContent = sol.fechaEnvio || "-";

                const tdFoto = document.createElement("td");
                const img = document.createElement("img");
                img.src = sol.rutaImagen;
                img.alt = "Comprobante";
                img.className = "miniatura-solicitud";
                img.title = "Clic para ver en grande";
                img.addEventListener("click", () => {
                    tituloModal.textContent = `Comprobante de ${nombre}`;
                    imgModal.src = sol.rutaImagen;
                    mensajeModal.textContent = `Abono para: ${textoPrestamo} | Mensaje: ${sol.mensaje}`;
                    modal.show();
                });
                tdFoto.append(img);

                const tdMensaje = document.createElement("td");
                tdMensaje.textContent = sol.mensaje;

                const tdEstado = document.createElement("td");
                tdEstado.className = "text-center";
                tdEstado.append(crearBadgeEstado(sol.estado));

                const tdAcciones = document.createElement("td");
                tdAcciones.className = "text-center text-nowrap";

                const btnAprobar = document.createElement("button");
                btnAprobar.type = "button";
                btnAprobar.className = "btn btn-sm btn-success me-1";
                btnAprobar.innerHTML = '<i class="bi bi-check-lg"></i> Aprobar';
                btnAprobar.disabled = sol.estado === "Aprobado";
                btnAprobar.addEventListener("click", () => cambiarEstado(sol.idComprobante, "Aprobado"));

                const btnRechazar = document.createElement("button");
                btnRechazar.type = "button";
                btnRechazar.className = "btn btn-sm btn-warning text-dark me-1";
                btnRechazar.innerHTML = '<i class="bi bi-x-lg"></i> Rechazar';
                btnRechazar.disabled = sol.estado === "Rechazado";
                btnRechazar.addEventListener("click", () => cambiarEstado(sol.idComprobante, "Rechazado"));

                const btnEliminar = document.createElement("button");
                btnEliminar.type = "button";
                btnEliminar.className = "btn btn-sm btn-outline-danger";
                btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
                btnEliminar.title = "Eliminar solicitud";
                btnEliminar.addEventListener("click", () => eliminarSolicitud(sol));

                tdAcciones.append(btnAprobar, btnRechazar, btnEliminar);

                fila.append(tdAsociado, tdPrestamo, tdFecha, tdFoto, tdMensaje, tdEstado, tdAcciones);
                tabla.append(fila);
            });
        } catch (error) {
            console.error("Error al cargar solicitudes:", error);
            tabla.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">${error.message}</td></tr>`;
        }
    }

    // --- PARTE 4: Aprobar / Rechazar (PUT) y Eliminar solicitud (DELETE) ---
    async function cambiarEstado(idComprobante, nuevoEstado) {
        try {
            const respuesta = await fetch("../Modelo/gestionComprobantes.php", {
                method: "PUT",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idComprobante: Number(idComprobante), estado: nuevoEstado })
            });
            const resultado = await respuesta.json();
            if (!respuesta.ok || !resultado.success) {
                throw new Error(resultado.mensaje || "No se pudo actualizar el estado.");
            }
            mostrarMensaje(resultado.mensaje, "success");
            await cargarSolicitudes();
        } catch (error) {
            mostrarMensaje(error.message || "Error al actualizar el estado.", "danger");
        }
    }

    async function eliminarSolicitud(sol) {
        if (!confirm(`¿Eliminar la solicitud #${sol.idComprobante}?`)) return;
        try {
            const respuesta = await fetch("../Modelo/gestionComprobantes.php", {
                method: "DELETE",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idComprobante: Number(sol.idComprobante) })
            });
            const resultado = await respuesta.json();
            if (!respuesta.ok || !resultado.success) {
                throw new Error(resultado.mensaje || "No se pudo eliminar la solicitud.");
            }
            mostrarMensaje(resultado.mensaje, "success");
            await cargarSolicitudes();
        } catch (error) {
            mostrarMensaje(error.message || "Error al eliminar la solicitud.", "danger");
        }
    }

    btnRecargar.addEventListener("click", cargarSolicitudes);
    cargarSolicitudes();
});
