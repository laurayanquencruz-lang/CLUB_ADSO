<?php
require_once __DIR__ .'/../Config/conexion.php';


class Asociado
{
    private $documento;
    private $Nombre;
    private $Apellido;
    private $Fecha_Nacimiento;
    private $Genero;
    private $Direccion_Residencia;
    private $Ciudad;
    private $Telefono;
    private $Email;
    private $Contraseña;

    private $conexion;

    public function __construct($datos) {
        $this->documento = $datos['documento'];
        $this->Nombre = $datos['Nombre'];
        $this->Apellido = $datos['Apellido'];
        $this->Fecha_Nacimiento = $datos['Fecha_Nacimiento'];
        $this->Genero = $datos['Genero'];
        $this->Direccion_Residencia = $datos['Direccion_Residencia'];
        $this->Ciudad = $datos['Ciudad'];
        $this->Telefono = $datos['Telefono'];
        $this->Email = $datos['Email'];
        $this->Contraseña = password_hash($datos['Contraseña'], PASSWORD_DEFAULT);

        // Crear una instancia de la clase conexion
        require_once '../Config/conexion.php';
        $conexion = new conexion();
        $this->conexion = $conexionDB->conectar();
    }

public function guardar($datos)
{
   $sql = "INSERT INTO asociados (documento, Nombre, Apellido, Fecha_Nacimiento, Genero, Direccion_Residencia, Ciudad, Telefono, Email, Contraseña) VALUES (:documento, :Nombre, :Apellido, :Fecha_Nacimiento, :Genero, :Direccion_Residencia, :Ciudad, :Telefono, :Email, :Contraseña)";
   $consulta = $this->conexion->prepare($sql);
   return $consulta->execute([
         ':documento' => $this->documento,
          ':Nombre' => $this->Nombre,
          ':Apellido' => $this->Apellido,
          ':Fecha_Nacimiento' => $this->Fecha_Nacimiento,
          ':Genero' => $this->Genero,
          ':Direccion_Residencia' => $this->Direccion_Residencia,
          ':Ciudad' => $this->Ciudad,
          ':Telefono' => $this->Telefono,
          ':Email' => $this->Email,
          ':Contraseña' => $this->Contraseña,

   ]);
 }

}