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

}catch()