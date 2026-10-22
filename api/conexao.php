<?php

$host = "localhost";
$banco = "memoriaspostumas_game";
$usuario = "root";
$senha = ""; // Se configurou uma senha, informe-a aqui.

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$banco;charset=utf8mb4",
        $usuario,
        $senha,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    exit("Falha na conexão com o banco.");
}

?>