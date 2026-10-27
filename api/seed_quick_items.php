<?php
require_once 'db_connect.php';

$quickItems = [
    ['barcode' => 'B001', 'name' => 'Ekmek', 'category' => 'Hızlı', 'price' => 10.00, 'stock' => 1000, 'color' => '🍞'],
    ['barcode' => 'B002', 'name' => 'Kete', 'category' => 'Hızlı', 'price' => 15.00, 'stock' => 1000, 'color' => '🥐'],
    ['barcode' => 'B003', 'name' => 'Yumurta (Adet)', 'category' => 'Hızlı', 'price' => 4.00, 'stock' => 1000, 'color' => '🥚'],
    ['barcode' => 'B004', 'name' => 'Poşet', 'category' => 'Hızlı', 'price' => 0.25, 'stock' => 5000, 'color' => '🛍️'],
    ['barcode' => 'B005', 'name' => 'Pet Bardak', 'category' => 'Hızlı', 'price' => 1.00, 'stock' => 1000, 'color' => '🥤'],
    ['barcode' => 'B006', 'name' => 'Su 0.5L', 'category' => 'Hızlı', 'price' => 5.00, 'stock' => 1000, 'color' => '💧']
];

foreach ($quickItems as $item) {
    // Check if exists
    $stmt = $pdo->prepare("SELECT id FROM products WHERE barcode = ?");
    $stmt->execute([$item['barcode']]);
    if ($stmt->rowCount() == 0) {
        $insert = $pdo->prepare("INSERT INTO products (barcode, name, category, price, stock, color) VALUES (?, ?, ?, ?, ?, ?)");
        $insert->execute([$item['barcode'], $item['name'], $item['category'], $item['price'], $item['stock'], $item['color']]);
    }
}

echo "Hızlı ürünler başarıyla eklendi!";
?>
