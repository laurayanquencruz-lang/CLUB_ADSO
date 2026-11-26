<?php
// Inicia o reanuda la sesión PHP para poder leer $_SESSION["documento"] y $_SESSION["rol"]
session_start();

// Indica al navegador que todas las respuestas de este archivo serán en formato JSON con UTF-8
header("Content-Type: application/json; charset=UTF-8");

// Función que lee y convierte en arreglo PHP los datos enviados desde JavaScript
function leerDatos()
{
    // Lee el cuerpo crudo de la petición HTTP (donde fetch envía el JSON)
    $contenido = file_get_contents("php://input");

    // Si no llegó cuerpo JSON, devuelve $_POST por si se envió como formulario clásico
    if ($contenido === "" || $contenido === false) {
        return $_POST;
    }

    // Decodifica el texto JSON a un arreglo asociativo de PHP (true = arreglo)
    $datos = json_decode($contenido, true);

    // Si el JSON está mal formado o no es un arreglo, responde error 400 (petición inválida)
    if (!is_array($datos) || json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        throw new Exception("Error al decodificar JSON: " . json_last_error_msg());
    }

    // Retorna el arreglo con los datos listos para validar
    return $datos;
}

// Función que valida cada campo del formulario antes de tocar la base de datos
function validarActividad($datos)
{
    // Extrae cada dato (usando '' si no llegó) y quita espacios al inicio y final
    $nombre = trim((string)($datos['nombreActividad'] ?? ''));
    $tipo = trim((string)($datos['tipoActividad'] ?? ''));
    $fecha = trim((string)($datos['fechaActividad'] ?? ''));
    $hora = trim((string)($datos['horaInicio'] ?? ''));
    // Valida que cupos sea un número entero mayor o igual a 1
    $cupos = filter_var($datos['cupos'] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    $responsable = trim((string)($datos['responsable'] ?? ''));
    $descripcion = trim((string)($datos['descripcion'] ?? ''));

    // Verifica que el nombre no esté vacío ni supere los 100 caracteres de la columna en MySQL
    if ($nombre === "" || strlen($nombre) > 100) {
        http_response_code(400);
        throw new Exception("Ingrese un nombre de actividad válido (máximo 100 caracteres).");
    }

    // Verifica que se haya seleccionado un tipo de actividad válido (máximo 50 caracteres)
    if ($tipo === "" || strlen($tipo) > 50) {
        http_response_code(400);
        throw new Exception("Seleccione un tipo de actividad válido.");
    }

    // Intenta interpretar la fecha con el formato exacto Año-Mes-Día (ej. 2026-11-25)
    $fechaObj = DateTime::createFromFormat('Y-m-d', $fecha);
    // Comprueba que la fecha exista realmente en el calendario y coincida con el formato
    if (!$fechaObj || $fechaObj->format('Y-m-d') !== $fecha) {
        http_response_code(400);
        throw new Exception("Ingrese una fecha válida.");
    }

    // Comprueba con expresión regular que la hora esté entre 00:00 y 23:59 (con segundos opcionales)
    if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/', $hora)) {
        http_response_code(400);
        throw new Exception("Ingrese una hora de inicio válida.");
    }

    // Si filter_var devolvió false, los cupos no eran un entero >= 1
    if ($cupos === false) {
        http_response_code(400);
        throw new Exception("Ingrese una cantidad de cupos válida (mínimo 1).");
    }

    // Verifica que el responsable no esté vacío ni supere 100 caracteres
    if ($responsable === "" || strlen($responsable) > 100) {
        http_response_code(400);
        throw new Exception("Ingrese un responsable válido (máximo 100 caracteres).");
    }

    // Devuelve el arreglo limpio y validado; si descripción está vacía guarda NULL en MySQL
    return [
        "nombreActividad" => $nombre,
        "tipoActividad"   => $tipo,
        "fechaActividad"  => $fecha,
        "horaInicio"      => $hora,
        "cupos"           => $cupos,
        "responsable"     => $responsable,
        "descripcion"     => $descripcion !== "" ? $descripcion : null
    ];
}

// Función que valida que el idActividad (para editar o eliminar) sea un entero positivo
function validarId($id)
{
    // Comprueba que el ID sea un entero >= 1
    $idActividad = filter_var($id, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    // Si no es válido, responde error 400
    if ($idActividad === false) {
        http_response_code(400);
        throw new Exception("El identificador de la actividad no es válido.");
    }
    // Devuelve el ID validado
    return $idActividad;
}

// Bloque principal envuelto en try/catch para devolver siempre errores limpios en JSON
try {
    // Verifica que el usuario haya iniciado sesión en el servidor (existen documento y rol)
    if (!isset($_SESSION["documento"], $_SESSION["rol"])) {
        http_response_code(401); // 401 = No autenticado
        throw new Exception("Inicia sesión para gestionar las actividades.");
    }

    // Obtiene el método HTTP de la solicitud (GET, POST, PUT o DELETE)
    $metodo = $_SERVER["REQUEST_METHOD"];

    // Rechaza cualquier método HTTP que no sea uno de los 4 permitidos
    if (!in_array($metodo, ["GET", "POST", "PUT", "DELETE"], true)) {
        http_response_code(405); // 405 = Método no permitido
        throw new Exception("Método HTTP no permitido.");
    }

    // Para crear, editar o eliminar (todo lo distinto a GET) exige que el rol sea "admin"
    if ($metodo !== "GET" && strtolower($_SESSION["rol"]) !== "admin") {
        http_response_code(403); // 403 = Prohibido (sin permisos)
        throw new Exception("No tienes permisos para realizar esta acción.");
    }

    // Importa la clase Actividad encargada de hablar con MySQL
    require_once __DIR__ . "/Actividad.php";
    // Crea una instancia de Actividad (abre la conexión a la base de datos)
    $actividad = new Actividad();

    // Decide qué operación ejecutar según el método HTTP recibido
    switch ($metodo) {
        // GET: consultar todas las actividades guardadas
        case "GET":
            $resultado = [
                "success"     => true,
                "rol"         => $_SESSION["rol"],
                "actividades" => $actividad->obtenerActividades()
            ];
            http_response_code(200); // 200 = OK
            break;

        // POST: crear y guardar una nueva actividad en MySQL
        case "POST":
            // Lee el JSON del navegador y valida todos sus campos
            $datos = validarActividad(leerDatos());
            // Inserta la actividad en la base de datos y recibe el ID generado
            $idCreado = $actividad->guardar($datos);
            // Prepara la respuesta JSON de éxito
            $resultado = [
                "success"     => true,
                "idActividad" => (int)$idCreado,
                "mensaje"     => "Actividad guardada exitosamente."
            ];
            http_response_code(201); // 201 = Recurso creado
            break;

        // PUT: actualizar una actividad existente
        case "PUT":
            // Lee los datos crudos enviados
            $datosRaw = leerDatos();
            // Valida los campos de la actividad
            $datos = validarActividad($datosRaw);
            // Valida el ID de la actividad a modificar
            $datos["idActividad"] = validarId($datosRaw["idActividad"] ?? null);

            // Ejecuta la actualización; si no existe ese ID responde 404
            if (!$actividad->editar($datos)) {
                http_response_code(404); // 404 = No encontrado
                throw new Exception("No se encontró la actividad.");
            }

            // Prepara respuesta de actualización exitosa
            $resultado = [
                "success" => true,
                "mensaje" => "Actividad actualizada correctamente."
            ];
            http_response_code(200);
            break;

        // DELETE: eliminar una actividad por su ID
        case "DELETE":
            // Lee el JSON con el idActividad
            $datos = leerDatos();
            // Valida que el ID sea un entero positivo
            $idActividad = validarId($datos["idActividad"] ?? null);

            // Intenta eliminarla; si no existía responde 404
            if (!$actividad->eliminar($idActividad)) {
                http_response_code(404);
                throw new Exception("No se encontró la actividad.");
            }

            // Prepara respuesta de eliminación exitosa
            $resultado = [
                "success" => true,
                "mensaje" => "Actividad eliminada correctamente."
            ];
            http_response_code(200);
            break;
    }

    // Convierte el arreglo $resultado a JSON y lo envía al navegador
    echo json_encode($resultado);
} catch (PDOException $e) {
    // Captura errores propios de MySQL/PDO y responde código 500 (error interno del servidor)
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "mensaje" => "Error en la base de datos: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    // Captura cualquier error de validación o permisos y devuelve el mensaje en JSON
    echo json_encode([
        "success" => false,
        "mensaje" => $e->getMessage()
    ]);
}
