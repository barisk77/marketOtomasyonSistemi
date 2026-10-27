<?php
header('Content-Type: text/plain; charset=utf-8');
require 'db_connect.php';

try {
    $stmt = $pdo->query("SELECT count(*) as cnt FROM sys.columns WHERE Name = N'max_stock' AND Object_ID = Object_ID(N'products')");
    $row = $stmt->fetch();
    if ($row['cnt'] == 0) {
        $pdo->exec("ALTER TABLE products ADD max_stock INT DEFAULT 100");
        $pdo->exec("UPDATE products SET max_stock = 100 WHERE max_stock IS NULL");
        echo "Column max_stock added successfully.\n";
    } else {
        echo "Column max_stock already exists.\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
