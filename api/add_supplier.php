<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Firma adi zorunludur']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO suppliers (name, total_debt) VALUES (?, 0)");
    $stmt->execute([$data['name']]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
