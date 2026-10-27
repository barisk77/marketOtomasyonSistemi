const { app, BrowserWindow, Menu } = require('electron');

// Kasiyer bilgisayarında yazdırma butonuna basıldığında soru sormadan tak diye yazdırması için
// app.commandLine.appendSwitch('kiosk-printing');

function createWindow () {
  // Yeni bir tarayıcı penceresi oluştur
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: __dirname + '/assets/icon.png', // İleride bir ikon eklerseniz diye
    webPreferences: {
      nodeIntegration: true
    }
  });

  // Üstteki standart Windows menüsünü (Dosya, Düzenle vs) kaldır (Tam uygulama hissi için)
  Menu.setApplicationMenu(null);

  // Uygulama açıldığında direkt EXE içindeki yerel dosyayı yükle (Tüm güncellemeler EXE'nin içinde kalır)
  win.loadFile('index.html');
  
  // İsterseniz otomatik tam ekran başlatabilirsiniz
  // win.maximize();

  // TERAZİ (Web Serial API) OTOMATİK BAĞLANTI İZNİ
  // Kasiyere hangi port olduğunu sormamak için bulduğu ilk cihaza otomatik bağlanır!
  win.webContents.session.on('select-serial-port', (event, portList, webContents, callback) => {
    event.preventDefault(); // Varsayılan pop-up penceresini iptal et
    if (portList && portList.length > 0) {
      // Bulunan ilk donanıma (teraziye) otomatik bağlan
      callback(portList[0].portId);
    } else {
      callback(''); // Cihaz bulunamadı
    }
  });

  win.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'serial') return true;
    return true; // Diğer izinlere de onay ver
  });

  win.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'serial') return true;
    return true;
  });
}

// Uygulama hazır olduğunda pencereyi aç
app.whenReady().then(createWindow);

// Bütün pencereler kapandığında uygulamadan çık
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
