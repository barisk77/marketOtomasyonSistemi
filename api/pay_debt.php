<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['name']) || empty($data['amount'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Müşteri adı ve miktar zorunludur']);
    exit;
}

try {
    // 1. Düşülecek miktarı güncelle
    $stmt = $pdo->prepare("UPDATE customers SET total_debt = total_debt - ? WHERE name = ?");
    $stmt->execute([$data['amount'], $data['name']]);
    
    // 2. FIFO (İlk giren ilk çıkar) mantığıyla ödenen miktara denk gelen eski fişleri 'CREDIT_PAID' yapalım ki ekranda kalmasınlar
    $paymentAmount = (float)$data['amount'];
    
    $stmtSales = $pdo->prepare("SELECT id, total FROM sales WHERE customer_name = ? AND payment_type = 'CREDIT' ORDER BY id ASC");
    $stmtSales->execute([$data['name']]);
    $sales = $stmtSales->fetchAll();

    foreach ($sales as $sale) {
        $saleTotal = (float)$sale['total'];
        
        // Eğer ödediği para, bu eski fişin tutarını karşılıyorsa fişi ödendi olarak işaretle
        if ($paymentAmount >= $saleTotal && $saleTotal > 0) {
            $stmtUpdate = $pdo->prepare("UPDATE sales SET payment_type = 'CREDIT_PAID' WHERE id = ?");
            $stmtUpdate->execute([$sale['id']]);
            $paymentAmount -= $saleTotal;
        } else if ($paymentAmount > 0 && $paymentAmount < $saleTotal) {
            // Ödediği para bu fişi tamamen kapatmaya yetmiyorsa (kısmi ödeme)
            // 1. Fişin toplam tutarını düşürelim
            $stmtUpdateTotal = $pdo->prepare("UPDATE sales SET total = total - ? WHERE id = ?");
            $stmtUpdateTotal->execute([$paymentAmount, $sale['id']]);
            
            // 2. Fişin içerisine eksi (-) tutarlı bir "Kısmi Tahsilat" ürünü ekleyelim ki fişin matematiği bozulmasın
            // product_id zorunlu olduğu için 0 gönderiyoruz.
            $stmtInsertItem = $pdo->prepare("INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)");
            $stmtInsertItem->execute([$sale['id'], 0, 'Kısmi Tahsilat / Ödeme', 1, -$paymentAmount]);
            
            $paymentAmount = 0; // Kalan para bitti
            break;
        } else {
            break;
        }
    }
    
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
