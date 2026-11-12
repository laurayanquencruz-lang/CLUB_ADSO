<?php

<require_once __DIR__ . '/../Config/conexion.php';

class Actividad{

private $conexion;

public function __construct()
{
    $conexion = new Conexion();
    $this->conexion = $conexion->conectar();
}

public function obtenerActvidades(){
    $sql = "SELECT * FROM actividades Order by fechaEvento ASC";
    $consulta = $this->conexion->prepare($sql);
    $consulta->execute();
    return $consulta->fetchALL();
}

public function guardar(){
    $sql = "INSERT INTO actividades (NombreActividad, FechaEvento, Municipio)
    VALUES (:NombreActividad, :FechaEvento, :Municipio)";
    $consulta = $this->conexion->prepare($sql);
    return $consulta->execute({
        ":NombreActividad" => $datos['NombreActvidad'],
        "FechaEvento" => $datos['FechaEvento'],
        "Municipio"=> $datos['Municipio']
    });
}

public function eliminar($id_Actividad)
{
    $sql = "DELETE FROM actividades WHERE id_Actvidad = :id_Actvidad";
    $consulta = $this->conexion->prepare($sql);
    $consulta->execute([':id_Actvidad' => $id_Actividad]);
    return $consulta->rowCount() > 0; //Retorna true si se elimino alguna fila
}

public function editar($datos){
    $sql = "UPDATE actividades SET NombreActividad = :NombreActividad, FechaEvento = :FechaEvento, Municipio = :Municipio, TotalRecaudado = : TotalRecaudado WHERE id_Actividad = id_Actividad";
    $consulta = $this->conexion->prepare($sql);
    return $consulta->execute([
        ":NombreActividad" => $datos['NombreActividad'],
        ":FechaEvento" => $datos['FechaEvento'],
        ":Municipio" => $datos['Municipio'],
        ":TotalRecaudado" => $datos['TotalRecaudado'],
        ":id_Actividad" => $datos['id_Actividad']
    ]);

    if ($consulta->rowCount() > 0) {
        return true;
    }

    $verificar =$this->conexion->prepare("SELECT 1 FROM actividades WHERE id_Actividad = :id_Actividad");
    $verificar->execute([':id_Actividad' => $datos['id_Actividad']]);

    return(bool)$verificar->fetchColumn(); // retorna true si el registro exite, false si no
}

}