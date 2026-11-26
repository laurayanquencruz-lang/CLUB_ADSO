<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

function leerDatosPago()
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

function validarPago($datos)
{
    $documento = trim((string)($datos['documento'] ?? ''));
    $concepto = trim((string)($datos['concepto'] ?? ''));
    $monto = filter_var($datos['monto'] ?? null, FILTER_VALIDATE_FLOAT);
    $fecha = trim((string)($datos['fechaPago'] ?? ''));
    $metodoPago = trim((string)($datos['metodoPago'] ?? ''));
    $comprobante = trim((string)($datos['numeroComprobante'] ?? ''));
    $observaciones = trim((string)($datos['observaciones'] ?? ''));

    if (!ctype_digit($documento)) {
        http_response_code(400);
        throw new Exception("Seleccione un asociado válido.");
    }
    if ($concepto === "" || strlen($concepto) > 100) {
        http_response_code(400);
        throw new Exception("Seleccione un concepto válido.");
    }
    if ($monto === false || $monto <= 0) {
        http_response_code(400);
        throw new Exception("Ingrese un monto mayor a 0.");
    }
    $fechaObj = DateTime::createFromFormat('Y-m-d', $fecha);
    if (!$fechaObj || $fechaObj->format('Y-m-d') !== $fecha) {
        http_response_code(400);
        throw new Exception("Ingrese una fecha de pago válida.");
    }
    if ($metodoPago === "" || strlen($metodoPago) > 50) {
        http_response_code(400);
        throw new Exception("Seleccione un método de pago válido.");
    }

    return [
        "documento"         => $documento,
        "concepto"          => $concepto,
        "monto"             => $monto,
        "fechaPago"         => $fecha,
        "metodoPago"        => $metodoPago,
        "numeroComprobante" => $comprobante !== "" ? substr($comprobante, 0, 50) : null,
        "observaciones"     => $observaciones !== "" ? $observaciones : null
    ];
}

try {
    if (!isset($_SESSION["documento"], $_SESSION["rol"])) {
        http_response_code(401);
        throw new Exception("Inicia sesión para gestionar pagos.");
    }

    $metodo = $_SERVER["REQUEST_METHOD"];
    $esAdmin = strtolower($_SESSION["rol"]) === "admin";

    if (!in_array($metodo, ["GET", "POST", "PUT", "DELETE"], true)) {
        http_response_code(405);
        throw new Exception("Método HTTP no permitido.");
    }

    if ($metodo !== "GET" && !$esAdmin) {
        http_response_code(403);
        throw new Exception("No tienes permisos para modificar pagos.");
    }

    require_once __DIR__ . "/Pago.php";
    $pago = new Pago();

    switch ($metodo) {
        case "GET":
            $lista = $esAdmin
                ? $pago->obtenerTodos()
                : $pago->obtenerPorDocumento($_SESSION["documento"]);
            $resultado = [
                "success"   => true,
                "rol"       => $_SESSION["rol"],
                "pagos"     => $lista,
                "asociados" => $esAdmin ? $pago->obtenerAsociados() : []
            ];
            http_response_code(200);
            break;

        case "POST":
            $datos = validarPago(leerDatosPago());
            $idCreado = $pago->guardar($datos);
            $resultado = [
                "success" => true,
                "idPago"  => (int)$idCreado,
                "mensaje" => "Pago registrado exitosamente."
            ];
            http_response_code(201);
            break;

        case "PUT":
            $datosRaw = leerDatosPago();
            $idPago = filter_var($datosRaw["idPago"] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
            if ($idPago === false) {
                http_response_code(400);
                throw new Exception("El identificador del pago no es válido.");
            }
            $datos = validarPago($datosRaw);
            $datos["idPago"] = $idPago;

            if (!$pago->editar($datos)) {
                http_response_code(404);
                throw new Exception("No se encontró el pago.");
            }
            $resultado = [
                "success" => true,
                "mensaje" => "Pago actualizado correctamente."
            ];
            http_response_code(200);
            break;

        case "DELETE":
            $datos = leerDatosPago();
            $idPago = filter_var($datos["idPago"] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
            if ($idPago === false) {
                http_response_code(400);
                throw new Exception("El identificador del pago no es válido.");
            }
            if (!$pago->eliminar($idPago)) {
                http_response_code(404);
                throw new Exception("No se encontró el pago.");
            }
            $resultado = [
                "success" => true,
                "mensaje" => "Pago eliminado correctamente."
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
