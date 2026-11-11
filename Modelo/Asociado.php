<?php
require_once __DIR__ . '/../Config/conexion.php';

class Asociado {
    private $conexion;
    private $Documento;
    private $Nombre;
    private $Apellido;
    private $Fecha_Nacimiento;
    private $Genero;
    private $Direccion_Residencia;
    private $Ciudad;
    private $Telefono;
    private $Email;
    private $Contraseña;

    public function __construct($datos) {
        $this->Documento = $datos['Documento'];
        $this->Nombre = $datos['Nombre'];
        $this->Apellido = $datos['Apellido'];    
        $this->Fecha_Nacimiento = $datos['Fecha_Nacimiento'];
        $this->Genero = $datos['Genero'];
        $this->Direccion_Residencia = $datos['Direccion_Residencia'];
        $this->Ciudad = $datos['Ciudad'];
        $this->Telefono = $datos['Telefono'];
        $this->Email = $datos['Email'];
        // Lee la contraseña sin importar si viene con o sin eñe desde el cliente
        $this->Contraseña = password_hash($datos['Contraseña'], PASSWORD_DEFAULT);
        
        $conexion = new Conexion();
        $this->conexion = $conexion->conectar();
    }

    public function guardar() {
        // La columna en tu BD sigue siendo 'contraseña', pero usamos ':pass' para evitar conflictos de PDO
        $sql = "INSERT INTO asociados (Documento, Nombre, Apellido, Fecha_Nacimiento, Genero, Direccion_Residencia, Ciudad, Telefono, Email, Contraseña) 
                VALUES (:Documento, :Nombre, :Apellido, :Fecha_Nacimiento, :Genero, :Direccion_Residencia, :Ciudad, :Telefono, :Email, :pass)";
        
        $consulta = $this->conexion->prepare($sql);
        
        return $consulta->execute([
            ':Documento' => $this->Documento,
            ':Nombre' => $this->Nombre,
            ':Apellido' => $this->Apellido,
            ':Fecha_Nacimiento' => $this->Fecha_Nacimiento,
            ':Genero' => $this->Genero,
            ':Direccion_Residencia' => $this->Direccion_Residencia,
            ':Ciudad' => $this->Ciudad,
            ':Telefono' => $this->Telefono,
            ':Email' => $this->Email,
            ':pass' => $this->Contraseña
        ]);
    }   
}