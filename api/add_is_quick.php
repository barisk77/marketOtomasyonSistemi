<?php
require_once 'db_connect.php';
try {
    $pdo->exec("ALTER TABLE products ADD is_quick TINYINT DEFAULT 0");
    echo "Sütun eklendi";
} catch (Exception $e) {
    echo "Hata: " . $e->getMessage();
}
