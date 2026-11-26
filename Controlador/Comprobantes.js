// Controlador de Asociado: subir foto de comprobante + mensaje indicando opcionalmente el préstamo al que abona
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("logueado") !== "true") {
        window.location.replace("login.html");
        return;
    }

    const form = document.getElementById("formComprobante");
    const selectPrestamo = document.getElementById("prestamoComprobante");
    const bannerPrestamo = document.getElementById("bannerPrestamoSeleccionado");
    const textoBannerPrestamo = document.getElementById("textoPrestamoSeleccionado");
    const inputFoto = document.getElementById("fotoComprobante");
    const inputMensaje = document.getElementById("mensajeComprobante");
    const wrapPreview = document.getElementById("wrapPreviewComprobante");
    const imgPreview = document.getElementById("previewComprobante");
    const btnEnviar = document.getElementById("btnEnviarComprobante");
    const btnRecargar = document.getElementById("btnRecargarComprobantes");
    const alerta = document.getElementById("mensajeEstadoComprobante");
    const tabla = document.getElementById("tablaMisComprobantes");
    const imgModal = document.getElementById("imgModalComprobante");
    const modalFoto = new bootstrap.Modal(document.getElementById("modalVerFoto"));

    // Lee si vino desde el botón "Abonar" de un préstamo (ej. Comprobantes.html?idPrestamo=5)
    const paramsUrl = new URLSearchParams(window.location.search);
    let prestamoPreseleccionado = paramsUrl.get("idPrestamo") || "";

    function mostrarMensaje(texto, tipo) {
        alerta.className = `alert alert-${tipo} mb-0 fw-semibold`;
        alerta.textContent = texto;
    }

    function formatearMoneda(valor) {
        return Number(valor || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
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

    // Actualiza el banner superior indicando a qué préstamo está abonando
    function actualizarBannerPrestamo() {
        const opcion = selectPrestamo.options[selectPrestamo.selectedIndex];
        if (selectPrestamo.value && opcion) {
            textoBannerPrestamo.textContent = `Abonando a: ${opcion.textContent}`;
            bannerPrestamo.classList.remove("d-none");
        } else {
            bannerPrestamo.classList.add("d-none");
        }
    }

    // Llena el desplegable con los préstamos del asociado
    function llenarSelectPrestamos(prestamos) {
        const valorActual = prestamoPreseleccionado || selectPrestamo.value;
        selectPrestamo.replaceChildren();

        const optGeneral = document.createElement("option");
        optGeneral.value = "";
        optGeneral.textContent = "Pago general (sin préstamo específico)";
        selectPrestamo.append(optGeneral);

        (prestamos || []).forEach((p) => {
            const opt = document.createElement("option");
            opt.value = String(p.idPrestamos);
            const proposito = p.Proposito ? ` - ${p.Proposito}` : "";
            opt.textContent = `Préstamo #${p.idPrestamos} (${formatearMoneda(p.ValorPrestamo)} / ${p.NumeroCuotas} cuotas${proposito})`;
            selectPrestamo.append(opt);
        });

        if (valorActual) {
            selectPrestamo.value = String(valorActual);
            prestamoPreseleccionado = "";
        }
        actualizarBannerPrestamo();
    }

    selectPrestamo.addEventListener("change", actualizarBannerPrestamo);

    // Vista previa instantánea al elegir una imagen
    inputFoto.addEventListener("change", () => {
        const archivo = inputFoto.files?.[0];
        if (!archivo) {
            wrapPreview.classList.add("d-none");
            return;
        }
        const lector = new FileReader();
        lector.onload = (e) => {
            imgPreview.src = e.target.result;
            wrapPreview.classList.remove("d-none");
        };
        lector.readAsDataURL(archivo);
    });

    // Carga los préstamos del asociado y su historial de comprobantes enviados
    async function cargarMisComprobantes() {
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
                throw new Error(resultado.mensaje || "Error al consultar comprobantes.");
            }

            llenarSelectPrestamos(resultado.misPrestamos || []);

            const lista = resultado.comprobantes || [];
            tabla.replaceChildren();

            if (lista.length === 0) {
                tabla.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Aún no has enviado comprobantes de pago.</td></tr>';
                return;
            }

            lista.forEach((item) => {
                const fila = document.createElement("tr");

                const tdFecha = document.createElement("td");
                tdFecha.className = "text-nowrap";
                tdFecha.textContent = item.fechaEnvio || "-";

                const tdPrestamo = document.createElement("td");
                if (item.idPrestamo) {
                    const badgeP = document.createElement("span");
                    badgeP.className = "badge rounded-pill px-2 py-1";
                    badgeP.style.backgroundColor = "#653fa8";
                    badgeP.textContent = `Préstamo #${item.idPrestamo}${item.ValorPrestamo ? " (" + formatearMoneda(item.ValorPrestamo) + ")" : ""}`;
                    tdPrestamo.append(badgeP);
                } else {
                    tdPrestamo.textContent = "Pago general";
                }

                const tdFoto = document.createElement("td");
                const img = document.createElement("img");
                img.src = item.rutaImagen;
                img.alt = "Comprobante";
                img.className = "miniatura-comprobante";
                img.title = "Clic para ampliar";
                img.addEventListener("click", () => {
                    imgModal.src = item.rutaImagen;
                    modalFoto.show();
                });
                tdFoto.append(img);

                const tdMensaje = document.createElement("td");
                tdMensaje.textContent = item.mensaje;

                const tdEstado = document.createElement("td");
                tdEstado.className = "text-center";
                tdEstado.append(crearBadgeEstado(item.estado));

                fila.append(tdFecha, tdPrestamo, tdFoto, tdMensaje, tdEstado);
                tabla.append(fila);
            });
        } catch (error) {
            console.error("Error al cargar comprobantes:", error);
            tabla.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">${error.message}</td></tr>`;
        }
    }

    // Envía foto, mensaje y el préstamo seleccionado al servidor PHP
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const archivo = inputFoto.files?.[0];
        const textoMensaje = inputMensaje.value.trim();

        if (!archivo) {
            mostrarMensaje("Selecciona una foto del comprobante antes de enviar.", "warning");
            return;
        }
        if (!textoMensaje) {
            mostrarMensaje("Escribe un mensaje explicando tu pago.", "warning");
            return;
        }

        const formData = new FormData();
        formData.append("foto", archivo);
        formData.append("mensaje", textoMensaje);
        if (selectPrestamo.value) {
            formData.append("idPrestamo", selectPrestamo.value);
        }

        btnEnviar.disabled = true;
        mostrarMensaje("Enviando comprobante al administrador...", "info");

        try {
            const respuesta = await fetch("../Modelo/gestionComprobantes.php", {
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
                throw new Error(resultado.mensaje || "No se pudo enviar el comprobante.");
            }

            mostrarMensaje(resultado.mensaje || "Comprobante enviado correctamente.", "success");
            form.reset();
            wrapPreview.classList.add("d-none");
            actualizarBannerPrestamo();
            await cargarMisComprobantes();
        } catch (error) {
            console.error("Error al enviar comprobante:", error);
            mostrarMensaje(error.message || "Error al enviar el comprobante.", "danger");
        } finally {
            btnEnviar.disabled = false;
        }
    });

    btnRecargar.addEventListener("click", cargarMisComprobantes);
    cargarMisComprobantes();
});
