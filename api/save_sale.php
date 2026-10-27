<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['items']) || !isset($data['total'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Geçersiz veri']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Set defaults if not provided
    $paymentType = isset($data['payment_type']) ? $data['payment_type'] : 'CASH';
    $customerName = isset($data['customer_name']) ? $data['customer_name'] : null;

    // If it's a credit sale, ensure customer exists and update debt
    if ($paymentType === 'CREDIT' && $customerName) {
        $stmtCheck = $pdo->prepare("SELECT id FROM customers WHERE name = ?");
        $stmtCheck->execute([$customerName]);
        $customer = $stmtCheck->fetch();

        if ($customer) {
            $stmtUpdateDebt = $pdo->prepare("UPDATE customers SET total_debt = total_debt + ? WHERE id = ?");
            $stmtUpdateDebt->execute([$data['total'], $customer['id']]);
        } else {
            $stmtInsertCustomer = $pdo->prepare("INSERT INTO customers (name, total_debt) VALUES (?, ?)");
            $stmtInsertCustomer->execute([$customerName, $data['total']]);
        }
    }

    // 1. Insert into sales
    $stmtSale = $pdo->prepare("INSERT INTO sales (total, payment_type, customer_name) VALUES (?, ?, ?)");
    $stmtSale->execute([$data['total'], $paymentType, $customerName]);
    $saleId = $pdo->lastInsertId();

    // 2. Insert into sale_items and update stock
    $stmtItem = $pdo->prepare("INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)");
    $stmtUpdateStock = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

    foreach ($data['items'] as $item) {
        $stmtItem->execute([$saleId, $item['id'], $item['name'], $item['quantity'], $item['price']]);
        $stmtUpdateStock->execute([$item['quantity'], $item['id']]);
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'sale_id' => $saleId]);
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
