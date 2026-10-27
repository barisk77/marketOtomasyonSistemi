<?php
// Veritabanını oluşturmadan bağlandığımızı varsayarsak, bu dosya db_connect'ten farklı bir bağlantı gerektirebilir.
// Ancak kolaylık olması için market_db'nin var olduğunu varsayıyoruz.
require_once 'db_connect.php';

$sql = "
IF OBJECT_ID('sale_items', 'U') IS NOT NULL DROP TABLE sale_items;
IF OBJECT_ID('sales', 'U') IS NOT NULL DROP TABLE sales;
IF OBJECT_ID('products', 'U') IS NOT NULL DROP TABLE products;

CREATE TABLE products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    barcode VARCHAR(50) NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    color VARCHAR(20) NOT NULL DEFAULT '#ffffff'
);

CREATE TABLE sales (
    id INT IDENTITY(1,1) PRIMARY KEY,
    total DECIMAL(10, 2) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE sale_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);
";

try {
    $pdo->exec($sql);
    echo "Tablolar başarıyla oluşturuldu!";
} catch (PDOException $e) {
    echo "Hata: " . $e->getMessage();
}
?>
