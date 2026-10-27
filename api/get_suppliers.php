<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

try {
    // Tüm firmaları çek
    $stmt = $pdo->query("SELECT * FROM suppliers ORDER BY name ASC");
    $suppliers = $stmt->fetchAll();

    // Tüm firma işlemlerini çek
    $stmtTx = $pdo->query("SELECT * FROM supplier_transactions ORDER BY created_at ASC");
    $transactions = $stmtTx->fetchAll();

    // İşlemleri supplier_id'ye göre grupla (O(N) performansı için)
    $txMap = [];
    foreach ($transactions as $tx) {
        $sid = $tx['supplier_id'];
        if (!isset($txMap[$sid])) {
            $txMap[$sid] = [];
        }
        $txMap[$sid][] = $tx;
    }

    // İşlemleri firmalara eşleştir
    foreach ($suppliers as &$supplier) {
        $sid = $supplier['id'];
        $supplier['transactions'] = isset($txMap[$sid]) ? $txMap[$sid] : [];
    }

    echo json_encode($suppliers);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
