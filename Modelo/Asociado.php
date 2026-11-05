<?php
require_once __DIR__.'/../Config/conexion.php';


class Asociado
{
    private $documento;
    private $Nombre;
    private $Apellido;
    private $Fecha_Nacimiento;
    private $Genero;
    private $Ciudad;
    private $Telefono;
    private $Email;

    private $conexion;

    public function __construct($datos) {
        $this->documento = $datos['documento'];
        $this->Nombre = $datos['Nombre'];
        $this->Apellido = $datos['Apellido'];
        $this->Fecha_Nacimiento = $datos['Fecha_Nacimiento'];
        $this->Genero = $datos['Genero'];
        $this->Ciudad = $datos['Ciudad'];
        $this->Telefono = $datos['Telefono'];
        $this->Email = $datos['Email'];

        // Crear una instancia de la clase conexion
        require_once '../Config/conexion.php';
        $conexion = new conexion();
        $this->conexion = $conexionDB->conectar();
    }
}

public function guardar($datos)
{
   $sql = "INSERT INTO asociados (documento, Nombre, Apellido, Fecha_Nacimiento, Genero, Ciudad, Telefono, Email) VALUES (:documento, :Nombre, :Apellido, :Fecha_Nacimiento, :Genero, :Ciudad, :Telefono, :Email)";
   $consulta = $this->conexion->prepare($sql);
   return $consulta->execute([
         ':documento' => $this->documento,
          ':Nombre' => $this->Nombre,
          ':Apellido' => $this->Apellido,
          ':Fecha_Nacimiento' => $this->Fecha_Nacimiento,
          ':Genero' => $this->Genero,
          ':Ciudad' => $this->Ciudad,
          ':Telefono' => $this->Telefono,
          ':Email' => $this->Email

   ]);
 }

