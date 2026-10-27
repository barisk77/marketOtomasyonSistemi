<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Geçersiz veri']);
    exit;
}

try {
    $image_path = null;
    if (isset($data['image_base64']) && $data['image_base64']) {
        // img/urunler klasörü yoksa oluştur
        $img_dir = '../img/urunler/';
        if (!file_exists($img_dir)) {
            mkdir($img_dir, 0777, true);
        }
        
        // Base64 kodunu parçala ve resmi kaydet
        $base64_string = $data['image_base64'];
        list($type, $base64_string) = explode(';', $base64_string);
        list(, $base64_string)      = explode(',', $base64_string);
        $file_data = base64_decode($base64_string);
        
        // Uzantıyı belirle
        $ext = 'png';
        if (strpos($type, 'jpeg') !== false) $ext = 'jpg';
        elseif (strpos($type, 'webp') !== false) $ext = 'webp';
        
        $file_name = uniqid() . '.' . $ext;
        $full_path = $img_dir . $file_name;
        
        file_put_contents($full_path, $file_data);
        $image_path = 'img/urunler/' . $file_name;
    }

    if (isset($data['id']) && $data['id']) {
        // Update
        $tax_rate = isset($data['tax_rate']) ? (int)$data['tax_rate'] : 0;
        $is_quick = isset($data['is_quick']) ? (int)$data['is_quick'] : 0;
        
        if ($image_path) {
            $stmt = $pdo->prepare("UPDATE products SET barcode = ?, name = ?, category = ?, price = ?, stock = ?, tax_rate = ?, is_quick = ?, image_path = ?, max_stock = CASE WHEN ? > max_stock THEN ? ELSE max_stock END WHERE id = ?");
            $stmt->execute([$data['barcode'], $data['name'], $data['category'], $data['price'], $data['stock'], $tax_rate, $is_quick, $image_path, $data['stock'], $data['stock'], $data['id']]);
        } else {
            $stmt = $pdo->prepare("UPDATE products SET barcode = ?, name = ?, category = ?, price = ?, stock = ?, tax_rate = ?, is_quick = ?, max_stock = CASE WHEN ? > max_stock THEN ? ELSE max_stock END WHERE id = ?");
            $stmt->execute([$data['barcode'], $data['name'], $data['category'], $data['price'], $data['stock'], $tax_rate, $is_quick, $data['stock'], $data['stock'], $data['id']]);
        }
        
        echo json_encode(['success' => true, 'id' => $data['id']]);
    } else {
        // Insert
        $color = $data['color'] ?? '#ffffff';
        $tax_rate = isset($data['tax_rate']) ? (int)$data['tax_rate'] : 0;
        $is_quick = isset($data['is_quick']) ? (int)$data['is_quick'] : 0;
        
        // Yeni üründe image_path de gönderiliyor
        $stmt = $pdo->prepare("INSERT INTO products (barcode, name, category, price, stock, color, tax_rate, is_quick, max_stock, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$data['barcode'], $data['name'], $data['category'], $data['price'], $data['stock'], $color, $tax_rate, $is_quick, $data['stock'], $image_path]);
        
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
