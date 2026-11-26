<?php
// ============================================================================
// MODELO COMPROBANTE (Comprobante.php)
// Consultas SQL sobre "comprobantes_pago" vinculando asociados y préstamos
// ============================================================================
require_once __DIR__ . '/../Config/conexion.php';

class Comprobante
{
    // --- PARTE 1: Conexión PDO a la base de datos ---
    private $conexion;

    public function __construct()
    {
        $conexion = new Conexion();
        $this->conexion = $conexion->conectar();
    }

    // --- PARTE 2: Consultas de lectura y conteo de solicitudes pendientes ---
    public function obtenerTodos()
    {
        $sql = "SELECT c.idComprobante, c.documento, c.idPrestamo, c.mensaje, c.rutaImagen, c.estado, c.fechaEnvio,
                       a.Nombre, a.Apellido, a.Email,
                       p.ValorPrestamo, p.NumeroCuotas, p.Proposito
                FROM comprobantes_pago c
                LEFT JOIN asociados a ON c.documento = a.Documento
                LEFT JOIN prestamos p ON c.idPrestamo = p.idPrestamos
                ORDER BY (c.estado = 'Pendiente') DESC, c.idComprobante DESC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute();
        return $consulta->fetchAll();
    }

    // Lista únicamente los comprobantes enviados por un asociado específico junto con el préstamo
    public function obtenerPorDocumento($documento)
    {
        $sql = "SELECT c.idComprobante, c.documento, c.idPrestamo, c.mensaje, c.rutaImagen, c.estado, c.fechaEnvio,
                       p.ValorPrestamo, p.NumeroCuotas, p.Proposito
                FROM comprobantes_pago c
                LEFT JOIN prestamos p ON c.idPrestamo = p.idPrestamos
                WHERE c.documento = :documento
                ORDER BY c.idComprobante DESC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':documento' => $documento]);
        return $consulta->fetchAll();
    }

    // Devuelve los préstamos pertenecientes a un asociado (por documento) para el selector de abono
    public function obtenerPrestamosPorDocumento($documento)
    {
        $sql = "SELECT p.idPrestamos, p.ValorPrestamo, p.NumeroCuotas, p.FechaPrestamo, p.Proposito
                FROM prestamos p
                INNER JOIN asociados a ON p.idAsociado = a.idAsociado
                WHERE a.Documento = :documento
                ORDER BY p.idPrestamos ASC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':documento' => $documento]);
        return $consulta->fetchAll();
    }

    // Verifica que un idPrestamo pertenezca realmente al documento del asociado
    public function prestamoPerteneceADocumento($idPrestamo, $documento)
    {
        $sql = "SELECT 1
                FROM prestamos p
                INNER JOIN asociados a ON p.idAsociado = a.idAsociado
                WHERE p.idPrestamos = :idPrestamo AND a.Documento = :documento
                LIMIT 1";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([
            ':idPrestamo' => $idPrestamo,
            ':documento'  => $documento
        ]);
        return (bool)$consulta->fetchColumn();
    }

    // Cuenta cuántas solicitudes de comprobante están pendientes por revisar
    public function contarPendientes()
    {
        $sql = "SELECT COUNT(*) FROM comprobantes_pago WHERE estado = 'Pendiente'";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute();
        return (int)$consulta->fetchColumn();
    }

    // --- PARTE 3: Escritura (guardar envío, aprobar/rechazar estado y eliminar) ---
    public function guardar($documento, $mensaje, $rutaImagen, $idPrestamo = null)
    {
        $sql = "INSERT INTO comprobantes_pago (documento, idPrestamo, mensaje, rutaImagen, estado)
                VALUES (:documento, :idPrestamo, :mensaje, :rutaImagen, 'Pendiente')";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([
            ':documento'  => $documento,
            ':idPrestamo' => $idPrestamo,
            ':mensaje'    => $mensaje,
            ':rutaImagen' => $rutaImagen
        ]);
        return $this->conexion->lastInsertId();
    }

    // Cambia el estado de una solicitud (Pendiente, Aprobado o Rechazado)
    public function actualizarEstado($idComprobante, $estado)
    {
        $sql = "UPDATE comprobantes_pago SET estado = :estado WHERE idComprobante = :id";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([
            ':estado' => $estado,
            ':id'     => $idComprobante
        ]);

        if ($consulta->rowCount() > 0) {
            return true;
        }

        $verificar = $this->conexion->prepare("SELECT 1 FROM comprobantes_pago WHERE idComprobante = :id");
        $verificar->execute([':id' => $idComprobante]);
        return (bool)$verificar->fetchColumn();
    }

    // Obtiene un comprobante por su ID
    public function obtenerPorId($idComprobante)
    {
        $sql = "SELECT * FROM comprobantes_pago WHERE idComprobante = :id LIMIT 1";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':id' => $idComprobante]);
        return $consulta->fetch();
    }

    // Elimina una solicitud de comprobante por su ID
    public function eliminar($idComprobante)
    {
        $sql = "DELETE FROM comprobantes_pago WHERE idComprobante = :id";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':id' => $idComprobante]);
        return $consulta->rowCount() > 0;
    }
}
