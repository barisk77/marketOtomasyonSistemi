<?php
require_once 'db_connect.php';

try {
    // Add payment_type and customer_name to sales table if they don't exist
    $pdo->exec("
        IF NOT EXISTS (
            SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'sales' AND COLUMN_NAME = 'payment_type'
        )
        BEGIN
            ALTER TABLE sales ADD payment_type VARCHAR(50) DEFAULT 'CASH';
            ALTER TABLE sales ADD customer_name VARCHAR(255) NULL;
        END
    ");
    
    // Create customers table if it doesn't exist
    $pdo->exec("
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='customers' and xtype='U')
        CREATE TABLE customers (
            id INT IDENTITY(1,1) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NULL,
            total_debt DECIMAL(10,2) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    echo "Veresiye alt yapısı başarıyla kuruldu!";
} catch (PDOException $e) {
    echo "Hata: " . $e->getMessage();
}
?>
