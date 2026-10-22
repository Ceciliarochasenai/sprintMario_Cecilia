<?php
require __DIR__ . "conexao.php";

header("Content-Type: application/json; charset=utf-8");

try {
    $metodo = $_SERVER["REQUEST_METHOD"];

    if ($metodo === "GET") {
        $sql = "SELECT id, nome, pontos, data_registro
                FROM ranking
                ORDER BY pontos DESC, data_registro ASC
                LIMIT 10";

        $consulta = $pdo->query($sql);

        echo json_encode(
            $consulta->fetchAll(),
            JSON_UNESCAPED_UNICODE
        );
        exit;
    }

    if ($metodo === "POST") {
        $dados = json_decode(
            file_get_contents("php://input"),
            true
        );

        $nome = trim($dados["nome"] ?? "");
        $pontos = filter_var(
            $dados["pontos"] ?? null,
            FILTER_VALIDATE_INT
        );

        if (
            $nome === "" ||
            mb_strlen($nome) > 100 ||
            $pontos === false ||
            $pontos === null ||
            $pontos < 0
        ) {
            http_response_code(400);
            echo json_encode([
                "erro" => "Informe um nome válido e uma pontuação não negativa."
            ]);
            exit;
        }

        $sql = "INSERT INTO ranking (nome, pontos)
                VALUES (:nome, :pontos)";

        $consulta = $pdo->prepare($sql);
        $consulta->execute([
            ":nome" => $nome,
            ":pontos" => $pontos
        ]);

        http_response_code(201);
        echo json_encode([
            "mensagem" => "Pontuação salva!",
            "id" => $pdo->lastInsertId()
        ]);
        exit;
    }

    header("Allow: GET, POST");
    http_response_code(405);
    echo json_encode([
        "erro" => "Método não permitido."
    ]);

} catch (Throwable $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode([
        "erro" => "Erro interno ao processar o ranking."
    ]);
}