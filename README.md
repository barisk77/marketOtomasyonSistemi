# 🛒 Cihan Market - POS & Yönetim Otomasyon Sistemi

Modern, hızlı ve donanım entegrasyonlu Market Satış Noktası (POS) ve Arka Ofis Yönetim Sistemi. Masaüstü uygulaması olarak **Electron**, arka planda **PHP & Microsoft SQL Server (MSSQL)** ve modern web teknolojileri ile geliştirilmiştir.

---

## 🌟 Öne Çıkan Özellikler

### 1. ⚡ Hızlı Satış Noktası (POS)
- **Barkod Desteği:** Barkod okuyucuyla doğrudan ürün okutma ve sepete anında ekleme.
- **Hızlı Ürün Butonları:** Ekmek, poşet, su ve manav ürünleri gibi barkodsuz veya sık satılan ürünler için tek tıkla sepete ekleme.
- **Ödeme Seçenekleri:** Nakit, Kredi Kartı ve Veresiye (Açık Hesap) tahsilat türleri.
- **Kısmi ve Parçalı Tahsilat:** Esnek ödeme ve para üstü hesaplama.

### 2. ⚖️ Donanım & Çevre Birimi Entegrasyonu
- **Canlı Terazi Entegrasyonu:** Web Serial API üzerinden RS232/USB bağlantılı elektronik terazilerden darasız ve canlı ağırlık okuma.
- **Hızlı Fiş / Adisyon Yazdırma:** Kasiyer hızını kesmemek adına onay penceresi olmadan doğrudan termal fiş yazıcıya çıktı gönderme (`kiosk-printing` altyapısı).

### 3. 📦 Arka Ofis & Stok Yönetimi
- **Ürün Yönetimi:** Barkod, ürün adı, kategori, satış fiyatı, stok miktarı ve KDV oranı belirleme.
- **Resimli Katalog:** Ürünlere yerel resim atama ve görsel destekli manav/şarküteri yönetimi.
- **Stok Takibi & Kritik Seviye:** Stok azaldığında otomatik uyarı mekanizması ve maksimum stok kotası belirleme.

### 4. 📒 Müşteri & Veresiye Takibi
- Müşteri cari kartları açma, telefon ve adres bilgisi tutma.
- Müşteriye özel borç limiti ve toplam bakiye takibi.
- FIFO (İlk Giren İlk Çıkar) prensibiyle borç kapama ve kısmi ödeme tahsilatı.

### 5. 🚚 Toptancı & Tedarikçi Yönetimi
- Toptancı cari hesapları, fatura girişleri ve yapılan ödemeler.
- Geçmiş işlem dökümü (Fatura / Ödeme hareketleri) ve kalan bakiye tablosu.

### 6. 📈 Raporlama & Kasa Analizi
- Günlük, haftalık ve aylık ciro ve kârlılık takibi.
- Ödeme yöntemlerine göre (Nakit / POS / Veresiye) detaylı raporlar.
- En çok satan ürünler ve kategori bazlı ciro grafikleri.

---

## 🛠️ Teknoloji Yığını

- **Masaüstü Katmanı:** Electron (v43+)
- **Ön Yüz (Frontend):** HTML5, Modern Vanilla JavaScript (ES6+), CSS3 (Flexbox/Grid), FontAwesome Icons
- **Sunucu & API:** PHP 8+ (RESTful JSON API)
- **Veritabanı:** Microsoft SQL Server (MSSQL) & `pdo_sqlsrv` sürücüsü
- **Donanım İletişimi:** Web Serial API (Elektronik Terazi & Tartı), Raw Printing / ESC-POS hazır altyapı

---

## 📂 Proje Dizin Yapısı

```plaintext
market/
├── api/                   # PHP REST API uç noktaları
│   ├── db_connect.php     # MSSQL PDO dinamik bağlantı yöneticisi
│   ├── get_products.php   # Ürün listeleme API
│   ├── save_sale.php      # Satış tamamlama ve stok düşme API
│   ├── terazi_oku.php     # Donanım seri port okuma köprüsü
│   └── ...
├── assets/                # İkonlar ve uygulama görselleri
├── css/                   # Arayüz stil dosyaları (pos.css, admin.css, style.css)
├── database/              # SQL Şeması ve veritabanı kurulum scriptleri
│   └── schema.sql         # market_db tablo yapısı
├── img/                   # Hızlı tuşlar ve ürün görselleri
├── js/                    # Ön yüz JavaScript kodları (pos.js, admin.js)
├── index.html             # Ana Karşılama ve Modül Seçim Ekranı
├── pos.html               # Kasiyer / Hızlı Satış Arayüzü
├── arkaofis.html          # Yönetim, Rapor, Stok ve Cari Ekranı
├── main.js                # Electron Ana Süreç (Main Process) & Donanım İzinleri
├── package.json           # Node.js bağımlılıkları ve Electron derleme scriptleri
└── .gitignore             # Git takip dışı dosyalar listesi
```

---

## 🚀 Kurulum ve Çalıştırma

### 1. Gereksinimler
- [Node.js](https://nodejs.org/) (v18 veya üzeri önerilir)
- [XAMPP](https://www.apachefriends.org/) veya PHP 8+ kurulu yerel web sunucusu
- Microsoft SQL Server (Express veya Standart Sürüm) ve `pdo_sqlsrv` PHP eklentisi

### 2. Veritabanının Kurulması
1. SQL Server Management Studio (SSMS) uygulamasını açın.
2. `database/schema.sql` dosyasındaki SQL komutlarını çalıştırarak `market_db` veritabanını ve tabloları oluşturun.
3. `api/db_connect.php` dosyasında sunucu adınızı (`localhost\SQLEXPRESS` vb.) kontrol edin.

### 3. Projenin Başlatılması
Projeyi XAMPP `htdocs` altına yerleştirdikten sonra terminalde proje klasörünü açın:

```bash
# Bağımlılıkları yükleyin
npm install

# Masaüstü uygulamasını geliştirme modunda başlatın
npm start
```

### 4. Masaüstü EXE Paketleme (Build)
Uygulamayı bağımsız bir Windows `.exe` programı haline getirmek için:

```bash
npm run build
```
Oluşan çalıştırılabilir dosya `dist/` klasörü içerisine aktarılacaktır.

---

## 🔒 Güvenlik Notu
Bu projede kullanılan SSL anahtarları, büyük boyutlu derleme çıktıları (`dist/`), 3. parti binary dosyalar ve önbellekler `.gitignore` ile korunmaktadır. Canlı ortamda veritabanı şifrelerinizi ve bağlantı ayarlarınızı güvenli şekilde yapılandırmayı unutmayınız.

---

## 📄 Lisans
Bu proje özel kullanım ve geliştirme amacıyla tasarlanmıştır. Tüm hakları saklıdır.
