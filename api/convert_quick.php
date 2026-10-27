<?php
require_once 'db_connect.php';
try {
    $pdo->exec("UPDATE products SET is_quick = 1 WHERE category = 'Hızlı'");
    echo "Hızlı kategori ürünleri is_quick yapıldı";
} catch (Exception $e) {
    echo "Hata: " . $e->getMessage();
}
