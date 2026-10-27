<?php
// Microsoft SQL Server Baglanti Ayarlari
$serverNames = ["localhost\SQLEXPRESS", "CIHANSERVER\SQLEXPRESS", "CIHANSERVER", "localhost"];
$database = "market_db";
$pdo = null;
$lastError = "";
$cacheFile = __DIR__ . "/db_server_cache.txt";

// Eger daha once basarili olmus bir sunucu varsa, listeyi onunla baslat
if (file_exists($cacheFile)) {
    $cachedServer = trim(file_get_contents($cacheFile));
    if (!empty($cachedServer) && in_array($cachedServer, $serverNames)) {
        $serverNames = array_diff($serverNames, [$cachedServer]);
        array_unshift($serverNames, $cachedServer);
    }
}

foreach ($serverNames as $serverName) {
    // Timeout degerini 2 saniye yaparak, baglanamayan sunucularda bekleme suresini azaltiyoruz
    $dsn = "sqlsrv:Server=$serverName;Database=$database;TrustServerCertificate=1;LoginTimeout=2";
    try {
        $pdo = new PDO($dsn, "", "");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        // Baglanti basariliysa, cache dosyasini guncelle
        if (!file_exists($cacheFile) || trim(file_get_contents($cacheFile)) !== $serverName) {
            file_put_contents($cacheFile, $serverName);
        }
        
        break; // Baglanti basariliysa donguden cik
    } catch (PDOException $e) {
        $lastError = $e->getMessage();
    }
}

if (!$pdo) {
    die(json_encode(["error" => "Veritabani baglanti hatasi: " . $lastError]));
}
?>
