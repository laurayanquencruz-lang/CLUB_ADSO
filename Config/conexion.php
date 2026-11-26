<?php

// Clase encargada de abrir la conexión con la base de datos MySQL
class Conexion {
    // Dirección del servidor de base de datos (localhost en Laragon)
    private $host = "localhost";
    // Nombre de la base de datos del proyecto
    private $baseDatos = "mr_club";
    // Usuario de MySQL (por defecto "root" en Laragon)
    private $usuario = "root";
    // Contraseña de MySQL (vacía por defecto en Laragon)
    private $contraseña = "";

    // Método que crea y devuelve el objeto PDO listo para hacer consultas SQL
    public function conectar() {
        // Cadena de conexión (DSN) con el servidor, base de datos y codificación UTF-8 completa
        $dsn = "mysql:host={$this->host};dbname={$this->baseDatos};charset=utf8mb4";

        // Crea y retorna la conexión PDO configurada para lanzar excepciones y devolver arreglos asociativos
        return new PDO($dsn, $this->usuario, $this->contraseña, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,        // Convierte errores SQL en excepciones capturables
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,   // Devuelve cada fila con nombres de columna
        ]);
    }
}
