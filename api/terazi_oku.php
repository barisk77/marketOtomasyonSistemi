<?php
header('Content-Type: application/json; charset=utf-8');

// Terazi IP ve Port (Müşteriden alınan bilgiler buraya girilecek)
$ip = '192.168.2.99';
$port = 3001;

// Teraziye 2 saniyelik bir zaman aşımı (timeout) ile soket bağlantısı açıyoruz
$fp = @fsockopen($ip, $port, $errno, $errstr, 2); 

if (!$fp) {
    echo json_encode([
        'success' => false, 
        'error' => "Teraziye bağlanılamadı ($ip:$port). Bağlantı hatası: $errstr"
    ]);
    exit;
}

// Mettler Toledo bCom terazileri için ağırlık sorma (Read Weight) komutu.
// Genellikle "W" (Weight) veya standart protokol komutları kullanılır.
$command = "W\r\n";
fwrite($fp, $command);

// Yanıtı bekliyoruz (maksimum 2 saniye)
stream_set_timeout($fp, 2);
$response = fread($fp, 128); // Teraziden gelen veriyi (S S 2.450 kg) okuyoruz
fclose($fp);

if (empty($response)) {
    echo json_encode([
        'success' => false, 
        'error' => "Teraziden veri alınamadı. Cihaz sessiz."
    ]);
    exit;
}

// Gelen veri içinden SADECE RAKAMLARI VE NOKTAYI cımbızla çekiyoruz (Örn: "S S 2.450 kg" -> 2.450)
preg_match('/([0-9]+\.[0-9]+)/', $response, $matches);

if (isset($matches[1])) {
    $weight = (float)$matches[1];
    echo json_encode([
        'success' => true, 
        'weight' => $weight, 
        'raw_data' => $response
    ]);
} else {
    echo json_encode([
        'success' => false, 
        'error' => "Terazi anlaşılamayan bir format gönderdi.",
        'raw_data' => $response
    ]);
}
?>
