<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

function leerJsonComprobante()
{
    $contenido = file_get_contents("php://input");
    $datos = json_decode($contenido, true);
    if (!is_array($datos) || json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        throw new Exception("Datos JSON inválidos.");
    }
    return $datos;
}

try {
    if (!isset($_SESSION["documento"], $_SESSION["rol"])) {
        http_response_code(401);
        throw new Exception("Inicia sesión para gestionar comprobantes.");
    }

    $metodo = $_SERVER["REQUEST_METHOD"];
    $esAdmin = strtolower($_SESSION["rol"]) === "admin";
    $documento = $_SESSION["documento"];

    require_once __DIR__ . "/Comprobante.php";
    $comprobante = new Comprobante();

    switch ($metodo) {
        // GET: Admin recibe todas las solicitudes + conteo; Asociado recibe sus comprobantes y sus préstamos
        case "GET":
            $lista = $esAdmin
                ? $comprobante->obtenerTodos()
                : $comprobante->obtenerPorDocumento($documento);
            echo json_encode([
                "success"      => true,
                "rol"          => $_SESSION["rol"],
                "pendientes"   => $esAdmin ? $comprobante->contarPendientes() : 0,
                "comprobantes" => $lista,
                "misPrestamos" => $comprobante->obtenerPrestamosPorDocumento($documento)
            ]);
            exit;

        // POST: El asociado sube una foto del comprobante, el mensaje y opcionalmente el idPrestamo al que abona
        case "POST":
            $mensaje = trim((string)($_POST["mensaje"] ?? ""));
            if ($mensaje === "") {
                http_response_code(400);
                throw new Exception("Escribe un mensaje explicando el comprobante de pago.");
            }

            // Valida idPrestamo si el asociado seleccionó un préstamo específico
            $idPrestamo = null;
            $rawPrestamo = trim((string)($_POST["idPrestamo"] ?? ""));
            if ($rawPrestamo !== "") {
                $idValidado = filter_var($rawPrestamo, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
                if ($idValidado === false) {
                    http_response_code(400);
                    throw new Exception("El préstamo seleccionado no es válido.");
                }
                if (!$esAdmin && !$comprobante->prestamoPerteneceADocumento($idValidado, $documento)) {
                    http_response_code(403);
                    throw new Exception("El préstamo seleccionado no pertenece a tu cuenta.");
                }
                $idPrestamo = $idValidado;
            }

            if (!isset($_FILES["foto"]) || $_FILES["foto"]["error"] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                throw new Exception("Debes adjuntar la foto del comprobante de pago.");
            }

            $archivo = $_FILES["foto"];

            if ($archivo["size"] > 5 * 1024 * 1024) {
                http_response_code(400);
                throw new Exception("La imagen supera el máximo permitido de 5 MB.");
            }

            $infoImagen = @getimagesize($archivo["tmp_name"]);
            if ($infoImagen === false) {
                http_response_code(400);
                throw new Exception("El archivo adjunto no es una imagen válida.");
            }

            $mimesPermitidos = [
                "image/jpeg" => "jpg",
                "image/png"  => "png",
                "image/webp" => "webp",
                "image/gif"  => "gif"
            ];
            $mime = $infoImagen["mime"] ?? "";
            if (!isset($mimesPermitidos[$mime])) {
                http_response_code(400);
                throw new Exception("Formato no permitido. Usa JPG, PNG, WEBP o GIF.");
            }

            $extension = $mimesPermitidos[$mime];
            $carpeta = __DIR__ . "/../Assests/comprobantes/";
            if (!is_dir($carpeta)) {
                mkdir($carpeta, 0775, true);
            }

            $nombreArchivo = "comp_" . preg_replace('/[^0-9A-Za-z_-]/', '', (string)$documento) . "_" . time() . "_" . random_int(100, 999) . "." . $extension;
            $rutaFisica = $carpeta . $nombreArchivo;
            $rutaWeb = "../Assests/comprobantes/" . $nombreArchivo;

            if (!move_uploaded_file($archivo["tmp_name"], $rutaFisica)) {
                http_response_code(500);
                throw new Exception("No se pudo guardar la foto en el servidor.");
            }

            $idCreado = $comprobante->guardar($documento, $mensaje, $rutaWeb, $idPrestamo);

            http_response_code(201);
            echo json_encode([
                "success"       => true,
                "idComprobante" => (int)$idCreado,
                "idPrestamo"    => $idPrestamo,
                "rutaImagen"    => $rutaWeb,
                "mensaje"       => $idPrestamo
                    ? "Comprobante de abono al Préstamo #{$idPrestamo} enviado correctamente al administrador."
                    : "Comprobante enviado correctamente al administrador."
            ]);
            exit;

        // PUT: Solo Administrador puede Aprobar o Rechazar una solicitud
        case "PUT":
            if (!$esAdmin) {
                http_response_code(403);
                throw new Exception("Solo el administrador puede cambiar el estado de las solicitudes.");
            }

            $datos = leerJsonComprobante();
            $id = filter_var($datos["idComprobante"] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
            $estado = trim((string)($datos["estado"] ?? ""));

            if ($id === false || !in_array($estado, ["Pendiente", "Aprobado", "Rechazado"], true)) {
                http_response_code(400);
                throw new Exception("Solicitud o estado inválido.");
            }

            if (!$comprobante->actualizarEstado($id, $estado)) {
                http_response_code(404);
                throw new Exception("No se encontró la solicitud de comprobante.");
            }

            echo json_encode([
                "success"    => true,
                "pendientes" => $comprobante->contarPendientes(),
                "mensaje"    => "Solicitud marcada como {$estado}."
            ]);
            exit;

        // DELETE: Solo Administrador puede eliminar una solicitud
        case "DELETE":
            if (!$esAdmin) {
                http_response_code(403);
                throw new Exception("Solo el administrador puede eliminar solicitudes.");
            }

            $datos = leerJsonComprobante();
            $id = filter_var($datos["idComprobante"] ?? null, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1]]);
            if ($id === false) {
                http_response_code(400);
                throw new Exception("Identificador de comprobante inválido.");
            }

            $registro = $comprobante->obtenerPorId($id);
            if (!$registro || !$comprobante->eliminar($id)) {
                http_response_code(404);
                throw new Exception("No se encontró la solicitud de comprobante.");
            }

            if (!empty($registro["rutaImagen"]) && str_starts_with($registro["rutaImagen"], "../Assests/comprobantes/")) {
                $archivoViejo = __DIR__ . "/" . $registro["rutaImagen"];
                if (is_file($archivoViejo)) {
                    @unlink($archivoViejo);
                }
            }

            echo json_encode([
                "success"    => true,
                "pendientes" => $comprobante->contarPendientes(),
                "mensaje"    => "Solicitud eliminada correctamente."
            ]);
            exit;

        default:
            http_response_code(405);
            throw new Exception("Método HTTP no permitido.");
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "mensaje" => "Error en la base de datos: " . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "mensaje" => $e->getMessage()]);
}
