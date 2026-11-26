<?php
// ============================================================================
// API DE PERFIL (gestionPerfil.php)
// GET: devuelve los datos del usuario autenticado | POST: sube y guarda su foto
// ============================================================================
session_start();

header("Content-Type: application/json; charset=UTF-8");

try {
    // --- PARTE 1: Verificación de sesión activa y conexión a MySQL ---
    if (!isset($_SESSION["documento"], $_SESSION["rol"])) {
        http_response_code(401);
        throw new Exception("Inicia sesión para ver tu perfil.");
    }

    $metodo = $_SERVER["REQUEST_METHOD"];
    $documento = $_SESSION["documento"];

    require_once __DIR__ . "/../Config/conexion.php";
    $conexion = (new Conexion())->conectar();

    // --- PARTE 2 (GET): Consultar los datos registrados del usuario en MySQL ---
    if ($metodo === "GET") {
        $sql = "SELECT idAsociado, Documento, Nombre, Apellido, Fecha_Nacimiento, Genero,
                       Direccion_Residencia, Ciudad, Telefono, Email, rol, FotoPerfil
                FROM asociados
                WHERE Documento = :documento
                LIMIT 1";
        $consulta = $conexion->prepare($sql);
        $consulta->execute([':documento' => $documento]);
        $perfil = $consulta->fetch();

        if (!$perfil) {
            http_response_code(404);
            throw new Exception("No se encontraron los datos de tu perfil.");
        }

        echo json_encode([
            "success" => true,
            "perfil"  => $perfil
        ]);
        exit;
    }

    // --- PARTE 3 (POST): Validar imagen, guardarla en disco y actualizar FotoPerfil en MySQL ---
    if ($metodo === "POST") {
        if (!isset($_FILES["foto"]) || $_FILES["foto"]["error"] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            throw new Exception("Selecciona una imagen válida para tu foto de perfil.");
        }

        $archivo = $_FILES["foto"];

        // Valida tamaño máximo de 3 MB
        if ($archivo["size"] > 3 * 1024 * 1024) {
            http_response_code(400);
            throw new Exception("La imagen supera el tamaño máximo permitido de 3 MB.");
        }

        // Valida que el archivo realmente sea una imagen permitida
        $infoImagen = @getimagesize($archivo["tmp_name"]);
        if ($infoImagen === false) {
            http_response_code(400);
            throw new Exception("El archivo seleccionado no es una imagen válida.");
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
        $carpetaDestino = __DIR__ . "/../Assests/fotos_perfil/";

        if (!is_dir($carpetaDestino)) {
            mkdir($carpetaDestino, 0775, true);
        }

        // Consulta la foto anterior para borrarla del disco y no acumular archivos
        $consultaAnterior = $conexion->prepare("SELECT FotoPerfil FROM asociados WHERE Documento = :documento LIMIT 1");
        $consultaAnterior->execute([':documento' => $documento]);
        $fotoAnterior = $consultaAnterior->fetchColumn();

        // Genera nombre único para evitar caché del navegador
        $nombreArchivo = "perfil_" . preg_replace('/[^0-9A-Za-z_-]/', '', (string)$documento) . "_" . time() . "." . $extension;
        $rutaFisica = $carpetaDestino . $nombreArchivo;
        $rutaWeb = "../Assests/fotos_perfil/" . $nombreArchivo;

        if (!move_uploaded_file($archivo["tmp_name"], $rutaFisica)) {
            http_response_code(500);
            throw new Exception("No se pudo guardar la imagen en el servidor.");
        }

        // Guarda la nueva ruta en la columna FotoPerfil de MySQL
        $actualizar = $conexion->prepare("UPDATE asociados SET FotoPerfil = :foto WHERE Documento = :documento");
        $actualizar->execute([
            ':foto'      => $rutaWeb,
            ':documento' => $documento
        ]);

        // Elimina el archivo antiguo si existía dentro de Assests/fotos_perfil/
        if ($fotoAnterior && str_starts_with($fotoAnterior, "../Assests/fotos_perfil/")) {
            $archivoViejo = __DIR__ . "/" . $fotoAnterior;
            if (is_file($archivoViejo) && realpath($archivoViejo) !== realpath($rutaFisica)) {
                @unlink($archivoViejo);
            }
        }

        echo json_encode([
            "success"    => true,
            "fotoPerfil" => $rutaWeb,
            "mensaje"    => "Foto de perfil actualizada correctamente."
        ]);
        exit;
    }

    http_response_code(405);
    throw new Exception("Método HTTP no permitido.");
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "mensaje" => "Error en la base de datos: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "mensaje" => $e->getMessage()
    ]);
}
