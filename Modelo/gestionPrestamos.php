<?php
// ============================================================================
// API CRUD DE PRÉSTAMOS (gestionPrestamos.php)
// Admin: gestiona todos los préstamos | Asociado: consulta únicamente los suyos
// ============================================================================
session_start();

header("Content-Type: application/json; charset=UTF-8");

// --- PARTE 1: Lectura de JSON y validación de monto, cuotas, tasa, fecha y garantía ---
function leerDatosPrestamo()
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

function validarPrestamo($datos)
{
    $idAsociado = filter_var($datos['idAsociado'] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
    $valor = filter_var($datos['ValorPrestamo'] ?? null, FILTER_VALIDATE_FLOAT);
    $tasa = filter_var($datos['TasaInteres'] ?? null, FILTER_VALIDATE_FLOAT);
    $cuotas = filter_var($datos['NumeroCuotas'] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1, "max_range" => 120]]);
    $fecha = trim((string)($datos['FechaPrestamo'] ?? ''));
    $garantia = trim((string)($datos['Garantia'] ?? ''));
    $proposito = trim((string)($datos['Proposito'] ?? ''));

    if ($idAsociado === false) {
        http_response_code(400);
        throw new Exception("Seleccione un asociado válido.");
    }
    if ($valor === false || $valor <= 0) {
        http_response_code(400);
        throw new Exception("Ingrese un monto de préstamo mayor a 0.");
    }
    if ($tasa === false || $tasa < 0) {
        http_response_code(400);
        throw new Exception("Ingrese una tasa de interés válida.");
    }
    if ($cuotas === false) {
        http_response_code(400);
        throw new Exception("Ingrese un número de cuotas válido.");
    }
    $fechaObj = DateTime::createFromFormat('Y-m-d', $fecha);
    if (!$fechaObj || $fechaObj->format('Y-m-d') !== $fecha) {
        http_response_code(400);
        throw new Exception("Ingrese una fecha de desembolso válida.");
    }
    if ($garantia === "" || strlen($garantia) > 150) {
        http_response_code(400);
        throw new Exception("Ingrese una garantía o fiador válido.");
    }

    return [
        "idAsociado"    => $idAsociado,
        "ValorPrestamo" => $valor,
        "TasaInteres"   => $tasa,
        "NumeroCuotas"  => $cuotas,
        "FechaPrestamo" => $fecha,
        "Garantia"      => $garantia,
        "Proposito"     => $proposito !== "" ? substr($proposito, 0, 200) : null
    ];
}

// --- PARTE 2: Validación de sesión/rol y ejecución según método HTTP (GET, POST, PUT, DELETE) ---
try {
    if (!isset($_SESSION["documento"], $_SESSION["rol"])) {
        http_response_code(401);
        throw new Exception("Inicia sesión para gestionar préstamos.");
    }

    $metodo = $_SERVER["REQUEST_METHOD"];
    $esAdmin = strtolower($_SESSION["rol"]) === "admin";

    if (!in_array($metodo, ["GET", "POST", "PUT", "DELETE"], true)) {
        http_response_code(405);
        throw new Exception("Método HTTP no permitido.");
    }

    if ($metodo !== "GET" && !$esAdmin) {
        http_response_code(403);
        throw new Exception("No tienes permisos para modificar préstamos.");
    }

    require_once __DIR__ . "/Prestamo.php";
    $prestamo = new Prestamo();

    switch ($metodo) {
        case "GET":
            $lista = $esAdmin
                ? $prestamo->obtenerTodos()
                : $prestamo->obtenerPorDocumento($_SESSION["documento"]);
            $resultado = [
                "success"   => true,
                "rol"       => $_SESSION["rol"],
                "prestamos" => $lista,
                "asociados" => $esAdmin ? $prestamo->obtenerAsociados() : []
            ];
            http_response_code(200);
            break;

        case "POST":
            $datos = validarPrestamo(leerDatosPrestamo());
            $idCreado = $prestamo->guardar($datos);
            $resultado = [
                "success"     => true,
                "idPrestamos" => (int)$idCreado,
                "mensaje"     => "Préstamo registrado exitosamente."
            ];
            http_response_code(201);
            break;

        case "PUT":
            $datosRaw = leerDatosPrestamo();
            $idPrestamos = filter_var($datosRaw["idPrestamos"] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
            if ($idPrestamos === false) {
                http_response_code(400);
                throw new Exception("El identificador del préstamo no es válido.");
            }
            $datos = validarPrestamo($datosRaw);
            $datos["idPrestamos"] = $idPrestamos;

            if (!$prestamo->editar($datos)) {
                http_response_code(404);
                throw new Exception("No se encontró el préstamo.");
            }
            $resultado = [
                "success" => true,
                "mensaje" => "Préstamo actualizado correctamente."
            ];
            http_response_code(200);
            break;

        case "DELETE":
            $datos = leerDatosPrestamo();
            $idPrestamos = filter_var($datos["idPrestamos"] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
            if ($idPrestamos === false) {
                http_response_code(400);
                throw new Exception("El identificador del préstamo no es válido.");
            }
            if (!$prestamo->eliminar($idPrestamos)) {
                http_response_code(404);
                throw new Exception("No se encontró el préstamo.");
            }
            $resultado = [
                "success" => true,
                "mensaje" => "Préstamo eliminado correctamente."
            ];
            http_response_code(200);
            break;
    }

    echo json_encode($resultado);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "mensaje" => "Error en la base de datos: " . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "mensaje" => $e->getMessage()]);
}
