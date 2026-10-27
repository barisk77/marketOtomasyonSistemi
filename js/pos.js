const posApp = {
    products: [],
    categories: [],
    cart: [],
    activeCategory: 'Tümü',
    manavMeyveler: [
        { ad: 'Elma', emoji: '🍎' }, { ad: 'Muz', emoji: '🍌' }, { ad: 'Portakal', emoji: '🍊' },
        { ad: 'Karpuz', emoji: '🍉' }, { ad: 'Üzüm', emoji: '🍇' }, { ad: 'Çilek', emoji: '🍓' },
        { ad: 'Şeftali', emoji: '🍑' }, { ad: 'Kiraz', emoji: '🍒' }, { ad: 'Armut', emoji: '🍐' },
        { ad: 'Kavun', emoji: '🍈' }, { ad: 'Mandalina', emoji: '🍊' }, { ad: 'Kivi', emoji: '🥝' },
        { ad: 'Ananas', emoji: '🍍' }, { ad: 'Mango', emoji: '🥭' }, { ad: 'Avokado', emoji: '🥑' },
        { ad: 'Erik', emoji: '🫐' }, { ad: 'Kayısı', emoji: '🍑' }, { ad: 'Yaban Mersini', emoji: '🫐' },
        { ad: 'Hindistan Cevizi', emoji: '🥥' }, { ad: 'Nar', emoji: '🍎' }
    ],
    manavSebzeler: [
        { ad: 'Domates', emoji: '🍅' }, { ad: 'Salatalık', emoji: '🥒' }, 
        { ad: 'Çarliston Biber', emoji: '🫑' }, { ad: 'Sivri Biber', emoji: '🌶️' },
        { ad: 'Dolmalık Biber', emoji: '🫑' }, { ad: 'Kapya Biber', emoji: '🌶️' },
        { ad: 'Köy Biberi', emoji: '🫑' }, { ad: 'Patlıcan', emoji: '🍆' }, 
        { ad: 'Patates', emoji: '🥔' }, { ad: 'Soğan', emoji: '🧅' },
        { ad: 'Havuç', emoji: '🥕' }, { ad: 'Limon', emoji: '🍋' }, { ad: 'Marul', emoji: '🥬' },
        { ad: 'Sarımsak', emoji: '🧄' }, { ad: 'Brokoli', emoji: '🥦' }, { ad: 'Mısır', emoji: '🌽' },
        { ad: 'Mantar', emoji: '🍄' }, { ad: 'Ispanak', emoji: '🥬' }, { ad: 'Taze Fasulye', emoji: '🫛' },
        { ad: 'Kabak', emoji: '🥒' }, { ad: 'Yeşil Soğan', emoji: '🌿' }, { ad: 'Maydanoz', emoji: '🌿' }
    ],

    async init() {
        this.products = await getProducts();
        this.extractCategories();
        this.renderCategories();
        this.renderProducts();
        this.bindEvents();
        this.updateParkedCount();
    },

    extractCategories() {
        const cats = new Set(this.products.map(p => p.category));
        this.categories = ['Tümü', ...Array.from(cats)];
    },

    renderCategories() {
        const container = document.getElementById('categoriesContainer');
        if (!container) return;
        container.innerHTML = this.categories.map(cat => `
            <button class="category-btn ${this.activeCategory === cat ? 'active' : ''}" 
                    onclick="posApp.setCategory('${cat}')">
                ${cat}
            </button>
        `).join('');
    },

    setCategory(cat) {
        this.activeCategory = cat;
        this.renderCategories();
        this.renderProducts();
    },

    renderProducts(searchQuery = '') {
        const grid = document.getElementById('productsGrid');
        
        let filtered = this.products;
        
        // Helper for dynamic images in Electron
        const getImageUrl = (path) => {
            if (!path) return '';
            if (window.location.protocol === 'file:') {
                return API_BASE_URL.replace('api/', '') + path;
            }
            return path;
        };

        // Seprate quick items
        const quickItems = this.products.filter(p => p.is_quick === 1);
        const quickGrid = document.getElementById('quickItemsGrid');
        
        // Categories container is always visible now
        const catContainer = document.getElementById('categoriesContainer');
        if (catContainer) {
            catContainer.style.display = 'flex';
        }
        
        // Quick items grid is only visible when category is 'Tümü' and no search
        if (quickItems.length > 0 && quickGrid && !searchQuery && this.activeCategory === 'Tümü') {
            quickGrid.style.display = 'grid';
            quickGrid.innerHTML = quickItems.map(p => {
                const nameLower = p.name ? p.name.toLowerCase() : '';
                let imgHtml = '<div style="font-size: 2.5rem;">📦</div>';
                
                if (p.image_path) {
                    imgHtml = `<img src="${getImageUrl(p.image_path)}" style="width:100%; height:80px; object-fit:contain; border-radius:8px;">`;
                } else if (nameLower.includes('ekmek')) {
                    imgHtml = '<img src="img/ekmek.png" style="width:100%; height:80px; object-fit:contain; border-radius:8px;">';
                } else if (nameLower.includes('kete')) {
                    imgHtml = '<img src="img/kete.png" style="width:100%; height:80px; object-fit:contain; border-radius:8px;">';
                } else if (nameLower.includes('yumurta')) {
                    imgHtml = '<img src="img/yumurta.png" style="width:100%; height:80px; object-fit:contain; border-radius:8px;">';
                } else if (nameLower.includes('poşet')) {
                    imgHtml = '<img src="img/poset.png" style="width:100%; height:80px; object-fit:contain; border-radius:8px;">';
                } else if (nameLower.includes('su')) {
                    imgHtml = '<img src="img/su.png" style="width:100%; height:80px; object-fit:contain; border-radius:8px;">';
                } else if (nameLower.includes('bardak')) {
                    imgHtml = '<img src="img/bardak.png" style="width:100%; height:80px; object-fit:contain; border-radius:8px;">';
                }
                
                return `
                <div class="product-card" onclick="posApp.addToCart(${p.id})" style="background: rgba(255, 255, 255, 0.1); border-color: var(--primary-color); padding: 0.5rem; height: auto;">
                    <div style="text-align: center; margin-bottom: 0.5rem;">${imgHtml}</div>
                    <div class="product-name" style="font-size: 0.95rem; font-weight: bold; margin-bottom: 0.2rem;">${p.name}</div>
                    <div class="product-price" style="font-size: 1.1rem; color: #10b981;">${p.price.toFixed(2)} ₺</div>
                </div>
            `}).join('');
        } else if (quickGrid) {
            quickGrid.style.display = 'none';
        }

        if (this.activeCategory !== 'Tümü') {
            filtered = filtered.filter(p => p.category === this.activeCategory);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p => 
                (p.name && p.name.toLowerCase().includes(query)) || 
                (p.barcode && p.barcode.toLowerCase().includes(query))
            );
        }

        // Show main grid if searching OR if a specific category is selected
        if (!searchQuery && this.activeCategory === 'Tümü') {
            grid.style.display = 'none';
        } else {
            grid.style.display = 'grid';
            
            // PERFORMANS İYİLEŞTİRMESİ: Binlerce ürünü aynı anda DOM'a basmak kilitlenmeye sebep olur.
            // POS ekranında görsellerin sadece ilk 100 tanesini render ediyoruz.
            const limitedProducts = filtered.slice(0, 100);

            if (limitedProducts.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">Ürün bulunamadı.</div>';
                return;
            }

            grid.innerHTML = limitedProducts.map(p => `
                <div class="product-card" onclick="posApp.addToCart(${p.id})">
                    ${p.image_path ? `<div style="text-align: center; margin-bottom: 0.5rem;"><img src="${getImageUrl(p.image_path)}" style="width:100%; height:80px; object-fit:contain; border-radius:8px;"></div>` : ''}
                    <div class="product-name">${p.name}</div>
                    <div class="product-price">${parseFloat(p.price).toFixed(2)} ₺</div>
                    <div style="font-size: 0.8rem; color: #9ca3af; margin-top: 0.5rem; display: flex; justify-content: space-between;">
                        <span>Stok: <span style="color: ${p.stock < ((p.max_stock || 100) * 0.20) ? '#ef4444' : 'inherit'}">${p.stock}</span></span>
                        ${p.barcode ? `<span><i class="fas fa-barcode"></i> ${p.barcode}</span>` : ''}
                    </div>
                </div>
            `).join('');
            
            // Eğer filtrelenen 100'den fazlaysa alt kısımda küçük bir uyarı gösterilebilir
            if (filtered.length > 100) {
                grid.innerHTML += `<div style="grid-column: 1 / -1; text-align: center; padding: 1rem; color: #9ca3af; font-size: 0.9rem;">...ve ${filtered.length - 100} ürün daha (Lütfen arama yapın)</div>`;
            }
        }
    },

    bindEvents() {
        let searchTimeout;
        document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.renderProducts(e.target.value);
            }, 150); // Barkod okuyucu yazarken DOM kilitlenmemesi için gecikme
        });

        // Global barcode listener
        let barcodeBuffer = '';
        let barcodeTimeout = null;
        
        document.addEventListener('keypress', (e) => {
            // Ignore if typing inside input fields other than search
            if (e.target.tagName === 'INPUT' && e.target.id !== 'searchInput') return;

            if (e.key === 'Enter') {
                if (barcodeBuffer.length > 0) {
                    this.handleBarcodeScan(barcodeBuffer);
                    barcodeBuffer = '';
                }
            } else {
                barcodeBuffer += e.key;
                clearTimeout(barcodeTimeout);
                barcodeTimeout = setTimeout(() => {
                    barcodeBuffer = '';
                }, 500); // 500ms'ye çıkardık ki klavyeden elle test edebilin
            }
        });
    },

    playBeep(type = 'success') {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            if (type === 'success') {
                // Standart ince kısa bip sesi (kayıtlı ürün)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'error') {
                // Kalın, çift hata sesi (kayıt dışı ürün)
                osc.type = 'square';
                osc.frequency.setValueAtTime(250, ctx.currentTime);
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                osc.start();
                
                // İlk bip bitişi
                gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.15);
                // İkinci bip başlangıcı
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime + 0.2);
                osc.stop(ctx.currentTime + 0.35);
            }
        } catch (e) {
            console.error("Ses oynatılamadı:", e);
        }
    },

    handleBarcodeScan(barcode) {
        // 1. DİNAMİK TERAZİ BARKODU KONTROLÜ (27, 28, 29 ile başlayan manav terazileri)
        // Format: 27 PPPPP WWWWW C (Örn: 27 00015 01250 8)
        if (barcode.length === 13 && (barcode.startsWith('27') || barcode.startsWith('28') || barcode.startsWith('29'))) {
            const itemCode = barcode.substring(2, 7); // Örn: 00015
            const weightData = barcode.substring(7, 12); // Örn: 01250 (1.250 kg)
            
            // Sistemi ürün koduyla (00015), ürün kodunun sayısal haliyle (15) veya tam barkodla ara
            const numericCode = parseInt(itemCode, 10).toString();
            const scaleProduct = this.products.find(p => 
                p.barcode === itemCode || 
                p.barcode === numericCode || 
                p.barcode === barcode
            );
            
            if (scaleProduct) {
                const weightInKg = parseInt(weightData, 10) / 1000; // 01250 -> 1.250
                const existing = this.cart.find(item => item.id === scaleProduct.id);
                if (existing) {
                    existing.quantity += weightInKg;
                } else {
                    this.cart.push({ ...scaleProduct, quantity: weightInKg });
                }
                this.renderCart();
                this.playBeep('success');
                return; // Normal ürün aramasına gitme
            } else {
                this.playBeep('error');
            }
        }

        // 2. NORMAL STANDART ÜRÜN BARKODU
        const product = this.products.find(p => p.barcode === barcode);
        if (product) {
            this.addToCart(product.id);
            this.playBeep('success');
        } else {
            // Ürün yoksa farklı bir ses çalarak kasiyeri uyar
            this.playBeep('error');
            // Ürün yoksa hızlı ekleme penceresini aç
            this.openFastAddModal(barcode);
        }
    },

    openFastAddModal(barcode) {
        document.getElementById('fastBarcode').value = barcode || '';
        document.getElementById('fastName').value = '';
        document.getElementById('fastPrice').value = '';
        document.getElementById('fastStock').value = '100'; // Varsayılan hızlı stok
        document.getElementById('fastCategory').value = 'GENELSTOK';
        document.getElementById('fastTax').value = '0';
        document.getElementById('fastAddModal').classList.add('show');
        
        setTimeout(() => {
            if (barcode) {
                document.getElementById('fastName').focus();
            } else {
                document.getElementById('fastBarcode').focus();
            }
        }, 100);
    },

    closeFastAddModal() {
        document.getElementById('fastAddModal').classList.remove('show');
    },

    async testScale() {
        this.showAlert('Teraziye bağlanılıyor (192.168.2.99:3001)... Lütfen bekleyin.', 'Terazi Testi');
        
        try {
            const response = await fetch('api/terazi_oku.php');
            const data = await response.json();
            
            if (data.success) {
                // Eğer terazi cevap verirse sepete bir test ürünü atarak kiloyu test edelim!
                const testUrunu = {
                    id: 'TEST-TERAZI',
                    name: 'Test Teraziden Gelen',
                    price: 100, // Kilosu 100 TL
                    stock: 999,
                    category: 'MANAV'
                };
                
                // Sepete kiloyla ekle
                const cartItem = { ...testUrunu, quantity: data.weight };
                this.cart.unshift(cartItem);
                this.renderCart();
                
                this.showAlert(`BAŞARILI! Teraziden okunan ağırlık: ${data.weight} KG.<br><br>Test ürünü sepete eklendi!`, 'Bağlantı Başarılı');
            } else {
                this.showAlert(`BAŞARISIZ! <br> Hata: ${data.error}`, 'Bağlantı Hatası');
            }
        } catch (error) {
            this.showAlert('Terazi servisine (PHP) ulaşılamadı. Sunucu hatası.', 'Hata');
        }
    },

    async saveFastProduct(event) {
        if (event) event.preventDefault();
        
        let barcode = document.getElementById('fastBarcode').value.trim();
        if (!barcode) {
            // Eğer elle hızlı ürün eklenip barkod boş bırakılırsa çakışmayı önlemek için otomatik üret
            barcode = 'HIZLI-' + Date.now();
        }
        
        const name = document.getElementById('fastName').value;
        const price = parseFloat(document.getElementById('fastPrice').value);
        const stock = parseInt(document.getElementById('fastStock').value);
        const category = document.getElementById('fastCategory').value;
        const tax_rate = parseInt(document.getElementById('fastTax').value);
        
        const newProduct = {
            id: null,
            barcode: barcode,
            name: name,
            category: category, 
            price: price,
            stock: stock,
            tax_rate: tax_rate,
            color: '#bfdbfe' // Mavi bir renk
        };
        
        // Veritabanına kaydet
        const res = await saveProductToDB(newProduct);
        
        if (res && res.success) {
            this.closeFastAddModal();
            
            // YENİ OPTİMİZASYON: Tüm ürünleri veritabanından çekmek yerine (donmaya sebep oluyordu)
            // ürünü sadece hafızadaki listeye ekliyoruz. Bu sayede 0 milisaniye gecikme yaşanır.
            newProduct.id = res.id;
            this.products.push(newProduct);
            
            // Eğer kasiyer o anda arama yapıyorsa ekranı güncelleyelim, yoksa boşuna render etmeye gerek yok
            const searchVal = document.getElementById('searchInput').value;
            if (searchVal) {
                this.renderProducts(searchVal);
            }
            
            // Yeni eklenen ürünü anında sepete at!
            this.addToCart(res.id);
        } else {
            this.showAlert('Ürün kaydedilirken bir hata oluştu.', 'Hata');
        }
    },
    
    openCameraScanner() {
        document.getElementById('cameraModal').classList.add('show');
        
        if (!this.html5QrCode) {
            this.html5QrCode = new Html5Qrcode("reader");
        }
        
        this.html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            (decodedText, decodedResult) => {
                this.closeCameraScanner();
                this.handleBarcodeScan(decodedText);
            },
            (errorMessage) => {}
        ).catch(err => {
            console.error("Kamera başlatılamadı:", err);
            this.showAlert("Kamera başlatılamadı. İzinleri kontrol edin veya arka kameranız olduğundan emin olun.", 'Kamera Hatası');
        });
    },

    closeCameraScanner() {
        document.getElementById('cameraModal').classList.remove('show');
        if (this.html5QrCode) {
            this.html5QrCode.stop().then(() => {
                this.html5QrCode.clear();
            }).catch(err => {
                console.error("Kamera durdurulamadı", err);
            });
        }
    },

    // --- KABLOLU TERAZİ (PC/USB/RS232) SİSTEMİ ---
    scalePort: null,
    currentScaleWeight: 0,
    
    connectScale() {
        document.getElementById('scaleModal').classList.add('show');
    },

    async triggerScaleConnect() {
        try {
            if (!("serial" in navigator)) {
                this.showAlert("Tarayıcınız Kablolu Terazi bağlantısını desteklemiyor (Web Serial API eksik). Lütfen güncel Chrome veya Electron kullanın.", 'Desteklenmiyor');
                return;
            }
            
            this.scalePort = await navigator.serial.requestPort();
            await this.scalePort.open({ baudRate: 9600 });
            
            const btn = document.getElementById('realConnectScaleBtn');
            btn.style.backgroundColor = '#10b981';
            btn.innerText = 'Bağlandı - Dinleniyor...';
            btn.disabled = true;

            const topBtn = document.getElementById('connectScaleBtn');
            if (topBtn) {
                topBtn.style.color = '#10b981';
                topBtn.style.borderColor = '#10b981';
                topBtn.innerHTML = '<i class="fas fa-balance-scale"></i> Bağlı';
            }
            
            this.readScaleLoop();
        } catch (e) {
            console.error("Terazi bağlantı hatası:", e);
        }
    },
    
    async readScaleLoop() {
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = this.scalePort.readable.pipeTo(textDecoder.writable);
        const reader = textDecoder.readable.getReader();

        try {
            let buffer = "";
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                buffer += value;
                // CAS, TEM, DENSI terazileri veriyi genelde satır satır gönderir
                if (buffer.includes('\n') || buffer.includes('\r')) {
                    // Sayıları ayıkla (Örn: "+  1.250 kg" içinden 1.250'yi çıkarır)
                    const match = buffer.match(/[\d]+[.,][\d]+/);
                    if (match) {
                        const weight = parseFloat(match[0].replace(',', '.'));
                        this.currentScaleWeight = weight;
                        
                        const modalEl = document.getElementById('modalScaleWeight');
                        if (modalEl) modalEl.innerText = weight.toFixed(3);
                    }
                    buffer = ""; 
                }
            }
        } catch (error) {
            console.error("Terazi veri okuma hatası", error);
        } finally {
            reader.releaseLock();
        }
    },

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Terazide aktif bir ağırlık varsa (Örn: 1.45 kg) onu kullan, yoksa 1 adet say.
        let qtyToAdd = 1;
        if (this.currentScaleWeight > 0) {
            qtyToAdd = this.currentScaleWeight;
            // Tartı işi bitince kasiyer sepeti kitleyene kadar tartıyı sıfırlayabiliriz
            // this.currentScaleWeight = 0; // İsteğe bağlı
        }

        const existing = this.cart.find(item => item.id === productId);
        if (existing) {
            if (existing.quantity + qtyToAdd <= product.stock || this.currentScaleWeight > 0) {
                existing.quantity += qtyToAdd;
            } else {
                this.showAlert('Yetersiz stok!', 'Stok Uyarısı');
            }
        } else {
            if (product.stock > 0 || this.currentScaleWeight > 0) {
                this.cart.push({ ...product, quantity: qtyToAdd });
            } else {
                this.showAlert('Stokta yok!', 'Stok Uyarısı');
            }

        }
        
        // Ürün sepete eklendikten sonra arama kutusunu temizle ve tüm ürünleri tekrar listele
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value.trim() !== '') {
            searchInput.value = '';
            this.renderProducts();
        }

        this.renderCart();
    },

    updateQuantity(productId, delta) {
        const item = this.cart.find(i => i.id === productId);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            this.cart = this.cart.filter(i => i.id !== productId);
        } else if (item.quantity > this.products.find(p => p.id === productId).stock) {
            item.quantity--;
            this.showAlert('Yetersiz stok!', 'Stok Uyarısı');
        }
        this.renderCart();
    },

    setQuantity(productId, value) {
        const item = this.cart.find(i => i.id === productId);
        if (!item) return;

        let newQty = parseFloat(value);
        if (isNaN(newQty) || newQty <= 0) {
            this.cart = this.cart.filter(i => i.id !== productId);
        } else {
            const product = this.products.find(p => p.id === productId);
            if (newQty > product.stock && this.currentScaleWeight === 0) {
                this.showAlert('Yetersiz stok!', 'Stok Uyarısı');
                newQty = product.stock;
            }
            item.quantity = newQty;
        }
        this.renderCart();
    },

    clearCart() {
        if (this.cart.length === 0) return;
        this.showConfirm('Sepeti temizlemek istediğinize emin misiniz?', () => {
            this.cart = [];
            this.renderCart();
        });
    },

    renderCart() {
        const container = document.getElementById('cartItems');
        
        container.innerHTML = this.cart.map(item => {
            const price = parseFloat(item.price) || 0;
            const qty = parseFloat(item.quantity) || 1;
            return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name || 'İsimsiz Ürün'}</div>
                    <div class="cart-item-price">${price.toFixed(2)} ₺</div>
                </div>
                <div class="cart-item-actions">
                    <button class="qty-btn" onclick="posApp.updateQuantity(${item.id}, -1)"><i class="fas fa-minus"></i></button>
                    <span style="width: 50px; text-align: center; font-size: 1.2rem; font-weight: bold; cursor: pointer; padding: 0.5rem; background: #ffffff; border: 1px solid var(--surface-border); border-radius: 6px; display: inline-block; color: var(--text-primary);" onclick="posApp.openNumpad(${item.id}, ${qty})">${qty}</span>
                    <button class="qty-btn" onclick="posApp.updateQuantity(${item.id}, 1)"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            `;
        }).join('');

        this.calculateTotals();
    },

    calculateTotals() {
        const grandTotal = this.cart.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);
        document.getElementById('grandTotal').innerText = grandTotal.toFixed(2) + ' ₺';
    },

    showToast(msg) {
        const toast = document.getElementById('posToast');
        if (toast) {
            toast.innerText = msg;
            toast.style.display = 'block';
            setTimeout(() => { toast.style.display = 'none'; }, 3000);
        }
    },

    showAlert(message, title = 'Uyarı') {
        document.getElementById('posAlertTitle').innerText = title;
        document.getElementById('posAlertMessage').innerText = message;
        
        const iconDiv = document.getElementById('posAlertIcon');
        if (title.toLowerCase().includes('başarılı') || title.toLowerCase().includes('tamamlandı')) {
            iconDiv.innerHTML = '<i class="fas fa-check-circle"></i>';
            iconDiv.style.color = '#10b981';
        } else {
            iconDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            iconDiv.style.color = '#ef4444';
        }

        const modal = document.getElementById('posAlertModal');
        const okBtn = document.getElementById('posAlertOkBtn');
        
        modal.classList.add('show');
        
        okBtn.onclick = () => {
            modal.classList.remove('show');
        };
    },

    showConfirm(message, onConfirm, title = 'Emin misiniz?') {
        document.getElementById('posAlertTitle').innerText = title;
        document.getElementById('posAlertMessage').innerText = message;
        
        const iconDiv = document.getElementById('posAlertIcon');
        iconDiv.innerHTML = '<i class="fas fa-question-circle"></i>';
        iconDiv.style.color = '#3b82f6';
        
        const modal = document.getElementById('posAlertModal');
        const btnsDiv = document.getElementById('posAlertButtons');
        
        btnsDiv.innerHTML = `
            <button class="btn btn-outline" id="posAlertCancelBtn" style="flex: 1;">İptal</button>
            <button class="btn btn-primary" id="posAlertConfirmBtn" style="flex: 1; background: #ef4444; border-color: #ef4444;">Evet</button>
        `;
        
        modal.classList.add('show');
        
        document.getElementById('posAlertCancelBtn').onclick = () => {
            modal.classList.remove('show');
            // Butonları normale çevir
            btnsDiv.innerHTML = `<button class="btn btn-primary" id="posAlertOkBtn" style="flex: 1;">Tamam</button>`;
        };
        
        document.getElementById('posAlertConfirmBtn').onclick = () => {
            modal.classList.remove('show');
            btnsDiv.innerHTML = `<button class="btn btn-primary" id="posAlertOkBtn" style="flex: 1;">Tamam</button>`;
            if (onConfirm) onConfirm();
        };
    },

    async checkout() {
        if (this.cart.length === 0) {
            this.showAlert('Sepet boş!');
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 1)), 0);
        
        const sale = {
            items: [...this.cart],
            total: total
        };

        const result = await addSale(sale);
        
        if(result && result.sale_id) {
            sale.id = result.sale_id;
            sale.date = new Date().toISOString();
        } else {
            sale.id = Date.now();
            sale.date = new Date().toISOString();
        }
        
        this.products = await getProducts();
        
        // Fiş yazdırma onayı sor
        this.showReceiptPrompt(sale);
    },

    showReceiptPrompt(sale) {
        document.getElementById('posAlertTitle').innerText = 'Satış Tamamlandı';
        document.getElementById('posAlertMessage').innerText = 'Lütfen işlemi seçin:';
        
        const iconDiv = document.getElementById('posAlertIcon');
        iconDiv.innerHTML = '<i class="fas fa-check-circle"></i>';
        iconDiv.style.color = '#10b981';
        
        const modal = document.getElementById('posAlertModal');
        const btnsDiv = document.getElementById('posAlertButtons');
        
        btnsDiv.innerHTML = `
            <button class="btn btn-outline" id="receiptCancelBtn" style="flex: 1; border-color: #ef4444; color: #ef4444;">Satış İptal</button>
            <button class="btn btn-outline" id="receiptNoBtn" style="flex: 1;">Hayır</button>
            <button class="btn btn-primary" id="receiptYesBtn" style="flex: 1; background: #10b981; border-color: #10b981;">Evet, Yazdır</button>
        `;
        
        modal.classList.add('show');
        
        const finish = () => {
            modal.classList.remove('show');
            // Butonları orijinal haline çevir
            btnsDiv.innerHTML = `<button class="btn btn-primary" id="posAlertOkBtn" style="flex: 1;" onclick="document.getElementById('posAlertModal').classList.remove('show')">Tamam</button>`;
            this.cart = [];
            this.renderCart();
            this.renderProducts();
        };

        const cancelSaleAction = async () => {
            if (sale.id) {
                await deleteSale(sale.id); // Veritabanından sil ve stoku geri al
            }
            modal.classList.remove('show');
            btnsDiv.innerHTML = `<button class="btn btn-primary" id="posAlertOkBtn" style="flex: 1;" onclick="document.getElementById('posAlertModal').classList.remove('show')">Tamam</button>`;
            this.products = await getProducts();
            this.renderProducts();
            this.showAlert('Satış başarıyla iptal edildi. Ürünler stoklara iade edildi.', 'İptal Edildi');
        };

        document.getElementById('receiptNoBtn').onclick = () => {
            finish();
        };
        
        document.getElementById('receiptYesBtn').onclick = () => {
            this.printReceipt(sale);
            finish();
        };
        
        document.getElementById('receiptCancelBtn').onclick = () => {
            cancelSaleAction();
        };
    },

    filterVeresiyeCustomers() {
        const input = document.getElementById('veresiyeCustomerSearch');
        const filter = input.value.toLowerCase();
        const select = document.getElementById('veresiyeCustomerSelect');
        const options = select.getElementsByTagName('option');

        // Arama yapılıyorsa veya arama kutusuna tıklandıysa, "Yeni Müşteri" sekmesini kapat ve seçimi temizle
        if (select.value === 'new') {
            select.value = '';
            this.handleCustomerSelect(); // Bu fonksiyon zaten gizleme ve temizleme işini yapıyor
        }

        let visibleCount = 0;
        for (let i = 0; i < options.length; i++) {
            const txtValue = options[i].textContent || options[i].innerText;
            // -- Müşteri Seçin -- ve + YENİ MÜŞTERİ EKLE her zaman görünsün
            if (options[i].value === "" || options[i].value === "new") {
                options[i].style.display = "";
                visibleCount++;
            } else if (txtValue.toLowerCase().indexOf(filter) > -1) {
                options[i].style.display = "";
                visibleCount++;
            } else {
                options[i].style.display = "none";
            }
        }
        
        // Eğer sonuç çok azsa size'ı küçültelim ki çirkin durmasın
        select.size = visibleCount > 5 ? 5 : (visibleCount < 2 ? 2 : visibleCount);
    },

    async openVeresiyeModal() {
        if (this.cart.length === 0) {
            this.showAlert('Sepet boş! Önce ürün ekleyin.');
            return;
        }
        let optionsHtml = '<option value="">-- Müşteri Seçin --</option><option value="new">+ YENİ MÜŞTERİ EKLE</option>';
        const customers = await getCustomers();
        customers.forEach(c => {
            optionsHtml += `<option value="${c.name}">${c.name}</option>`;
        });
        document.getElementById('veresiyeCustomerSelect').innerHTML = optionsHtml;
        document.getElementById('newCustomerGroup').style.display = 'none';
        document.getElementById('newCustomerName').value = '';
        document.getElementById('veresiyeModal').classList.add('show');
    },

    closeVeresiyeModal() {
        document.getElementById('veresiyeModal').classList.remove('show');
    },

    handleCustomerSelect() {
        const val = document.getElementById('veresiyeCustomerSelect').value;
        if (val === 'new') {
            document.getElementById('newCustomerGroup').style.display = 'block';
        } else {
            document.getElementById('newCustomerGroup').style.display = 'none';
        }
    },

    async checkoutVeresiye() {
        if (this.cart.length === 0) return;
        
        const selectVal = document.getElementById('veresiyeCustomerSelect').value;
        let customerName = selectVal;
        
        if (selectVal === 'new') {
            customerName = document.getElementById('newCustomerName').value.trim();
            if (!customerName) {
                this.showAlert('Lütfen müşteri adını giriniz.');
                return;
            }
        } else if (selectVal === '') {
            this.showAlert('Lütfen bir müşteri seçin veya yeni ekleyin.');
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const sale = {
            items: [...this.cart],
            total: total,
            payment_type: 'CREDIT',
            customer_name: customerName
        };

        const result = await addSale(sale);
        
        if(result && result.sale_id) {
            sale.id = result.sale_id;
            sale.date = new Date().toISOString();
        } else {
            sale.id = Date.now();
            sale.date = new Date().toISOString();
        }
        
        this.products = await getProducts();
        
        // Fiş yazdırmak isterseniz this.printReceipt(sale); eklenebilir, şimdilik sessiz kaydedelim
        this.cart = [];
        this.renderCart();
        this.renderProducts();
        this.closeVeresiyeModal();
        this.showToast(customerName + ' adlı müşteriye ' + total.toFixed(2) + ' ₺ veresiye başarıyla yazıldı.');
    },

    parkCart() {
        if (this.cart.length === 0) {
            this.showAlert('Bekletilecek ürün yok!');
            return;
        }
        // Save to localStorage temporarily
        let parkedCarts = JSON.parse(localStorage.getItem('parkedCarts') || '[]');
        parkedCarts.push({
            id: Date.now(),
            time: new Date().toLocaleTimeString('tr-TR'),
            items: [...this.cart]
        });
        localStorage.setItem('parkedCarts', JSON.stringify(parkedCarts));
        
        this.cart = [];
        this.renderCart();
        this.updateParkedCount();
        this.showAlert('Sepet beklemeye alındı. Müşteri geldiğinde "Bekleyenler" tuşundan çağırabilirsiniz.', 'Başarılı');
    },

    updateParkedCount() {
        const parkedCarts = JSON.parse(localStorage.getItem('parkedCarts') || '[]');
        const countEl = document.getElementById('parkedCount');
        if (countEl) {
            countEl.innerText = parkedCarts.length;
        }
    },

    showParkedCarts() {
        let parkedCarts = [];
        try {
            parkedCarts = JSON.parse(localStorage.getItem('parkedCarts') || '[]');
        } catch(e) {
            parkedCarts = [];
        }

        const container = document.getElementById('parkedList');
        
        if (!Array.isArray(parkedCarts) || parkedCarts.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:2rem;">Bekleyen sepet yok.</p>';
        } else {
            container.innerHTML = parkedCarts.map(cart => {
                const items = Array.isArray(cart.items) ? cart.items : [];
                let total = 0;
                let itemsStr = "Boş Sepet";

                if (items.length > 0) {
                    total = items.reduce((sum, item) => {
                        const p = parseFloat(item.price) || 0;
                        const q = parseInt(item.quantity) || 0;
                        return sum + (p * q);
                    }, 0);
                    itemsStr = items.map(i => `${i.name || 'Bilinmeyen'} (x${i.quantity || 1})`).join(', ');
                }

                return `
                    <div style="border: 1px solid rgba(0,0,0,0.1); padding: 1rem; margin-bottom: 1rem; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <strong>Saat: ${cart.time || 'Bilinmiyor'}</strong>
                            <strong style="color: var(--secondary-color)">${total.toFixed(2)} ₺</strong>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
                            ${itemsStr}
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-outline" style="flex:1" onclick="posApp.deleteParkedCart(${cart.id})">Sil</button>
                            <button class="btn btn-primary" style="flex:2" onclick="posApp.restoreParkedCart(${cart.id})">Sepete Yükle</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        document.getElementById('parkedModal').classList.add('show');
    },

    restoreParkedCart(id) {
        if (this.cart.length > 0) {
            this.showConfirm('Şu anki sepette ürünler var. Bunların üzerine yazılsın mı?', () => {
                this.executeRestoreParkedCart(id);
            });
        } else {
            this.executeRestoreParkedCart(id);
        }
    },

    executeRestoreParkedCart(id) {
        const parsedId = parseInt(id);
        let parkedCarts = JSON.parse(localStorage.getItem('parkedCarts') || '[]');
        const cartToRestore = parkedCarts.find(c => c.id == parsedId);
        
        if (cartToRestore) {
            this.cart = [...cartToRestore.items];
            this.deleteParkedCart(parsedId, true, true); // skipConfirm=true, skipRefresh=true
            this.renderCart();
            document.getElementById('parkedModal').classList.remove('show');
        } else {
            this.showAlert('Bekleyen sepet bulunamadı!', 'Hata');
        }
    },

    deleteParkedCart(id, skipConfirm = false, skipRefresh = false) {
        const parsedId = parseInt(id);
        if (!skipConfirm) {
            this.showConfirm('Bu bekleyen sepeti silmek istediğinize emin misiniz?', () => {
                this.executeDeleteParkedCart(parsedId, skipRefresh);
            });
        } else {
            this.executeDeleteParkedCart(parsedId, skipRefresh);
        }
    },
    
    executeDeleteParkedCart(id, skipRefresh = false) {
        let parkedCarts = JSON.parse(localStorage.getItem('parkedCarts') || '[]');
        parkedCarts = parkedCarts.filter(c => c.id != id);
        localStorage.setItem('parkedCarts', JSON.stringify(parkedCarts));
        
        this.updateParkedCount();
        if (!skipRefresh) {
            this.showParkedCarts(); // refresh modal
        }
    },

    printReceipt(sale) {
        // Create an invisible iframe for printing
        let printFrame = document.getElementById('printFrame');
        if (!printFrame) {
            printFrame = document.createElement('iframe');
            printFrame.id = 'printFrame';
            printFrame.style.display = 'none';
            document.body.appendChild(printFrame);
        }

        let itemsHtml = sale.items.map(item => `
            <tr>
                <td style="text-align: left; font-size:16px; font-weight:900; width: 55%; word-break: break-word; vertical-align: top; padding-right: 5px;">${item.name}</td>
                <td style="text-align: center; font-size:16px; font-weight:900; width: 20%; vertical-align: top;">${item.quantity}</td>
                <td style="text-align: right; font-size:16px; font-weight:900; width: 25%; vertical-align: top;">${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        const receiptHTML = `
            <html>
            <head>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; color: #000; font-weight: bold; font-size: 16px; }
                    .header { text-align: center; margin-bottom: 10px; }
                    .header h2 { margin: 0; font-size: 22px; font-weight: 900; }
                    .header p { margin: 0; font-size: 16px; font-weight: bold; }
                    .divider { border-top: 2px dashed #000; margin: 10px 0; }
                    table { width: 100%; border-collapse: collapse; }
                    th { font-size: 16px; border-bottom: 2px dashed #000; padding-bottom: 5px; font-weight: 900; }
                    td { font-size: 16px; font-weight: 900; }
                    .totals { text-align: right; font-size: 18px; margin-top: 10px; font-weight: 900; }
                    .totals div { margin-bottom: 5px; }
                    .grand-total { font-size: 22px; font-weight: 900; }
                    .footer { text-align: center; margin-top: 20px; font-size: 16px; font-weight: bold; }
                    @page { margin: 0; } /* Tarayıcının eklediği link ve tarihleri gizler, kağıt tasarrufu sağlar */
                    body { padding: 10px; } /* Sayfa kenarı kesilmesin diye küçük bir boşluk */
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>CİHAN MARKET</h2>
                    <p>Fiş Numarası: #${sale.id}</p>
                    <p>Tarih: ${new Date(sale.date).toLocaleString('tr-TR')}</p>
                </div>
                <div class="divider"></div>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left; width: 55%;">Ürün</th>
                            <th style="text-align: center; width: 20%;">Miktar</th>
                            <th style="text-align: right; width: 25%;">Tutar</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                <div class="divider"></div>
                <div class="totals">
                    <div class="grand-total">Genel Toplam: ${sale.total.toFixed(2)} ₺</div>
                </div>
                <div class="divider"></div>
                <div class="footer">
                    <p>Bizi tercih ettiğiniz için teşekkür ederiz.</p>
                    <p>Mali değeri yoktur.</p>
                </div>
            </body>
            </html>
        `;

        const frameDoc = printFrame.contentWindow.document;
        frameDoc.open();
        frameDoc.write(receiptHTML);
        frameDoc.close();

        // Focus and print after it loads
        setTimeout(() => {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
        }, 250);
    },

    async removeParkedCart(id) {
        await removeParkedCartFromDB(id);
        this.renderParkedCarts();
    },

    openNumpad(productId, currentQty) {
        document.getElementById('numpadProductId').value = productId;
        // Eğer daha önce numpad title değişmediyse varsayılan yapalım
        if(document.getElementById('numpadTitle') && productId !== 'OPEN_SALE') {
            const product = this.products.find(p => p.id === productId);
            document.getElementById('numpadTitle').innerText = (product ? product.name : '') + ' - Miktar Girin';
        }
        // Kullanıcı isteği üzerine önceden girilen adedi göstermiyoruz, direkt 0 ile başlıyor
        document.getElementById('numpadDisplay').innerText = '0';
        document.getElementById('numpadModal').classList.add('show');
    },

    openOpenSaleModal() {
        document.getElementById('numpadTitle').innerText = 'Barkodsuz Satış - Tutar Girin (₺)';
        this.openNumpad('OPEN_SALE', 0);
    },
    
    closeNumpad() {
        document.getElementById('numpadModal').classList.remove('show');
    },

    numpadPress(num) {
        const display = document.getElementById('numpadDisplay');
        if (display.innerText === '0' && num !== '.') {
            display.innerText = num.toString();
        } else {
            if (num === '.' && display.innerText.includes('.')) return; // Çift nokta girmeyi engelle
            
            // max length check
            if (display.innerText.length < 7) {
                display.innerText += num.toString();
            }
        }
    },
    
    numpadClear() {
        document.getElementById('numpadDisplay').innerText = '0';
    },

    openManavModal() {
        this.renderManavItems();
        document.getElementById('manavModal').classList.add('show');
    },

    closeManavModal() {
        document.getElementById('manavModal').classList.remove('show');
    },

    renderManavItems() {
        const renderItem = (item) => {
            let imgContent = `<div style="text-align: center; font-size: 2rem; margin-bottom: 0.3rem;">🥬</div>`; // Default emoji
            const nameLower = item.name.toLowerCase();
            
            // If we have custom icons for some
            if (nameLower === 'domates') imgContent = `<img src="img/domates.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'salatalık') imgContent = `<img src="img/salatalik.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'elma') imgContent = `<img src="img/elma.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'muz') imgContent = `<img src="img/muz.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'soğan') imgContent = `<img src="img/sogan.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'patates') imgContent = `<img src="img/patates.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'portakal') imgContent = `<img src="img/portakal.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'karpuz') imgContent = `<img src="img/karpuz.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'sivri biber' || nameLower === 'kapya biber' || nameLower === 'biber') imgContent = `<img src="img/biber.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'limon') imgContent = `<img src="img/limon.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'havuç') imgContent = `<img src="img/havuc.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'marul') imgContent = `<img src="img/marul.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'sarımsak') imgContent = `<img src="img/sarimsak.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'patlıcan') imgContent = `<img src="img/patlican.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'kavun') imgContent = `<img src="img/kavun.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'kayısı') imgContent = `<img src="img/kayisi.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'lahana') imgContent = `<img src="img/lahana.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'üzüm') imgContent = `<img src="img/uzum.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'maydanoz') imgContent = `<img src="img/maydanoz.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'brokoli') imgContent = `<img src="img/brokoli.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'mısır') imgContent = `<img src="img/misir.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'mantar') imgContent = `<img src="img/mantar.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'ıspanak') imgContent = `<img src="img/ispanak.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'taze fasulye') imgContent = `<img src="img/fasulye.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'kabak') imgContent = `<img src="img/kabak.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            else if (nameLower === 'yeşil soğan') imgContent = `<img src="img/yesilsogan.png" style="width:100%; height:50px; object-fit:contain; border-radius:4px; margin-bottom: 0.3rem;">`;
            
            return `
            <div class="product-card" onclick="posApp.handleManavClick('${item.name}')" style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.4rem; height: 100px; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                ${imgContent}
                <div class="product-name" style="font-size: 0.85rem; font-weight: 900; margin-bottom: 0; color: #111827; text-shadow: 0px 1px 3px rgba(255,255,255,0.9); text-align: center; white-space: normal; line-height: 1.1; margin-top: auto; padding: 2px;">${item.name}</div>
            </div>`;
        };
        
        // Sadece MANAV kategorisi olanları çek
        const manavItems = this.products.filter(p => p.category === 'MANAV' || p.category === 'Manav');
        
        // Doğu bölgelerinde en çok tüketilen manav ürünleri listesi
        const easternPriority = ['patates', 'soğan', 'patlıcan', 'kavun', 'karpuz', 'lahana', 'kayısı', 'sivri biber', 'kapya biber', 'domates', 'sarımsak', 'üzüm'];
        
        // Bilinen meyveler (popüler olanlar hariç kalanları ayırmak için)
        const knownFruits = ['elma', 'armut', 'muz', 'çilek', 'portakal', 'mandalina', 'şeftali', 'erik', 'kiraz', 'vişne', 'incir', 'nar', 'limon', 'kivi', 'ananas'];
        
        let populer = [];
        let meyveler = [];
        let sebzeler = [];
        
        manavItems.forEach(p => {
            const nameLower = p.name.toLowerCase();
            
            // Eğer doğu popüler listesindeyse direkt Popüler'e
            if (easternPriority.some(ep => nameLower.includes(ep))) {
                populer.push(p);
            } else if (knownFruits.some(kf => nameLower.includes(kf))) {
                meyveler.push(p);
            } else {
                sebzeler.push(p);
            }
        });
        
        // Kendi içlerinde alfabetik sırala
        const sortByName = (a, b) => a.name.localeCompare(b.name, 'tr-TR');
        meyveler.sort(sortByName);
        sebzeler.sort(sortByName);
        
        // Popülerleri easternPriority sırasına göre sırala
        populer.sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const aIndex = easternPriority.findIndex(ep => aName.includes(ep));
            const bIndex = easternPriority.findIndex(ep => bName.includes(ep));
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            return sortByName(a, b);
        });

        document.getElementById('manavPopuler').innerHTML = populer.map(renderItem).join('');
        document.getElementById('manavMeyveler').innerHTML = meyveler.map(renderItem).join('');
        document.getElementById('manavSebzeler').innerHTML = sebzeler.map(renderItem).join('');
    },

    handleManavClick(productName) {
        // Sistemde bu isimde ürün var mı kontrol et (Büyük küçük harf duyarsız)
        const product = this.products.find(p => p.name.toLowerCase() === productName.toLowerCase());
        
        if (product) {
            this.closeManavModal(); // Ürün bulununca menüyü kapat
            // Barkodlu sisteme geçildiği için artık numpad sormuyoruz, adet olarak 1 ekliyoruz (Örn: Maydanoz, Limon)
            this.addToCart(product.id);
            this.showToast(product.name + ' sepete 1 adet eklendi.');
        } else {
            this.showAlert('Sistemde "' + productName + '" isimli bir ürün bulunamadı. Lütfen Arka Ofisten bu ürünü ekleyin veya ismini kontrol edin.');
        }
    },
    
    numpadConfirm() {
        const productIdRaw = document.getElementById('numpadProductId').value;
        const qtyOrPrice = parseFloat(document.getElementById('numpadDisplay').innerText);
        
        if (qtyOrPrice > 0) {
            if (productIdRaw === 'OPEN_SALE') {
                // Muhtelif / Açık Fiyat Satışı
                this.cart.push({
                    id: 'OPEN-' + Date.now(),
                    name: 'Muhtelif Ürün (Barkodsuz)',
                    price: qtyOrPrice,
                    quantity: 1,
                    tax_rate: 0
                });
                this.renderCart();
                this.showToast(qtyOrPrice + ' ₺ tutarında ürün sepete eklendi.');
            } else {
                const productId = parseInt(productIdRaw);
                const existingItem = this.cart.find(i => i.id === productId);
                if (existingItem) {
                    this.setQuantity(productId, qtyOrPrice);
                } else {
                    // Sepette yoksa direkt ekle (Numpad manuelden geliyordur)
                    const product = this.products.find(p => p.id === productId);
                    if (product) {
                        this.cart.push({ ...product, quantity: qtyOrPrice });
                        this.renderCart();
                        this.showToast(product.name + ' sepete eklendi.');
                    }
                }
            }
        }
        this.closeNumpad();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    posApp.init();
});
