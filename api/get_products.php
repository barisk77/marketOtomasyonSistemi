<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

try {
    $stmt = $pdo->query("SELECT * FROM products ORDER BY id DESC");
    $products = $stmt->fetchAll();
    
    // Convert numeric strings to numbers for JS compatibility
    foreach ($products as &$p) {
        $p['id'] = (int)$p['id'];
        $p['price'] = (float)$p['price'];
        $p['stock'] = (int)$p['stock'];
        $p['is_quick'] = isset($p['is_quick']) ? (int)$p['is_quick'] : 0;
    }

    echo json_encode($products);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
