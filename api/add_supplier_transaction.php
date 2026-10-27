<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['supplier_id']) || empty($data['type']) || empty($data['amount'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Gerekli alanlar eksik']);
    exit;
}

try {
    // İşlemi ekle
    $stmt = $pdo->prepare("INSERT INTO supplier_transactions (supplier_id, type, amount, description) VALUES (?, ?, ?, ?)");
    $stmt->execute([$data['supplier_id'], $data['type'], $data['amount'], $data['description'] ?? '']);

    // Firmanın toplam borcunu güncelle
    if ($data['type'] === 'INVOICE') {
        // Fatura girdiyse borcumuz artar
        $stmtUpdate = $pdo->prepare("UPDATE suppliers SET total_debt = total_debt + ? WHERE id = ?");
        $stmtUpdate->execute([$data['amount'], $data['supplier_id']]);
    } else if ($data['type'] === 'PAYMENT') {
        // Ödeme yaptıysak borcumuz azalır
        $stmtUpdate = $pdo->prepare("UPDATE suppliers SET total_debt = total_debt - ? WHERE id = ?");
        $stmtUpdate->execute([$data['amount'], $data['supplier_id']]);
    }

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
