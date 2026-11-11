<?php 
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__.'/Asociado.php';

try{
    $formulario = $_POST;

    $camposRequeridos = ["documento", "nombres", "apellidos", "correo", "fechaNacimiento", "genero", "direccion", "ciudad", "telefono", "contrasena"];
    foreach($camposRequeridos as $campo)
    {
        if(!isset($formulario[$campo]) || trim($formulario[$campo]) === ''){
            http_response_code(400);
            throw new Exception("Falta el campo requerido: " . $campo);        
        }
    }

    if(!filter_var($formulario['correo'], FILTER_VALIDATE_EMAIL)){
        http_response_code(400);
        throw new Exception("Correo electrónico inválido.");
    }

    $datos = [
        'Documento' => $formulario['documento'],
        'Nombre' => $formulario['nombres'],
        'Apellido' => $formulario['apellidos'],
        'Email' => $formulario['correo'],
        'Fecha_Nacimiento' => $formulario['fechaNacimiento'],
        'Genero' => $formulario['genero'],
        'Direccion_Residencia' => $formulario['direccion'],
        'Ciudad' => $formulario['ciudad'],
        'Telefono' => $formulario['telefono'],
        'Contraseña' => $formulario['contrasena']
    ];

    $asociado = new Asociado($datos);
    $resultado = $asociado->guardar();

    if($resultado){
        http_response_code(200);
        echo json_encode(["success" => true, "mensaje" => "Asociado guardado exitosamente."]);
    }else{
        throw new Exception("No se pudo guardar el registro.");
    }
}catch(PDOException $e){
    if($e->getCode() == 23000){
        http_response_code(409);
        echo json_encode(["success" => false, "mensaje" => "El documento ya existe."]);
    }else{
        http_response_code(500);
        echo json_encode(["success" => false, "mensaje" => "Error de base de datos: " . $e->getMessage()]);
    }
}catch(Exception $e){
    http_response_code(400);
    echo json_encode(["success" => false, "mensaje" => $e->getMessage()]);
}
