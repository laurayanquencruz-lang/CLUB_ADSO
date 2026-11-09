<?php 
header('Content-Type: application/json');
require_once __DIR__.'/Asociado.php';

try{

if($_SERVER['REQUEST_METHOD']!=='POST')
    {
        http_response_code(405);
        //saltar a chatch y buscar el mensaje de error
        throw new Exception('Método HTTP no permitido.');
    }

    //leer el contenido de JSON de la solicitud enviada por fetch 
    $json = file_get_contents('php://input');

    //decodificar el JSON en un array asociativo de php
    $datos = json_decode($json, true);

    if (!is_array($datos) || json_last_error() !== JSON_ERROR_NONE)
        {
           http_response_code(400);
           throw new Exception('Datos JSON inválidos.');
        }

    $campos = ["documento", "nombres", "apellidos", "correo", "fechaNacimiento", "genero","Direccion_Residencia", "ciudad", "telefono","ContraseñaHash"];
    foreach($campos as $campo)
    {
        if(!isset($datos[$campo])){
            http_response_code(400);
            throw new Exception("Falta el campo requerido:" . $campo);    
        }

    }

    if(!filter_var($datos['correo'], FILTER_VALIDATE_EMAIL)){
        http_response_code(400);
        throw new Exception("Correo electrónico inválido.");
    }

    $asociado = new Asociado($datos);

    $resultado = $asociado->guardar();

    if($resultado){
        http_response_code(201);
        echo json_encode(["success" => true, "mensaje" => 'Asociado guardado exitosamente.']);
    }else{
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error al guardar el asociado.']);
    }
}catch(PDOException $e){
   if($e->getCode() == 23000){ //codigo de error para violacion de clave unica (documento duplicado)
        http_response_code(409);//conflicto
        echo json_encode(['success' => false, 'mensaje' => 'El documento ya existe.']);
    }else{
        http_response_code(500);
        echo json_encode(['success' => false, 'mensaje' => 'Error de base de datos: ' . $e->getMessage()]);
    }

//erroes de codigo por ejemplo metodo HTTP, datos invalidos, entre otros.
}catch(Exception $e){
    echo json_encode(['success' => false, 'mensaje' => $e->getMessage()]);
}