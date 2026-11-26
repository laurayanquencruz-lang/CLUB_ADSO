<?php
// ============================================================================
// MODELO PRÉSTAMO (Prestamo.php)
// Consultas SQL (SELECT, INSERT, UPDATE, DELETE) sobre la tabla "prestamos"
// ============================================================================
require_once __DIR__ . '/../Config/conexion.php';

class Prestamo
{
    // --- PARTE 1: Conexión PDO a la base de datos ---
    private $conexion;

    public function __construct()
    {
        $conexion = new Conexion();
        $this->conexion = $conexion->conectar();
    }

    // --- PARTE 2: Consultas de lectura (todos los préstamos, por documento y lista de asociados) ---
    public function obtenerTodos()
    {
        $sql = "SELECT p.idPrestamos, p.ValorPrestamo, p.TasaInteres, p.NumeroCuotas,
                       p.FechaPrestamo, p.idAsociado, p.Proposito, p.Garantia,
                       a.Documento, a.Nombre, a.Apellido
                FROM prestamos p
                INNER JOIN asociados a ON p.idAsociado = a.idAsociado
                ORDER BY p.idPrestamos ASC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute();
        return $consulta->fetchAll();
    }

    // Lista únicamente los préstamos pertenecientes a un documento (para rol Asociado)
    public function obtenerPorDocumento($documento)
    {
        $sql = "SELECT p.idPrestamos, p.ValorPrestamo, p.TasaInteres, p.NumeroCuotas,
                       p.FechaPrestamo, p.idAsociado, p.Proposito, p.Garantia,
                       a.Documento, a.Nombre, a.Apellido
                FROM prestamos p
                INNER JOIN asociados a ON p.idAsociado = a.idAsociado
                WHERE a.Documento = :documento
                ORDER BY p.idPrestamos ASC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':documento' => $documento]);
        return $consulta->fetchAll();
    }

    // Devuelve los asociados disponibles para poblar el selector del formulario
    public function obtenerAsociados()
    {
        $sql = "SELECT idAsociado, Documento, Nombre, Apellido FROM asociados ORDER BY Nombre ASC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute();
        return $consulta->fetchAll();
    }

    // --- PARTE 3: Operaciones de escritura (guardar, editar y eliminar préstamos) ---
    public function guardar($datos)
    {
        $sql = "INSERT INTO prestamos
                (ValorPrestamo, TasaInteres, NumeroCuotas, FechaPrestamo, idAsociado, Proposito, Garantia)
                VALUES
                (:ValorPrestamo, :TasaInteres, :NumeroCuotas, :FechaPrestamo, :idAsociado, :Proposito, :Garantia)";

        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([
            ':ValorPrestamo' => $datos['ValorPrestamo'],
            ':TasaInteres'   => $datos['TasaInteres'],
            ':NumeroCuotas'  => $datos['NumeroCuotas'],
            ':FechaPrestamo' => $datos['FechaPrestamo'],
            ':idAsociado'    => $datos['idAsociado'],
            ':Proposito'     => $datos['Proposito'],
            ':Garantia'      => $datos['Garantia']
        ]);

        return $this->conexion->lastInsertId();
    }

    // Actualiza un préstamo existente por su idPrestamos
    public function editar($datos)
    {
        $sql = "UPDATE prestamos
                SET ValorPrestamo = :ValorPrestamo,
                    TasaInteres = :TasaInteres,
                    NumeroCuotas = :NumeroCuotas,
                    FechaPrestamo = :FechaPrestamo,
                    idAsociado = :idAsociado,
                    Proposito = :Proposito,
                    Garantia = :Garantia
                WHERE idPrestamos = :idPrestamos";

        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([
            ':ValorPrestamo' => $datos['ValorPrestamo'],
            ':TasaInteres'   => $datos['TasaInteres'],
            ':NumeroCuotas'  => $datos['NumeroCuotas'],
            ':FechaPrestamo' => $datos['FechaPrestamo'],
            ':idAsociado'    => $datos['idAsociado'],
            ':Proposito'     => $datos['Proposito'],
            ':Garantia'      => $datos['Garantia'],
            ':idPrestamos'   => $datos['idPrestamos']
        ]);

        if ($consulta->rowCount() > 0) {
            return true;
        }

        $verificar = $this->conexion->prepare("SELECT 1 FROM prestamos WHERE idPrestamos = :idPrestamos");
        $verificar->execute([':idPrestamos' => $datos['idPrestamos']]);
        return (bool)$verificar->fetchColumn();
    }

    // Elimina un préstamo por su idPrestamos
    public function eliminar($idPrestamos)
    {
        $sql = "DELETE FROM prestamos WHERE idPrestamos = :idPrestamos";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':idPrestamos' => $idPrestamos]);
        return $consulta->rowCount() > 0;
    }
}
