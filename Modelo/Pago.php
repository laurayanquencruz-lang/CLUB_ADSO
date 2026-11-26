<?php
require_once __DIR__ . '/../Config/conexion.php';

class Pago
{
    private $conexion;

    public function __construct()
    {
        $conexion = new Conexion();
        $this->conexion = $conexion->conectar();
    }

    // Lista todos los pagos junto con el nombre del asociado (por su documento)
    public function obtenerTodos()
    {
        $sql = "SELECT p.idPago, p.documento, p.monto, p.concepto, p.metodoPago,
                       p.fechaPago, p.numeroComprobante, p.observaciones,
                       a.Nombre, a.Apellido
                FROM pagos p
                LEFT JOIN asociados a ON p.documento = a.Documento
                ORDER BY p.idPago ASC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute();
        return $consulta->fetchAll();
    }

    // Lista solo los pagos de un asociado específico (para rol Asociado)
    public function obtenerPorDocumento($documento)
    {
        $sql = "SELECT p.idPago, p.documento, p.monto, p.concepto, p.metodoPago,
                       p.fechaPago, p.numeroComprobante, p.observaciones,
                       a.Nombre, a.Apellido
                FROM pagos p
                LEFT JOIN asociados a ON p.documento = a.Documento
                WHERE p.documento = :documento
                ORDER BY p.idPago ASC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':documento' => $documento]);
        return $consulta->fetchAll();
    }

    // Devuelve los asociados disponibles para el selector del formulario de pagos
    public function obtenerAsociados()
    {
        $sql = "SELECT idAsociado, Documento, Nombre, Apellido FROM asociados ORDER BY Nombre ASC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute();
        return $consulta->fetchAll();
    }

    // Registra un nuevo pago en la base de datos y devuelve su ID
    public function guardar($datos)
    {
        $sql = "INSERT INTO pagos
                (documento, monto, concepto, metodoPago, fechaPago, numeroComprobante, observaciones)
                VALUES
                (:documento, :monto, :concepto, :metodoPago, :fechaPago, :numeroComprobante, :observaciones)";

        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([
            ':documento'         => $datos['documento'],
            ':monto'             => $datos['monto'],
            ':concepto'          => $datos['concepto'],
            ':metodoPago'        => $datos['metodoPago'],
            ':fechaPago'         => $datos['fechaPago'],
            ':numeroComprobante' => $datos['numeroComprobante'],
            ':observaciones'     => $datos['observaciones']
        ]);

        return $this->conexion->lastInsertId();
    }

    // Actualiza un pago existente por su idPago
    public function editar($datos)
    {
        $sql = "UPDATE pagos
                SET documento = :documento,
                    monto = :monto,
                    concepto = :concepto,
                    metodoPago = :metodoPago,
                    fechaPago = :fechaPago,
                    numeroComprobante = :numeroComprobante,
                    observaciones = :observaciones
                WHERE idPago = :idPago";

        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([
            ':documento'         => $datos['documento'],
            ':monto'             => $datos['monto'],
            ':concepto'          => $datos['concepto'],
            ':metodoPago'        => $datos['metodoPago'],
            ':fechaPago'         => $datos['fechaPago'],
            ':numeroComprobante' => $datos['numeroComprobante'],
            ':observaciones'     => $datos['observaciones'],
            ':idPago'            => $datos['idPago']
        ]);

        if ($consulta->rowCount() > 0) {
            return true;
        }

        $verificar = $this->conexion->prepare("SELECT 1 FROM pagos WHERE idPago = :idPago");
        $verificar->execute([':idPago' => $datos['idPago']]);
        return (bool)$verificar->fetchColumn();
    }

    // Elimina un pago por su idPago
    public function eliminar($idPago)
    {
        $sql = "DELETE FROM pagos WHERE idPago = :idPago";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':idPago' => $idPago]);
        return $consulta->rowCount() > 0;
    }
}
