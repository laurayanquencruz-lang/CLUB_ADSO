<?php

// Importa la clase Conexion para poder conectarse a la base de datos mr_club
require_once __DIR__ . '/../Config/conexion.php';

// Clase Modelo que contiene todas las consultas SQL de la tabla "actividades"
class Actividad
{
    // Propiedad privada donde se guarda la conexión PDO activa
    private $conexion;

    // Constructor: se ejecuta automáticamente al hacer "new Actividad()"
    public function __construct()
    {
        // Crea un objeto de la clase Conexion
        $conexion = new Conexion();
        // Abre la conexión a MySQL y la guarda en $this->conexion
        $this->conexion = $conexion->conectar();
    }

    // Consulta y devuelve todas las actividades ordenadas por fecha y hora ascendente
    public function obtenerActividades()
    {
        // Sentencia SQL para traer todas las filas ordenadas cronológicamente
        $sql = "SELECT * FROM actividades ORDER BY FechaEvento ASC, HoraInicio ASC";
        // Prepara la consulta en PDO
        $consulta = $this->conexion->prepare($sql);
        // Ejecuta la consulta en MySQL
        $consulta->execute();
        // Devuelve todas las filas encontradas como un arreglo asociativo
        return $consulta->fetchAll();
    }

    // Inserta una nueva actividad en la tabla "actividades" y retorna el ID generado
    public function guardar($datos)
    {
        // Sentencia SQL INSERT con marcadores seguros (:parametro) para evitar inyección SQL
        $sql = "INSERT INTO actividades
                (NombreActividad, TipoActividad, FechaEvento, HoraInicio, Cupos, Responsable, Descripcion)
                VALUES
                (:NombreActividad, :TipoActividad, :FechaEvento, :HoraInicio, :Cupos, :Responsable, :Descripcion)";

        // Prepara la sentencia SQL antes de enviar los valores
        $consulta = $this->conexion->prepare($sql);
        // Ejecuta el INSERT reemplazando cada marcador por su dato correspondiente
        $consulta->execute([
            ":NombreActividad" => $datos['nombreActividad'], // Nombre de la actividad
            ":TipoActividad"   => $datos['tipoActividad'],   // Categoría (Académica, Deportiva, etc.)
            ":FechaEvento"     => $datos['fechaActividad'],  // Fecha del evento (YYYY-MM-DD)
            ":HoraInicio"      => $datos['horaInicio'],      // Hora de inicio (HH:MM)
            ":Cupos"           => $datos['cupos'],           // Número de cupos disponibles
            ":Responsable"     => $datos['responsable'],     // Persona encargada o instructor
            ":Descripcion"     => $datos['descripcion']      // Detalles adicionales (o NULL)
        ]);

        // Devuelve el idActividad auto-incremental creado por MySQL
        return $this->conexion->lastInsertId();
    }

    // Elimina una actividad de la base de datos según su idActividad
    public function eliminar($idActividad)
    {
        // Sentencia SQL DELETE filtrando por el identificador único
        $sql = "DELETE FROM actividades WHERE idActividad = :idActividad";
        // Prepara la consulta segura
        $consulta = $this->conexion->prepare($sql);
        // Ejecuta el borrado pasando el ID recibido
        $consulta->execute([':idActividad' => $idActividad]);
        // Devuelve true si realmente se eliminó al menos una fila, o false si no existía
        return $consulta->rowCount() > 0;
    }

    // Actualiza los datos de una actividad existente en la tabla "actividades"
    public function editar($datos)
    {
        // Sentencia SQL UPDATE para modificar las columnas de un registro específico
        $sql = "UPDATE actividades
                SET NombreActividad = :NombreActividad,
                    TipoActividad = :TipoActividad,
                    FechaEvento = :FechaEvento,
                    HoraInicio = :HoraInicio,
                    Cupos = :Cupos,
                    Responsable = :Responsable,
                    Descripcion = :Descripcion
                WHERE idActividad = :idActividad";

        // Prepara la consulta UPDATE
        $consulta = $this->conexion->prepare($sql);
        // Ejecuta la actualización con los nuevos valores y el ID del registro
        $consulta->execute([
            ":NombreActividad" => $datos['nombreActividad'],
            ":TipoActividad"   => $datos['tipoActividad'],
            ":FechaEvento"     => $datos['fechaActividad'],
            ":HoraInicio"      => $datos['horaInicio'],
            ":Cupos"           => $datos['cupos'],
            ":Responsable"     => $datos['responsable'],
            ":Descripcion"     => $datos['descripcion'],
            ":idActividad"     => $datos['idActividad']
        ]);

        // Si se modificó al menos una fila, devuelve true de inmediato
        if ($consulta->rowCount() > 0) {
            return true;
        }

        // Si rowCount() fue 0 (porque guardaron exactamente los mismos datos), verifica si el ID existe
        $verificar = $this->conexion->prepare("SELECT 1 FROM actividades WHERE idActividad = :idActividad");
        // Ejecuta la verificación de existencia
        $verificar->execute([':idActividad' => $datos['idActividad']]);

        // Devuelve true si la actividad existe, o false si el ID no estaba en la tabla
        return (bool)$verificar->fetchColumn();
    }
}
