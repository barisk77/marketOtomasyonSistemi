<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

try {
    $stmtSales = $pdo->query("SELECT * FROM sales ORDER BY id DESC");
    $sales = $stmtSales->fetchAll();

    $stmtItems = $pdo->query("SELECT * FROM sale_items");
    $all_items = $stmtItems->fetchAll();

    // Group items by sale_id
    $items_by_sale = [];
    foreach ($all_items as $item) {
        $item['quantity'] = (int)$item['quantity'];
        $item['price'] = (float)$item['price'];
        $item['id'] = (int)$item['product_id']; // Map to JS format
        $item['name'] = $item['product_name']; // UNDEFINED HATASINI ÇÖZEN SATIR
        $items_by_sale[$item['sale_id']][] = $item;
    }

    $result = [];
    foreach ($sales as $s) {
        $result[] = [
            'id' => (int)$s['id'],
            'total' => (float)$s['total'],
            'date' => $s['created_at'],
            'payment_type' => isset($s['payment_type']) ? $s['payment_type'] : 'CASH',
            'customer_name' => isset($s['customer_name']) ? $s['customer_name'] : null,
            'items' => isset($items_by_sale[$s['id']]) ? $items_by_sale[$s['id']] : []
        ];
    }

    echo json_encode($result);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
