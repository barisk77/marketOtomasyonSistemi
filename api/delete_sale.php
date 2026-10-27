<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Fiş ID zorunludur']);
    exit;
}

try {
    // Fişi bulalım
    $stmt = $pdo->prepare("SELECT total, payment_type, customer_name FROM sales WHERE id = ?");
    $stmt->execute([$data['id']]);
    $sale = $stmt->fetch();

    if ($sale) {
        // Eğer bu bir veresiye fişi ise (Ödenmiş veya ödenmemiş fark etmez), 
        // asıl borcu (kısmi ödemeler hariç) bularak müşterinin bakiyesinden düşmeliyiz.
        if (($sale['payment_type'] === 'CREDIT' || $sale['payment_type'] === 'CREDIT_PAID') && !empty($sale['customer_name'])) {
            // Fişin Orijinal Tutarını bul (Eğer pay_debt.php 'Kısmi Tahsilat / Ödeme' eklediyse onu sayma)
            $stmtOriginalTotal = $pdo->prepare("
                SELECT SUM(price * quantity) as original_total 
                FROM sale_items 
                WHERE sale_id = ? AND product_name != 'Kısmi Tahsilat / Ödeme'
            ");
            $stmtOriginalTotal->execute([$data['id']]);
            $originalTotal = $stmtOriginalTotal->fetchColumn();
            
            if ($originalTotal) {
                $stmtUpdateDebt = $pdo->prepare("UPDATE customers SET total_debt = total_debt - ? WHERE name = ?");
                $stmtUpdateDebt->execute([$originalTotal, $sale['customer_name']]);
            }
        }
        
        // Fişin ürünlerini bulup stokları geri ekleyelim
        $stmtGetItems = $pdo->prepare("SELECT product_id, quantity FROM sale_items WHERE sale_id = ?");
        $stmtGetItems->execute([$data['id']]);
        $items = $stmtGetItems->fetchAll();

        $stmtRevertStock = $pdo->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
        foreach ($items as $item) {
            $stmtRevertStock->execute([$item['quantity'], $item['product_id']]);
        }
        
        // Fişi silelim
        $stmtDelItems = $pdo->prepare("DELETE FROM sale_items WHERE sale_id = ?");
        $stmtDelItems->execute([$data['id']]);
        
        $stmtDelSale = $pdo->prepare("DELETE FROM sales WHERE id = ?");
        $stmtDelSale->execute([$data['id']]);
        
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Fiş bulunamadı']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
