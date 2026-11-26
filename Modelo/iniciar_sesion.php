<?php

// Inicia la sesión en PHP para poder guardar el rol y documento del usuario al autenticarse
session_start();

// Indica al navegador que la respuesta será en formato JSON con codificación UTF-8
header("Content-Type: application/json; charset=utf-8");

// Bloque try/catch para capturar errores y devolver siempre una respuesta JSON limpia
try {
    // Verifica que la petición haya llegado mediante el método POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405); // 405 = Método no permitido
        throw new Exception("Método HTTP no permitido.");
    }

    // Lee el cuerpo JSON enviado por fetch y lo convierte en un arreglo asociativo de PHP
    $datos = json_decode(file_get_contents('php://input'), true);

    // Comprueba que el JSON sea válido y se haya convertido en un arreglo
    if (!is_array($datos) || json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400); // 400 = Petición incorrecta
        throw new Exception("Datos inválidos.");
    }

    // Obtiene el usuario (correo) y la contraseña del arreglo (o vacío si no llegaron)
    $email = $datos['usuario'] ?? "";
    $contraseña = $datos['contraseña'] ?? "";

    // Valida que ambos datos sean texto y no estén vacíos
    if (!is_string($email) || !is_string($contraseña) || $email === "" || $contraseña === "") {
        http_response_code(400);
        throw new Exception("Email o contraseña son requeridos.");
    }

    // Importa la clase de conexión a MySQL
    require_once __DIR__ . '/../Config/conexion.php';
    // Crea la conexión PDO a la base de datos mr_club
    $conexion = (new Conexion())->conectar();

    // Prepara una consulta segura buscando al asociado por su correo electrónico
    $consulta = $conexion->prepare("SELECT * FROM asociados WHERE email = :email");
    // Ejecuta la consulta reemplazando el marcador :email
    $consulta->execute([':email' => $email]);
    // Obtiene la fila encontrada (o false si el correo no existe)
    $asociado = $consulta->fetch();

    // Verifica que el usuario exista, tenga contraseña guardada y coincida con el hash encriptado
    if (!$asociado || empty($asociado['Contraseña']) || !password_verify($contraseña, $asociado['Contraseña'])) {
        http_response_code(401); // 401 = Credenciales inválidas
        throw new Exception("Email o contraseña incorrectos.");
    }

    // Guarda el rol en minúsculas dentro de la sesión del servidor
    $_SESSION["rol"] = strtolower($asociado['rol']);
    // Guarda el número de documento del usuario autenticado en la sesión
    $_SESSION["documento"] = $asociado['Documento'];

    // Devuelve respuesta JSON exitosa con el rol, nombre completo y foto de perfil
    echo json_encode([
        "success" => true,
        "rol" => $_SESSION["rol"],
        "nombre" => $asociado['Nombre'] . " " . $asociado['Apellido'],
        "fotoPerfil" => $asociado['FotoPerfil'] ?? ""
    ]);

} catch (PDOException $e) {
    // Si falla la base de datos, devuelve el mensaje de error en JSON
    $errorMessage = "Error: " . $e->getMessage();
    echo json_encode([
        "success" => false,
        "mensaje" => $errorMessage
    ]);

} catch (Exception $e) {
    // Si falla cualquier validación o autenticación, devuelve el mensaje en JSON
    echo json_encode([
        "success" => false,
        "mensaje" => $e->getMessage()
    ]);
}
