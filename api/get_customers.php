<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

try {
    $stmt = $pdo->query("SELECT * FROM customers ORDER BY name ASC");
    $customers = $stmt->fetchAll();
    echo json_encode($customers);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
