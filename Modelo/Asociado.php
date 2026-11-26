<?php
// ============================================================================
// MODELO ASOCIADO (Asociado.php)
// Contiene todas las consultas SQL (CRUD) para la tabla "asociados"
// ============================================================================
require_once __DIR__ . '/../Config/conexion.php';

class Asociado
{
    // --- PARTE 1: Propiedades de la entidad y conexión PDO ---
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
    private $rol;

    // Acepta datos opcionales (compatible con GuardarAsociado.php y con el CRUD completo)
    public function __construct($datos = null)
    {
        $conexion = new Conexion();
        $this->conexion = $conexion->conectar();

        if (is_array($datos)) {
            $this->Documento = $datos['Documento'];
            $this->Nombre = $datos['Nombre'];
            $this->Apellido = $datos['Apellido'];
            $this->Fecha_Nacimiento = $datos['Fecha_Nacimiento'];
            $this->Genero = $datos['Genero'];
            $this->Direccion_Residencia = $datos['Direccion_Residencia'];
            $this->Ciudad = $datos['Ciudad'];
            $this->Telefono = $datos['Telefono'];
            $this->Email = $datos['Email'];
            $this->Contraseña = !empty($datos['Contraseña']) ? password_hash($datos['Contraseña'], PASSWORD_DEFAULT) : null;
            $this->rol = $datos['rol'] ?? 'Asociado';
        }
    }

    // --- PARTE 2: Consultas de lectura (SELECT todos o por documento) ---
    public function obtenerTodos()
    {
        $sql = "SELECT idAsociado, Documento, Nombre, Apellido, Fecha_Nacimiento, Genero,
                       Direccion_Residencia, Ciudad, Telefono, Email, rol
                FROM asociados
                ORDER BY idAsociado DESC";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute();
        return $consulta->fetchAll();
    }

    // Lista un solo asociado por documento (para vista de perfil)
    public function obtenerPorDocumento($documento)
    {
        $sql = "SELECT idAsociado, Documento, Nombre, Apellido, Fecha_Nacimiento, Genero,
                       Direccion_Residencia, Ciudad, Telefono, Email, rol
                FROM asociados
                WHERE Documento = :documento";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':documento' => $documento]);
        return $consulta->fetchAll();
    }

    // --- PARTE 3: Escritura en base de datos (INSERT guardar, UPDATE editar, DELETE eliminar) ---
    public function guardar($datos = null)
    {
        if (is_array($datos)) {
            $this->Documento = $datos['Documento'];
            $this->Nombre = $datos['Nombre'];
            $this->Apellido = $datos['Apellido'];
            $this->Fecha_Nacimiento = $datos['Fecha_Nacimiento'];
            $this->Genero = $datos['Genero'];
            $this->Direccion_Residencia = $datos['Direccion_Residencia'];
            $this->Ciudad = $datos['Ciudad'];
            $this->Telefono = $datos['Telefono'];
            $this->Email = $datos['Email'];
            $this->Contraseña = password_hash($datos['Contraseña'], PASSWORD_DEFAULT);
            $this->rol = $datos['rol'] ?? 'Asociado';
        }

        $sql = "INSERT INTO asociados
                (Documento, Nombre, Apellido, Fecha_Nacimiento, Genero, Direccion_Residencia, Ciudad, Telefono, Email, Contraseña, rol)
                VALUES
                (:Documento, :Nombre, :Apellido, :Fecha_Nacimiento, :Genero, :Direccion_Residencia, :Ciudad, :Telefono, :Email, :pass, :rol)";

        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([
            ':Documento'            => $this->Documento,
            ':Nombre'               => $this->Nombre,
            ':Apellido'             => $this->Apellido,
            ':Fecha_Nacimiento'     => $this->Fecha_Nacimiento,
            ':Genero'               => $this->Genero,
            ':Direccion_Residencia' => $this->Direccion_Residencia,
            ':Ciudad'               => $this->Ciudad,
            ':Telefono'             => $this->Telefono,
            ':Email'                => $this->Email,
            ':pass'                 => $this->Contraseña,
            ':rol'                  => $this->rol
        ]);

        return $this->conexion->lastInsertId();
    }

    // Actualiza un asociado existente (solo cambia la contraseña si se envió una nueva)
    public function editar($datos)
    {
        $params = [
            ':Documento'            => $datos['Documento'],
            ':Nombre'               => $datos['Nombre'],
            ':Apellido'             => $datos['Apellido'],
            ':Fecha_Nacimiento'     => $datos['Fecha_Nacimiento'],
            ':Genero'               => $datos['Genero'],
            ':Direccion_Residencia' => $datos['Direccion_Residencia'],
            ':Ciudad'               => $datos['Ciudad'],
            ':Telefono'             => $datos['Telefono'],
            ':Email'                => $datos['Email'],
            ':rol'                  => $datos['rol'],
            ':idAsociado'           => $datos['idAsociado']
        ];

        $cambioPass = "";
        if (!empty($datos['Contraseña'])) {
            $cambioPass = ", Contraseña = :pass";
            $params[':pass'] = password_hash($datos['Contraseña'], PASSWORD_DEFAULT);
        }

        $sql = "UPDATE asociados
                SET Documento = :Documento,
                    Nombre = :Nombre,
                    Apellido = :Apellido,
                    Fecha_Nacimiento = :Fecha_Nacimiento,
                    Genero = :Genero,
                    Direccion_Residencia = :Direccion_Residencia,
                    Ciudad = :Ciudad,
                    Telefono = :Telefono,
                    Email = :Email,
                    rol = :rol
                    {$cambioPass}
                WHERE idAsociado = :idAsociado";

        $consulta = $this->conexion->prepare($sql);
        $consulta->execute($params);

        if ($consulta->rowCount() > 0) {
            return true;
        }

        $verificar = $this->conexion->prepare("SELECT 1 FROM asociados WHERE idAsociado = :idAsociado");
        $verificar->execute([':idAsociado' => $datos['idAsociado']]);
        return (bool)$verificar->fetchColumn();
    }

    // Elimina un asociado por su idAsociado
    public function eliminar($idAsociado)
    {
        $sql = "DELETE FROM asociados WHERE idAsociado = :idAsociado";
        $consulta = $this->conexion->prepare($sql);
        $consulta->execute([':idAsociado' => $idAsociado]);
        return $consulta->rowCount() > 0;
    }
}
