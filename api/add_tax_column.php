<?php
require_once 'db_connect.php';

try {
    // Add tax_rate column if it doesn't exist
    $stmt = $pdo->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'products' AND COLUMN_NAME = 'tax_rate'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE products ADD tax_rate INT DEFAULT 0");
        // Update existing quick items
        $pdo->exec("UPDATE products SET tax_rate = 1 WHERE name = 'Ekmek'");
        $pdo->exec("UPDATE products SET tax_rate = 10 WHERE name = 'Kete'");
        $pdo->exec("UPDATE products SET tax_rate = 20 WHERE name = 'Su 0.5L'");
        echo "Column tax_rate added successfully.";
    } else {
        echo "Column tax_rate already exists.";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
