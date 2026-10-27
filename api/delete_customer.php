<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Müşteri adı zorunludur']);
    exit;
}

try {
    // Müşterinin tüm geçmiş fişlerini (Veresiye) de sileceksek silebiliriz.
    // Ancak sadece müşteriyi silip fişleri genel fiş olarak da bırakabiliriz.
    // En temiz olanı: Müşterinin ödenmemiş (CREDIT) ve ödenmiş (CREDIT_PAID) tüm veresiye geçmişini de silmektir ki ortada hayalet fiş kalmasın.
    
    // Önce bu müşteriye ait tüm veresiye fişlerinin ID'lerini bul
    $stmtSales = $pdo->prepare("SELECT id FROM sales WHERE customer_name = ? AND (payment_type = 'CREDIT' OR payment_type = 'CREDIT_PAID' OR payment_type = 'CREDIT_PAYMENT')");
    $stmtSales->execute([$data['name']]);
    $sales = $stmtSales->fetchAll(PDO::FETCH_COLUMN);
    
    // Eğer fiş varsa, bunların itemlerini sil
    if (count($sales) > 0) {
        $inQuery = implode(',', array_fill(0, count($sales), '?'));
        $stmtDelItems = $pdo->prepare("DELETE FROM sale_items WHERE sale_id IN ($inQuery)");
        $stmtDelItems->execute($sales);
        
        $stmtDelSales = $pdo->prepare("DELETE FROM sales WHERE id IN ($inQuery)");
        $stmtDelSales->execute($sales);
    }
    
    // Sonra Müşteriyi tablodan sil
    $stmt = $pdo->prepare("DELETE FROM customers WHERE name = ?");
    $stmt->execute([$data['name']]);
    
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
