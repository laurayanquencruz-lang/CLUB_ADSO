<?php

class conexion
{
    private $host = "localhost";
    private $baseDatos = "mr_club";
    private $user = "root";
    private $password = "";

    public function conectar(){

    $sdn = "mysql:host={$this->host};dbname={$this->baseDatos};charset=utf8mb4";

       return new PDO($sdn, $this->user, $this->password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
}  