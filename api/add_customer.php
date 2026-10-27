<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Müşteri adı boş olamaz']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO customers (name, phone) VALUES (?, ?)");
    $stmt->execute([$data['name'], isset($data['phone']) ? $data['phone'] : '']);
    $id = $pdo->lastInsertId();
    echo json_encode(['success' => true, 'id' => $id]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
