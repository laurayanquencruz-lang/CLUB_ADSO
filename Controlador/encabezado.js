// ============================================================================
// ENCABEZADO COMPARTIDO (encabezado.js)
// Dibuja la barra superior según el rol, muestra avatar, contador y cerrar sesión
// ============================================================================

// --- PARTE 1: Función global para cerrar sesión en PHP y limpiar localStorage ---
async function cerrarSesion() {
    try {
        const respuesta = await fetch("../Modelo/cerrar_sesion.php", {
            method: "POST",
            credentials: "same-origin"
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.mensaje || "Error al cerrar sesión");
        }

        localStorage.clear();
        window.location.replace("login.html");
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        alert("No se pudo cerrar la sesión: " + error.message);
    }
}

// --- PARTE 2: Helpers globales para actualizar foto y contador de solicitudes en vivo ---
window.actualizarFotoEncabezado = function (rutaFoto) {
    const imgHeader = document.getElementById("fotoPerfilHeader");
    const iconoHeader = document.getElementById("iconoPerfilHeader");
    if (!imgHeader || !iconoHeader) return;

    if (rutaFoto) {
        imgHeader.src = rutaFoto;
        imgHeader.classList.remove("d-none");
        iconoHeader.classList.add("d-none");
    } else {
        imgHeader.classList.add("d-none");
        iconoHeader.classList.remove("d-none");
    }
};

// Actualiza en vivo el contador de solicitudes pendientes en el encabezado del administrador
window.actualizarContadorSolicitudes = function (total) {
    const badge = document.getElementById("badgeSolicitudesHeader");
    if (!badge) return;
    const cantidad = Number(total || 0);
    badge.textContent = cantidad;
    badge.classList.toggle("d-none", cantidad <= 0);
};

// --- PARTE 3: Construcción e inyección del menú HTML según rol (Admin vs Asociado) ---
function renderizarEncabezado() {
    const contenedor = document.getElementById("encabezado-app");
    if (!contenedor) return;

    const rol = (localStorage.getItem("rol") || "asociado").toLowerCase();
    const esAdmin = rol === "admin";
    const nombreUsuario = localStorage.getItem("nombre") || "Usuario";
    const primerNombre = nombreUsuario.trim().split(" ")[0] || "Perfil";
    const fotoGuardada = localStorage.getItem("fotoPerfil") || "";

    const paginaActual = (window.location.pathname.split("/").pop() || "").toLowerCase();

    // Opciones del menú para Administrador
    const enlacesAdmin = [
        { texto: "Asociados",   href: "Registro.html",                icono: "bi-people",         paginas: ["registro.html", "asociados.html"] },
        { texto: "Actividades", href: "Actividades.html",             icono: "bi-calendar-event", paginas: ["actividades.html"] },
        { texto: "Pagos",       href: "Pagos.html",                   icono: "bi-cash-coin",      paginas: ["pagos.html"] },
        { texto: "Préstamos",   href: "Registros.html",               icono: "bi-bank",           paginas: ["registros.html"] },
        { texto: "Solicitudes", href: "SolicitudesComprobantes.html", icono: "bi-inbox-fill",     paginas: ["solicitudescomprobantes.html"], conBadge: true }
    ];

    // Opciones del menú para Asociado (Perfil, Actividades, Pagos, Préstamos y Subir comprobante)
    const enlacesAsociado = [
        { texto: "Perfil",            href: "Perfil.html",       icono: "bi-person-circle",  paginas: ["perfil.html"] },
        { texto: "Actividades",       href: "Actividades.html",  icono: "bi-calendar-event", paginas: ["actividades.html"] },
        { texto: "Pagos",             href: "Pagos.html",        icono: "bi-cash-coin",      paginas: ["pagos.html"] },
        { texto: "Préstamos",         href: "Registros.html",    icono: "bi-bank",           paginas: ["registros.html"] },
        { texto: "Subir comprobante", href: "Comprobantes.html", icono: "bi-cloud-arrow-up", paginas: ["comprobantes.html"] }
    ];

    const enlaces = esAdmin ? enlacesAdmin : enlacesAsociado;

    const htmlEnlaces = enlaces.map((item) => {
        const esActivo = item.paginas.includes(paginaActual) ? " activo" : "";
        const badgeHtml = item.conBadge
            ? '<span id="badgeSolicitudesHeader" class="badge rounded-pill bg-danger ms-1 d-none">0</span>'
            : "";
        return `
            <a href="${item.href}" class="enlace-gestion${esActivo}">
                <i class="bi ${item.icono}"></i>
                <span>${item.texto}</span>
                ${badgeHtml}
            </a>
        `;
    }).join("");

    const perfilActivo = paginaActual === "perfil.html" ? " activo" : "";

    contenedor.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-gestion">
            <div class="container-fluid">
                <a class="marca-gestion" href="dashboard.html">
                    <i class="bi bi-layers-fill"></i>
                    <span>GESTIÓN</span>
                </a>

                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuPrincipalGestion" aria-controls="menuPrincipalGestion" aria-expanded="false" aria-label="Abrir menú">
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse justify-content-end" id="menuPrincipalGestion">
                    <div class="menu-gestion mt-2 mt-lg-0">
                        ${htmlEnlaces}

                        <!-- Foto de perfil en el encabezado (al hacer clic abre Perfil.html) -->
                        <a href="Perfil.html" class="avatar-header${perfilActivo}" title="Ver mi perfil (${nombreUsuario})">
                            <span class="avatar-header-circulo">
                                <img id="fotoPerfilHeader" src="" alt="Foto" class="d-none">
                                <i id="iconoPerfilHeader" class="bi bi-person-fill"></i>
                            </span>
                            <span class="avatar-header-nombre">${primerNombre}</span>
                        </a>

                        <button type="button" class="btn-cerrar-sesion" id="btnCerrarSesionHeader">
                            <i class="bi bi-box-arrow-right"></i>
                            <span>Cerrar sesión</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    `;

    // Muestra la foto guardada en localStorage (si existe)
    window.actualizarFotoEncabezado(fotoGuardada);

    // Sincroniza la foto real desde MySQL por si se inició sesión antes de agregar esta función
    if (localStorage.getItem("logueado") === "true" && !fotoGuardada) {
        fetch("../Modelo/gestionPerfil.php", { method: "GET", credentials: "same-origin" })
            .then((r) => (r.ok ? r.json() : null))
            .then((res) => {
                if (res && res.success && res.perfil && res.perfil.FotoPerfil) {
                    localStorage.setItem("fotoPerfil", res.perfil.FotoPerfil);
                    window.actualizarFotoEncabezado(res.perfil.FotoPerfil);
                }
            })
            .catch(() => {});
    }

    // Si es administrador, muestra también el contador de solicitudes pendientes en el encabezado
    if (localStorage.getItem("logueado") === "true" && esAdmin) {
        fetch("../Modelo/gestionComprobantes.php", { method: "GET", credentials: "same-origin" })
            .then((r) => (r.ok ? r.json() : null))
            .then((res) => {
                if (res && res.success) {
                    window.actualizarContadorSolicitudes(res.pendientes || 0);
                }
            })
            .catch(() => {});
    }

    const btnCerrar = document.getElementById("btnCerrarSesionHeader");
    if (btnCerrar) {
        btnCerrar.addEventListener("click", cerrarSesion);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderizarEncabezado);
} else {
    renderizarEncabezado();
}
