<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

// Lee el JSON enviado por fetch (o $_POST si viene como formulario)
function leerDatosAsociado()
{
    $contenido = file_get_contents("php://input");
    if ($contenido === "" || $contenido === false) {
        return $_POST;
    }
    $datos = json_decode($contenido, true);
    if (!is_array($datos) || json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        throw new Exception("Error al decodificar JSON: " . json_last_error_msg());
    }
    return $datos;
}

// Valida los campos obligatorios de un asociado (la contraseña solo es obligatoria al crear)
function validarAsociado($datos, $esEdicion = false)
{
    $documento = trim((string)($datos['Documento'] ?? ''));
    $nombre = trim((string)($datos['Nombre'] ?? ''));
    $apellido = trim((string)($datos['Apellido'] ?? ''));
    $fechaNac = trim((string)($datos['Fecha_Nacimiento'] ?? ''));
    $genero = trim((string)($datos['Genero'] ?? ''));
    $direccion = trim((string)($datos['Direccion_Residencia'] ?? ''));
    $ciudad = trim((string)($datos['Ciudad'] ?? ''));
    $telefono = trim((string)($datos['Telefono'] ?? ''));
    $email = trim((string)($datos['Email'] ?? ''));
    $contrasena = (string)($datos['Contraseña'] ?? '');
    $rol = trim((string)($datos['rol'] ?? 'Asociado'));

    if (!ctype_digit($documento) || strlen($documento) < 5) {
        http_response_code(400);
        throw new Exception("Ingrese un documento numérico válido.");
    }
    if ($nombre === "" || $apellido === "") {
        http_response_code(400);
        throw new Exception("Nombre y apellido son obligatorios.");
    }
    if ($fechaNac === "") {
        http_response_code(400);
        throw new Exception("La fecha de nacimiento es obligatoria.");
    }
    if ($genero === "" || $direccion === "" || $ciudad === "" || $telefono === "") {
        http_response_code(400);
        throw new Exception("Completa género, dirección, ciudad y teléfono.");
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        throw new Exception("Ingrese un correo electrónico válido.");
    }
    if (!$esEdicion && strlen($contrasena) < 4) {
        http_response_code(400);
        throw new Exception("La contraseña debe tener al menos 4 caracteres.");
    }
    if (!in_array($rol, ['Admin', 'Asociado'], true)) {
        $rol = 'Asociado';
    }

    return [
        "Documento"            => $documento,
        "Nombre"               => $nombre,
        "Apellido"             => $apellido,
        "Fecha_Nacimiento"     => $fechaNac,
        "Genero"               => $genero,
        "Direccion_Residencia" => $direccion,
        "Ciudad"               => $ciudad,
        "Telefono"             => $telefono,
        "Email"                => $email,
        "Contraseña"           => $contrasena,
        "rol"                  => $rol
    ];
}

try {
    if (!isset($_SESSION["documento"], $_SESSION["rol"])) {
        http_response_code(401);
        throw new Exception("Inicia sesión para gestionar asociados.");
    }

    $metodo = $_SERVER["REQUEST_METHOD"];
    $esAdmin = strtolower($_SESSION["rol"]) === "admin";

    if (!in_array($metodo, ["GET", "POST", "PUT", "DELETE"], true)) {
        http_response_code(405);
        throw new Exception("Método HTTP no permitido.");
    }

    if ($metodo !== "GET" && !$esAdmin) {
        http_response_code(403);
        throw new Exception("No tienes permisos para modificar asociados.");
    }

    require_once __DIR__ . "/Asociado.php";
    $asociado = new Asociado();

    switch ($metodo) {
        case "GET":
            $lista = $esAdmin
                ? $asociado->obtenerTodos()
                : $asociado->obtenerPorDocumento($_SESSION["documento"]);
            $resultado = [
                "success"   => true,
                "rol"       => $_SESSION["rol"],
                "asociados" => $lista
            ];
            http_response_code(200);
            break;

        case "POST":
            $datos = validarAsociado(leerDatosAsociado(), false);
            $idCreado = $asociado->guardar($datos);
            $resultado = [
                "success"    => true,
                "idAsociado" => (int)$idCreado,
                "mensaje"    => "Asociado guardado exitosamente."
            ];
            http_response_code(201);
            break;

        case "PUT":
            $datosRaw = leerDatosAsociado();
            $idAsociado = filter_var($datosRaw["idAsociado"] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
            if ($idAsociado === false) {
                http_response_code(400);
                throw new Exception("El identificador del asociado no es válido.");
            }
            $datos = validarAsociado($datosRaw, true);
            $datos["idAsociado"] = $idAsociado;

            if (!$asociado->editar($datos)) {
                http_response_code(404);
                throw new Exception("No se encontró el asociado.");
            }
            $resultado = [
                "success" => true,
                "mensaje" => "Asociado actualizado correctamente."
            ];
            http_response_code(200);
            break;

        case "DELETE":
            $datos = leerDatosAsociado();
            $idAsociado = filter_var($datos["idAsociado"] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
            if ($idAsociado === false) {
                http_response_code(400);
                throw new Exception("El identificador del asociado no es válido.");
            }
            if (!$asociado->eliminar($idAsociado)) {
                http_response_code(404);
                throw new Exception("No se encontró el asociado.");
            }
            $resultado = [
                "success" => true,
                "mensaje" => "Asociado eliminado correctamente."
            ];
            http_response_code(200);
            break;
    }

    echo json_encode($resultado);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        http_response_code(409);
        $msg = str_contains($e->getMessage(), "foreign key")
            ? "No se puede eliminar este asociado porque tiene préstamos registrados."
            : "El documento ingresado ya existe en otro asociado.";
        echo json_encode(["success" => false, "mensaje" => $msg]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "mensaje" => "Error en la base de datos: " . $e->getMessage()]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "mensaje" => $e->getMessage()]);
}
