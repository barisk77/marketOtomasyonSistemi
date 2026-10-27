<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'İşlem ID zorunludur']);
    exit;
}

try {
    // Önce işlemi bul
    $stmt = $pdo->prepare("SELECT supplier_id, type, amount FROM supplier_transactions WHERE id = ?");
    $stmt->execute([$data['id']]);
    $tx = $stmt->fetch();

    if ($tx) {
        // İşlemi sil
        $stmtDel = $pdo->prepare("DELETE FROM supplier_transactions WHERE id = ?");
        $stmtDel->execute([$data['id']]);

        // Borcu geri al
        if ($tx['type'] === 'INVOICE') {
            // Faturayı sildiğimize göre borcumuz azalır
            $stmtUpdate = $pdo->prepare("UPDATE suppliers SET total_debt = total_debt - ? WHERE id = ?");
            $stmtUpdate->execute([$tx['amount'], $tx['supplier_id']]);
        } else if ($tx['type'] === 'PAYMENT') {
            // Ödemeyi sildiğimize göre borcumuz tekrar artar
            $stmtUpdate = $pdo->prepare("UPDATE suppliers SET total_debt = total_debt + ? WHERE id = ?");
            $stmtUpdate->execute([$tx['amount'], $tx['supplier_id']]);
        }
        
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'İşlem bulunamadı']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
