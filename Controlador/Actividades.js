const listaActividades = document.getElementById("listaActividades");
let esAdministrador = false;
let actividades=[];
let accionesConfiguradas = false;
const formularioActividad = document.getElementById("formActividad");
const modalActividad=new bootstrap.Modal(
    document.getElementById("modalActividad"),
);

async function solicitarApi(metodo,datos) {
    const opciones = {
        method: metodo,
        headers: {'Content-Type': 'application/json'},
    }

    if(datos){
        opciones.body = JSON.stringify(datos);
    }

    const respuesta= await fetch("../Modelo/gestionActividades.php",opciones);
    const resultado = await respuesta.json();

    if(!respuesta.status === 401){
        window.location.href = "login.html";
    }

    if(!respuesta.ok || !resultado.success){
        throw new Error(resultado.mensaje || "Error al procesar la solicitud.");
    }

    return resultado;

}

async function cargaractividades(){
    try{
        const resultado = await solicitarApi("GET");
        
        esAdministrador = resultado.rol === "Admin";
        configurarAcciones();

        actividades = resultado.actividades;
        mostrarActividades();
    }catch (error){
        alert("Error al cargar actividades: " + error.message);
    }

function mostrarActividades() {
        listaActividades.replaceChildren();

        if (actividades.length === 0) {
            const fila = document.createElement("tr");
            const celda = document.createElement("td");
            celda.colSpan = esAdministrador ? 5 : 4;
            celda.className = "text-center py-4 text-muted";
            celda.textContent = "No hay actividades disponibles.";
            fila.append(celda);
            listaActividades.append(fila);
            return;    
        }

        actividades.forEach((actividad) => {
            const fila = document.createElement("tr");
            fila.append(
                crearCelda(actividad.nombreActividad),
                crearCelda(actividad.FechaEvento),
                crearCelda(actividad.Municipio),
                crearCelda(actividad.totalRecaudado===null?"Pendiente":Number(actividad.totalRecaudado).toLocaleString("es-CO",{style:"currency",currency:"COP"})),
            );
            if(esAdminstrador){
                const acciones = document.createElement("td");
                acciones.className = "text-nowrap";

                const botonEditar = document.createElement("button");
                botonEditar.type = "button";
                botonEditar.className="btn btn-sm btn-outline-primary me-2";
                botonEditar.innerHTML = '<i class="bi bi-pencil-square"></i>';
                botonEditar.addEventListener("click", () => abrirEdiciom(actividad));

                const botonEliminar = document.createElement("button");
                botonEliminar.type = "button";
                botonEliminar.className="btn btn-sm btn-outline-danger";
                botonEliminar.innerHTML = '<i class="bi bi-trash"></i>';
                botonEliminar.addEventListener("click", () => eliminarActividad(actividad));

                acciones.append(botonEditar, botonEliminar);
                fila.append(acciones);
            }
            listaActividades.apppend(fila);
        });      
    }

    function crearCelda(texto){
        const celda = document.createElement("td");
        celda.textContent = texto;
        return celda;
    }
}

async function eliminarActividad(actividad){
    window.confirm(`¿Deseas eliminar la actividad "${actividad.nombreActividad}"?`,);

    if(!confirmar){
        return;
    }

    try{
        await solicitarApi("DELETE",{idActividad:actividad.idActividad});
        await cargaractividades();
        alert("actividad eliminada correctamente");
    }catch (error) {
        alert(error.message);
    }    
}

function configurarAcciones(){
    if(accionesConfiguradas){
        return;
    }
    const botonNueva = document.getElementById("nuevaActividad");
    const encabezadoAcciones = document.getElementById("encabezadoAcciones");

    if(esAdministrador){
        botonNueva.classList.remove("d-none");
        encabezadoAcciones.classList.remove("d-none");
        accionesConfiguradas = true;
        return;
    }
}

function abrirEdicion(actividad){
    formularioActividad.reset();
    document.getElementById("idActividad").value=actividad.idActividad;
    document.getElementById("NombreActividad").values=actividad.nombreActividad;
    document.getElementById("FechaEvento").values=actividad.FechaEvento;
    document.getElementById("Municipio").value=actividad.Municipio;
    document.getElementById("totalRecaudado").value=actividad.totalRecaudado ?? "";

    document.getElementById("CampoTotalRecaudado").classList.remove("d-done");
    document.getElementById("tituloModalActividad").textContent = "editar actividad";
    document.getElementById("guardarActividad").textContent = "Guardar Cambios";
    modalActividad.show();
}

formularioActividad.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const idActividad=document.getElementById("idActividad").value;

    const datos={
        nombreActividad:document.getElementById("NombreActividad").value.trim(),
        FechaEvento:document.getElementById("FechaEvento").value.trim(),
        Municipio:document.getElementById("Municipio").value.trim(),
    }

    if(idActividad){
        datos.idActividad=Number(idActividad);
        const totalRecaudado = document.getElementById("TotalRecaudado").value;
        datos.totalRecaudado=totalRecaudado==="" ?? null : Number(total);
    }

    try{
        await solicitarApi(idActividad ? "PUT" : "POST", datos);
        modalActividad.hide();
        alert("actualizar correctamente ");
        cargaractividades();
    }catch(error){
        alert(error.message);
    }
});

cargaractividades();