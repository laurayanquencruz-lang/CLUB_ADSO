<?php

session_start();

header("Content-Type: application/json; charset=UTF-8");

try{
    if($_SERVER['REQUEST_METHOD'] !== 'POST'){
        http_response_code(405);
        //saltar a catch y mostrar el mensaje de error
        throw new Exception('Método HTTP no permitido.');
    }

    $datos = json_decode(file_get_contents('php://input'), true);

     if (!is_array($datos) || json_last_error() !== JSON_ERROR_NONE)
        {
           http_response_code(400);
           throw new Exception('Datos JSON inválidos.');
        }

        $email = $datos['correo'] ?? "";
        $contraseña = $datos['contrasena'] ?? "";

        if(!is_string($email) || !is_string($contraseña) || $email=== "" || $contraseña=== ""){
            http_response_code(400);
            throw new Exception('Correo electrónico o contraseña invalidos.');
        }

require_once __DIR__ . '/../Config/conexion.php';
$conexion = (new conexion()->conectar());

$consulta = $conexion->prepare("SELECT * FROM asociados WHERE Email = :email");
$consulta->execute([':email' => $email]);
$asociado = $consulta->fetch();


if(!$asociado || !password_verify($contraseña, $asociado['Contraseña']) || empty($asociado['Contraseña'])){
    http_response_code(401);
    throw new Exception('Correo electrónico o contraseña incorrectos.');
}

$_SESSION["rol"] = strtolower ($asociado['rol']);
$_SESSION["documento"] = $asociado['documento'];

echo json_encode([
    "success" =>true,
    "rol" => $_SESSION["rol"],
    "nombre" => $asociado["Nombre"] . " " . $asociado["Apellido"],
]);

}catch(PDOException $e){
    $errorMessage = "Error: " . $e->getMessage();
    echo json_encode([
        "success" => false,
        "mensaje" => $errorMessage
    ]);

}catch (Exception $e){
echo json_encode([
    "success" => false,
    "mensaje" => $e->getMessage()
]);
}