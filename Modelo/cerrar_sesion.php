<?php

// Indica al navegador que la respuesta será en formato JSON
header("Content-Type: application/json; charset=utf-8");

try {
    // Solo permite peticiones POST para mayor seguridad al cerrar sesión
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        throw new Exception("Método HTTP no permitido.");
    }

    // Reanuda la sesión actual para poder borrarla
    session_start();

    // Vacía todas las variables guardadas en la sesión (rol, documento, etc.)
    $_SESSION = [];

    // Si PHP usa cookies para la sesión, la expira en el navegador
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000, // Fecha pasada para eliminar la cookie
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }

    // Destruye la sesión por completo en el servidor
    session_destroy();

    // Responde en JSON confirmando que se cerró correctamente
    echo json_encode([
        "success" => true,
        "mensaje" => "Sesión cerrada exitosamente."
    ]);
} catch (Exception $e) {
    // Si ocurre algún error (ej. método no permitido), responde en JSON con el error
    echo json_encode([
        "success" => false,
        "mensaje" => $e->getMessage()
    ]);
}