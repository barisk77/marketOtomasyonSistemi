-- =========================================================
-- MARKET OTOMASYONU VE POS SİSTEMİ - VERİTABANI ŞEMASI
-- Veritabanı Türü: Microsoft SQL Server (MSSQL)
-- Veritabanı Adı : market_db
-- =========================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'market_db')
BEGIN
    CREATE DATABASE market_db;
END
GO

USE market_db;
GO

-- 1. ÜRÜNLER TABLOSU (products)
IF OBJECT_ID('products', 'U') IS NULL
BEGIN
    CREATE TABLE products (
        id INT IDENTITY(1,1) PRIMARY KEY,
        barcode VARCHAR(50) NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        max_stock INT NOT NULL DEFAULT 100,
        tax_rate INT NOT NULL DEFAULT 0,
        is_quick TINYINT NOT NULL DEFAULT 0,
        image_path VARCHAR(255) NULL,
        color VARCHAR(20) NOT NULL DEFAULT '#ffffff'
    );
END
GO

-- 2. SATIŞLAR TABLOSU (sales)
IF OBJECT_ID('sales', 'U') IS NULL
BEGIN
    CREATE TABLE sales (
        id INT IDENTITY(1,1) PRIMARY KEY,
        total DECIMAL(10, 2) NOT NULL,
        payment_type VARCHAR(50) DEFAULT 'CASH', -- 'CASH', 'CREDIT', 'CREDIT_PAID', 'POS'
        customer_name VARCHAR(255) NULL,
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- 3. SATIŞ DETAYLARI TABLOSU (sale_items)
IF OBJECT_ID('sale_items', 'U') IS NULL
BEGIN
    CREATE TABLE sale_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        sale_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        CONSTRAINT FK_sale_items_sales FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    );
END
GO

-- 4. VERESİYE / MÜŞTERİLER TABLOSU (customers)
IF OBJECT_ID('customers', 'U') IS NULL
BEGIN
    CREATE TABLE customers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NULL,
        total_debt DECIMAL(10, 2) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
END
GO

-- 5. TEDARİKÇİ / TOPTANCI TABLOSU (suppliers)
IF OBJECT_ID('suppliers', 'U') IS NULL
BEGIN
    CREATE TABLE suppliers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        total_debt DECIMAL(10, 2) DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE()
    );
END
GO

-- 6. TEDARİKÇİ İŞLEM GEÇMİŞİ (supplier_transactions)
IF OBJECT_ID('supplier_transactions', 'U') IS NULL
BEGIN
    CREATE TABLE supplier_transactions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        supplier_id INT NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'INVOICE' (Fatura), 'PAYMENT' (Ödeme)
        amount DECIMAL(10, 2) NOT NULL,
        description VARCHAR(255) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_supplier_transactions_suppliers FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
    );
END
GO
