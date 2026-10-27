<?php
require_once 'db_connect.php';

$sql = "
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='suppliers' and xtype='U')
BEGIN
    CREATE TABLE suppliers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        total_debt DECIMAL(10, 2) DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE()
    );
END;

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='supplier_transactions' and xtype='U')
BEGIN
    CREATE TABLE supplier_transactions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        supplier_id INT NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'INVOICE' (Fatura), 'PAYMENT' (Ödeme)
        amount DECIMAL(10, 2) NOT NULL,
        description VARCHAR(255) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
    );
END;
";

try {
    $pdo->exec($sql);
    echo "Firma/Toptancı tabloları başarıyla oluşturuldu!";
} catch (PDOException $e) {
    echo "Hata: " . $e->getMessage();
}
?>
