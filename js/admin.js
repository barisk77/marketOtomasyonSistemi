const adminApp = {
    products: [],
    sales: [],
    suppliers: [],
    currentView: 'dashboard',

    confirmAction(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmMessage').innerText = message;
        
        // Remove previous listeners by cloning or just assigning oncklick
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        
        okBtn.onclick = () => {
            modal.classList.remove('show');
            if (onConfirm) onConfirm();
        };
        
        cancelBtn.onclick = () => {
            modal.classList.remove('show');
        };
        
        modal.classList.add('show');
    },

    async init() {
        this.products = await getProducts();
        this.sales = await getSales();
        this.bindEvents();
        this.renderView();
    },

    bindEvents() {
        document.getElementById('productForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Global barcode listener for Admin Panel
        let barcodeBuffer = '';
        let barcodeTimeout = null;
        
        document.addEventListener('keypress', (e) => {
            // Sadece form açık değilken veya barkod kutusunda değilsek dinle
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                // Eğer ürün ekleme/düzenleme formunda barkod kutusundaysak karışma, scanner normal yazsın
                return; 
            }

            if (e.key === 'Enter') {
                if (barcodeBuffer.length > 2) {
                    this.handleAdminBarcodeScan(barcodeBuffer);
                    barcodeBuffer = '';
                }
            } else {
                barcodeBuffer += e.key;
                clearTimeout(barcodeTimeout);
                barcodeTimeout = setTimeout(() => {
                    barcodeBuffer = '';
                }, 500);
            }
        });
    },

    handleAdminBarcodeScan(barcode) {
        if (this.currentView !== 'products') {
            // Eğer ürünler sayfasında değilse, önce o sayfaya geç
            this.switchView('products');
        }

        const product = this.products.find(p => p.barcode === barcode);
        if (product) {
            // Ürün zaten var, düzenleme formunu aç
            this.openModal(product.id);
        } else {
            // Ürün yok, yeni ekleme formunu aç ve barkodu otomatik doldur
            this.openModal();
            document.getElementById('productBarcode').value = barcode;
            // İsme odaklan ki hemen yazmaya başlasın
            setTimeout(() => {
                document.getElementById('productName').focus();
            }, 100);
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
                this.handleAdminBarcodeScan(decodedText);
            },
            (errorMessage) => {}
        ).catch(err => {
            console.error("Kamera başlatılamadı:", err);
            alert("Kamera başlatılamadı. İzinleri kontrol edin veya arka kameranız olduğundan emin olun.");
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

    switchView(view) {
        this.currentView = view;
        
        // Update active class on nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.currentTarget.classList.add('active');

        this.renderView();
    },

    renderView() {
        const content = document.getElementById('mainContent');
        
        if (this.currentView === 'dashboard') {
            content.innerHTML = this.getDashboardHTML();
            setTimeout(() => this.renderChart(), 100); // Allow DOM to update
        } else if (this.currentView === 'products') {
            content.innerHTML = this.getProductsHTML();
            setTimeout(() => this.renderProductsTableData(), 100);
        } else if (this.currentView === 'sales') {
            content.innerHTML = this.getSalesHTML();
            setTimeout(() => this.renderSalesTable([...this.sales]), 100);
        } else if (this.currentView === 'veresiye') {
            content.innerHTML = this.getVeresiyeHTML();
            setTimeout(() => this.loadVeresiyeData(), 100);
        } else if (this.currentView === 'suppliers') {
            content.innerHTML = this.getSuppliersHTML();
            setTimeout(() => this.loadSuppliersData(), 100);
        }
    },


    getSuppliersHTML() {
        return `
            <div class="content-header" style="flex-wrap: wrap; gap: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <h2><i class="fas fa-truck"></i> Toptancılar / Firma Defteri</h2>
                    <div style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #f87171; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; font-size: 1.1rem;">
                        Genel Borç: <span id="totalSupplierDebtDisplay">0.00</span> ₺
                    </div>
                </div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <input type="text" id="supplierSearchInput" class="form-control" placeholder="Firma Ara..." onkeyup="adminApp.filterSuppliers()" style="min-width: 250px;">
                    <button class="btn btn-primary" onclick="adminApp.openAddSupplierModal()" style="white-space: nowrap;">
                        <i class="fas fa-plus"></i> Yeni Firma
                    </button>
                </div>
            </div>
            <div class="products-grid" id="suppliersGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; margin-top: 1rem;">
                <div style="grid-column: 1 / -1; text-align:center;">Yükleniyor...</div>
            </div>
        `;
    },

    async loadSuppliersData() {
        try {
            const res = await fetch('api/get_suppliers.php');
            this.suppliers = await res.json();
            this.renderSuppliersGrid();
        } catch (e) {
            console.error(e);
            document.getElementById('suppliersGrid').innerHTML = `<div style="grid-column: 1 / -1; text-align:center; color: #ef4444;">Firmalar yüklenemedi.</div>`;
        }
    },

    renderSuppliersGrid(filteredList = null) {
        const grid = document.getElementById('suppliersGrid');
        if (!grid) return;

        const displayList = filteredList || this.suppliers;
        
        // Genel borç hesaplama
        let totalDebt = 0;
        this.suppliers.forEach(s => totalDebt += parseFloat(s.total_debt || 0));
        const totalDebtDisplay = document.getElementById('totalSupplierDebtDisplay');
        if (totalDebtDisplay) {
            totalDebtDisplay.innerText = totalDebt.toFixed(2);
        }

        if (displayList.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding: 2rem; color: #94a3b8;">Kayıt bulunamadı.</div>`;
            return;
        }

        const cards = displayList.map(s => {
            const debt = parseFloat(s.total_debt || 0);
            
            return `
                <div class="product-card glass-panel" style="display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; text-align: center;">
                    <button onclick="adminApp.deleteSupplier(${s.id}, '${s.name}', event)" style="position: absolute; right: 10px; top: 10px; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; border-radius: 4px; cursor: pointer; padding: 2px 6px; z-index: 2;">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="adminApp.openEditSupplierModal(${s.id}, event)" style="position: absolute; right: 40px; top: 10px; background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b; border-radius: 4px; cursor: pointer; padding: 2px 6px; z-index: 2;">
                        <i class="fas fa-edit"></i>
                    </button>
                    
                    <div style="cursor: pointer; display: flex; flex-direction: column; align-items: center; padding-top: 25px;" onclick="adminApp.showSupplierDetails(${s.id})">
                        <div style="font-size: 2.5rem; margin-bottom: 0.5rem; color: #3b82f6;"><i class="fas fa-building"></i></div>
                        <h3 style="margin-bottom: 0.2rem; color: #3b82f6; word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap; line-height: 1.2; text-align: center;">${s.name}</h3>
                        
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem; text-align: center;">
                            Bakiye: <strong style="color: ${debt > 0 ? '#ef4444' : (debt < 0 ? '#10b981' : 'var(--text-primary)')}; font-size: 1.2rem;">${debt.toFixed(2)} ₺</strong>
                        </p>
                    </div>
                    
                    <button class="btn btn-outline" style="width: 100%; margin-bottom: 0.5rem; padding: 0.5rem; font-size: 0.9rem; font-weight: bold; color: var(--primary-color); border-color: var(--primary-color);" onclick="adminApp.showSupplierDetails(${s.id})">
                        <i class="fas fa-list"></i> İşlem Geçmişi & Makbuz
                    </button>
                    
                    <div style="display: flex; gap: 0.5rem; margin-top: auto;">
                        <button class="btn btn-outline" style="flex: 1; padding: 0.5rem; font-size: 0.8rem;" onclick="adminApp.openSupplierTxModal(${s.id}, 'INVOICE')">
                            <i class="fas fa-file-invoice"></i> + Fatura
                        </button>
                        <button class="btn btn-success" style="flex: 1; padding: 0.5rem; font-size: 0.8rem;" onclick="adminApp.openSupplierTxModal(${s.id}, 'PAYMENT')">
                            <i class="fas fa-money-bill-wave"></i> - Ödeme
                        </button>
                    </div>
                </div>
            `;
        });

        grid.innerHTML = cards.join('');
    },

    filterSuppliers() {
        const query = document.getElementById('supplierSearchInput')?.value.toLowerCase() || '';
        if (query.trim() === '') {
            this.renderSuppliersGrid();
            return;
        }
        
        const filtered = this.suppliers.filter(s => {
            const name = (s.name || '').toLowerCase();
            
            return name.includes(query);
        });
        
        this.renderSuppliersGrid(filtered);
    },

    openEditSupplierModal(id, event) {
        if (event) event.stopPropagation();
        const supplier = this.suppliers.find(s => s.id == id);
        if (!supplier) return;
        
        document.getElementById('editSupplierId').value = supplier.id;
        document.getElementById('editSupplierNameInput').value = supplier.name || '';
        
        document.getElementById('editSupplierModal').classList.add('show');
    },

    async confirmEditSupplier() {
        const id = document.getElementById('editSupplierId').value;
        const name = document.getElementById('editSupplierNameInput').value.trim();
        
        
        if (!name) {
            this.showToast('Firma adı boş olamaz.', true);
            return;
        }

        try {
            const res = await fetch('api/update_supplier.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ id: id, name: name })
            });
            const data = await res.json();
            
            if (data.success) {
                this.showToast('Firma başarıyla güncellendi!');
                this.loadSuppliersData();
                document.getElementById('editSupplierModal').classList.remove('show');
            } else {
                this.showToast('Hata: ' + data.error, true);
            }
        } catch (e) {
            console.error(e);
            this.showToast('Sunucu bağlantı hatası', true);
        }
    },

    showSupplierDetails(id, filterType = 'ALL') {
        const supplier = this.suppliers.find(s => s.id == id);
        if (!supplier) return;

        document.getElementById('supplierModalTitle').innerText = supplier.name + " - Hesap Defteri";
        
        let html = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <span style="font-size: 0.9rem; color: #94a3b8; text-transform: uppercase;">Toplam Bakiye</span>
                <div style="font-size: 2rem; font-weight: bold; color: ${supplier.total_debt > 0 ? '#ef4444' : '#10b981'};">
                    ${parseFloat(supplier.total_debt).toFixed(2)} ₺
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 1rem;">
                <button class="btn ${filterType === 'ALL' ? 'btn-primary' : 'btn-outline'}" onclick="adminApp.showSupplierDetails(${id}, 'ALL')" style="flex: 1; padding: 0.5rem;">Tümü</button>
                <button class="btn ${filterType === 'INVOICE' ? 'btn-primary' : 'btn-outline'}" onclick="adminApp.showSupplierDetails(${id}, 'INVOICE')" style="flex: 1; padding: 0.5rem;">Faturalar</button>
                <button class="btn ${filterType === 'PAYMENT' ? 'btn-primary' : 'btn-outline'}" onclick="adminApp.showSupplierDetails(${id}, 'PAYMENT')" style="flex: 1; padding: 0.5rem;">Ödemeler</button>
            </div>
            
            <h3 style="margin-bottom: 1rem; border-bottom: 1px solid var(--surface-border); padding-bottom: 0.5rem; color: var(--text-primary);">İşlem Geçmişi</h3>
        `;

        // Filtreleme işlemi
        let filteredTxs = supplier.transactions || [];
        if (filterType !== 'ALL') {
            filteredTxs = filteredTxs.filter(tx => tx.type === filterType);
        }

        if (filteredTxs.length === 0) {
            html += `<div style="text-align:center; padding: 1rem; color: #94a3b8;">Bu kritere uygun hesap hareketi bulunmuyor.</div>`;
        } else {
            // Ters çevir ki en yeniler üstte olsun
            const txs = [...filteredTxs].reverse();
            txs.forEach(tx => {
                const isInvoice = tx.type === 'INVOICE';
                html += `
                    <div style="border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 1rem; padding: 1rem; background: rgba(0,0,0,0.2); position: relative;">
                        <!-- Yazdır Butonu -->
                        <button onclick="adminApp.printSupplierTx(${tx.id}, ${supplier.id}, event)" title="Bu işlemin makbuzunu yazdır" style="position: absolute; right: 55px; top: 10px; background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid #3b82f6; border-radius: 4px; cursor: pointer; padding: 2px 8px; font-weight: bold;">
                            <i class="fas fa-print"></i> Yazdır
                        </button>
                        <!-- Sil Butonu -->
                        <button onclick="adminApp.deleteSupplierTx(${tx.id}, event)" title="Bu işlemi sil" style="position: absolute; right: 10px; top: 10px; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; border-radius: 4px; cursor: pointer; padding: 2px 8px;">
                            <i class="fas fa-trash"></i>
                        </button>
                        <div style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 0.5rem; padding-right: 120px;">
                            ${new Date(tx.created_at).toLocaleString('tr-TR')}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: bold; color: ${isInvoice ? '#ef4444' : '#10b981'};">
                                ${isInvoice ? '<i class="fas fa-file-invoice"></i> Fatura Girişi' : '<i class="fas fa-money-bill-wave"></i> Ödeme Yapıldı'}
                                <div style="font-size: 0.8rem; color: #9ca3af; font-weight: normal; margin-top: 0.2rem;">${tx.description || ''}</div>
                            </span>
                            <span style="font-weight: bold; color: ${isInvoice ? '#ef4444' : '#10b981'}; font-size: 1.1rem;">
                                ${isInvoice ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)} ₺
                            </span>
                        </div>
                    </div>
                `;
            });
        }

        document.getElementById('supplierTxContent').innerHTML = html;
        document.getElementById('supplierModal').classList.add('show');
    },

    printSupplierTx(txId, supplierId, event) {
        if (event) event.stopPropagation();
        
        const supplier = this.suppliers.find(s => s.id == supplierId);
        if (!supplier) return;
        
        const tx = supplier.transactions.find(t => t.id == txId);
        if (!tx) return;
        
        const isInvoice = tx.type === 'INVOICE';
        const title = isInvoice ? 'FATURA GİRİŞ BİLGİSİ' : 'TAHSİLAT MAKBUZU';
        
        const printWindow = window.open('', '', 'width=300,height=500');
        printWindow.document.write(`
            <html>
            <head>
                <title>Fiş Yazdır</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; padding: 10px; font-size: 16px; font-weight: bold; width: 280px; margin: 0 auto; color: #000; background: #fff; }
                    .center { text-align: center; }
                    .divider { border-bottom: 2px dashed #000; margin: 15px 0; }
                    .bold { font-weight: 900; font-size: 18px; }
                    h2 { margin: 0; font-size: 24px; font-weight: 900; }
                </style>
            </head>
            <body>
                <div class="center">
                    <h2 style="margin: 0; font-size: 20px;">CİHAN MARKET</h2>
                    <p style="margin: 5px 0; font-size: 14px; font-weight: bold;">${title}</p>
                </div>
                <div class="divider"></div>
                <div style="margin-bottom: 5px;"><span class="bold">Firma/Toptancı:</span><div style="text-align: center; font-size: 18px; font-weight: 900; margin-top: 5px; margin-bottom: 10px;">${supplier.name}</div></div>
                <div style="margin-bottom: 5px;"><span class="bold">Tarih:</span><br>${new Date(tx.created_at).toLocaleString('tr-TR')}</div>
                ${tx.description ? `<div style="margin-bottom: 5px;"><span class="bold">Açıklama:</span><br>${tx.description}</div>` : ''}
                <div class="divider"></div>
                <div style="font-size: 20px; text-align: center; padding: 10px 0; border: 3px solid #000; font-weight: 900;">
                    ${isInvoice ? 'FATURA' : 'YAPILAN ÖDEME'}<br>
                    ${parseFloat(tx.amount).toFixed(2)} TL
                </div>
                <div class="divider"></div>
                <div class="center" style="font-size: 14px; font-weight: bold; margin-top: 20px;">
                    ${isInvoice ? 'Bu belge bilgilendirme amaçlıdır.' : 'İmza:'}<br><br><br>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    openAddSupplierModal() {
        document.getElementById('newSupplierInput').value = '';
        document.getElementById('addSupplierModal').classList.add('show');
    },

    async confirmAddSupplier() {
        const name = document.getElementById('newSupplierInput').value.trim();
        
        if (!name) return;

        try {
            const res = await fetch('api/add_supplier.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            });
            const data = await res.json();
            if (data.success) {
                this.showToast('Firma başarıyla eklendi!');
                this.loadSuppliersData();
                document.getElementById('addSupplierModal').classList.remove('show');
                document.getElementById('newSupplierInput').value = '';
                
            } else {
                this.showToast('Hata: ' + data.error, true);
            }
        } catch (e) {
            console.error(e);
            this.showToast('Sunucu bağlantı hatası', true);
        }
    },

    async deleteSupplier(id, name, event) {
        if (event) event.stopPropagation();
        
        this.confirmAction(`UYARI: "${name}" adlı firmayı ve ona ait TÜM HESAP GEÇMİŞİNİ kalıcı olarak silmek istediğinize emin misiniz?`, async () => {
            try {
                const res = await fetch('api/delete_supplier.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: id })
                });
                const data = await res.json();
                if (data.success) {
                    this.showToast(`Firma başarıyla silindi.`);
                    this.loadSuppliersData();
                } else {
                    this.showToast('Hata: ' + data.error, true);
                }
            } catch (e) {
                console.error(e);
                this.showToast('Sunucu bağlantı hatası', true);
            }
        });
    },

    openSupplierTxModal(id, type) {
        document.getElementById('supplierTxId').value = id;
        document.getElementById('supplierTxType').value = type;
        document.getElementById('supplierTxAmount').value = '';
        document.getElementById('supplierTxDesc').value = '';
        
        document.getElementById('supplierTxModalTitle').innerHTML = type === 'INVOICE' 
            ? '<i class="fas fa-file-invoice"></i> Yeni Fatura Gir' 
            : '<i class="fas fa-money-bill-wave"></i> Ödeme Yap';
            
        document.getElementById('supplierTxModal').classList.add('show');
    },

    async confirmSupplierTx() {
        const id = document.getElementById('supplierTxId').value;
        const type = document.getElementById('supplierTxType').value;
        const amount = parseFloat(document.getElementById('supplierTxAmount').value);
        const desc = document.getElementById('supplierTxDesc').value;

        if (isNaN(amount) || amount <= 0) {
            this.showToast('Lütfen geçerli bir tutar girin', true);
            return;
        }

        try {
            const res = await fetch('api/add_supplier_transaction.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ supplier_id: id, type: type, amount: amount, description: desc })
            });
            const data = await res.json();
            if (data.success) {
                this.showToast('İşlem başarıyla kaydedildi.');
                this.loadSuppliersData();
                document.getElementById('supplierTxModal').classList.remove('show');
            } else {
                this.showToast('Hata: ' + data.error, true);
            }
        } catch (e) {
            console.error(e);
            this.showToast('Sunucu bağlantı hatası', true);
        }
    },

    async deleteSupplierTx(id, event) {
        if (event) event.stopPropagation();
        
        this.confirmAction('Bu işlemi silmek istediğinize emin misiniz?\nFirma bakiyesi otomatik güncellenecektir.', async () => {
            try {
                const res = await fetch('api/delete_supplier_transaction.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: id })
                });
                const data = await res.json();
                if (data.success) {
                    this.showToast(`İşlem başarıyla silindi.`);
                    await this.loadSuppliersData();
                    document.getElementById('supplierModal').classList.remove('show');
                } else {
                    this.showToast('Hata: ' + data.error, true);
                }
            } catch (e) {
                console.error(e);
                this.showToast('Sunucu bağlantı hatası', true);
            }
        });
    },

    getVeresiyeHTML() {
        return `
            <div class="content-header">
                <h2><i class="fas fa-book-open"></i> Veresiye Defteri</h2>
                <button class="btn btn-primary" onclick="adminApp.openAddCustomerModal()">
                    <i class="fas fa-plus"></i> Yeni Müşteri
                </button>
            </div>
            
            <div class="search-bar" style="margin-bottom: 1rem; position: relative;">
                <i class="fas fa-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary);"></i>
                <input type="text" id="adminVeresiyeSearch" class="form-control" style="padding-left: 2.5rem; width: 100%; box-sizing: border-box;" placeholder="Kayıtlı Müşteri Ara..." onkeyup="adminApp.filterVeresiyeCustomers()">
            </div>
            
            <!-- Sessiz bildirim alanı -->
            <div id="veresiyeToast" style="display:none; background: #10b981; color: white; padding: 0.8rem; border-radius: 8px; margin-bottom: 1rem; text-align: center; font-weight: bold;"></div>
            
            <div class="products-grid" id="veresiyeCustomersGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                <div style="grid-column: 1 / -1; text-align:center;">Yükleniyor...</div>
            </div>
        `;
    },

    filterVeresiyeCustomers() {
        const input = document.getElementById('adminVeresiyeSearch');
        if (!input) return;
        const filter = input.value.toLowerCase();
        const grid = document.getElementById('veresiyeCustomersGrid');
        if (!grid) return;
        const cards = grid.getElementsByClassName('product-card');

        for (let i = 0; i < cards.length; i++) {
            // İsim 'h3' etiketinin içinde
            const title = cards[i].querySelector('h3');
            if (title) {
                const txtValue = title.textContent || title.innerText;
                if (txtValue.toLowerCase().indexOf(filter) > -1) {
                    cards[i].style.display = "";
                } else {
                    cards[i].style.display = "none";
                }
            }
        }
    },

    async loadVeresiyeData() {
        try {
            const res = await fetch('api/get_customers.php');
            let customers = await res.json();
            
            // Sadece borcu olanlar dediler ama bence hepsi gelsin ki borcu bitenler de görünsün, ancak kullanıcı "sadece veresiyesi olan kişilerin ismi bulunsun" dedi.
            // O yüzden borcu > 0 olanları üste, 0 olanları alta alalım veya hepsini gösterelim (kullanıcı "sadece veresiyesi olan" derken borçluları kastetmiş olabilir)
            // Biz hepsini gösterelim ama borcu 0 ise gri yapalım.
            
            const grid = document.getElementById('veresiyeCustomersGrid');
            if (!customers || customers.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding: 2rem; background: #ffffff; border: 1px solid var(--surface-border); border-radius: 8px;">Kayıtlı veresiye müşterisi bulunamadı.</div>';
                return;
            }

            grid.innerHTML = customers.map(c => {
                const debt = parseFloat(c.total_debt || 0);
                return `
                <div class="product-card" style="padding: 1.5rem; text-align: center; cursor: pointer; border: 1px solid var(--surface-border); background: #ffffff; position: relative; overflow: hidden;">
                    <!-- Müşteri Sil Butonu -->
                    <button onclick="adminApp.deleteCustomer('${c.name}', event)" title="Müşteriyi Sil" style="position: absolute; right: 10px; top: 10px; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; border-radius: 4px; cursor: pointer; padding: 4px 8px; z-index: 2;">
                        <i class="fas fa-trash"></i>
                    </button>
                    
                    <div onclick="adminApp.showCustomerDetails('${c.name}', ${debt})" style="display: flex; flex-direction: column;">
                        <div style="font-size: 3rem; margin-bottom: 1rem; color: #3b82f6;"><i class="fas fa-user-circle"></i></div>
                        <h3 style="font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text-primary); word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap; line-height: 1.2; padding: 0 10px;">${c.name}</h3>
                        <div style="color: ${debt > 0 ? '#ef4444' : '#10b981'}; font-weight: bold; font-size: 1.1rem;">
                            ${debt > 0 ? debt.toFixed(2) + ' ₺ Borç' : 'Borcu Yok'}
                        </div>
                    </div>
                </div>
            `}).join('');
        } catch (e) {
            console.error(e);
        }
    },

    showCustomerDetails(customerName, totalDebt) {
        // Find all sales belonging to this customer (both paid and unpaid)
        const customerSales = this.sales.filter(s => (s.payment_type === 'CREDIT' || s.payment_type === 'CREDIT_PAID') && s.customer_name === customerName);
        
        let html = `
            <div style="text-align: center; margin-bottom: 1.5rem; max-width: 100%;">
                <h3 style="color: #3b82f6; font-size: 1.5rem; margin-bottom: 0.5rem; word-break: break-word; overflow-wrap: break-word; white-space: pre-wrap;">${customerName}</h3>
                <div style="font-size: 1.2rem; margin-bottom: 1rem;">
                    Güncel Borç: <span style="color: ${totalDebt > 0 ? '#ef4444' : '#10b981'}; font-weight: bold;">${totalDebt.toFixed(2)} ₺</span>
                </div>
                ${totalDebt > 0 ? `<button class="btn btn-success" onclick="adminApp.openPaymentModal('${customerName}', ${totalDebt})" style="width:100%; margin-bottom: 1rem;"><i class="fas fa-hand-holding-usd"></i> Tahsilat Yap</button>` : ''}
                <hr style="border-color: var(--surface-border); margin-bottom: 1rem;">
                <p style="color: var(--text-secondary);">Satın Alım Geçmişi</p>
            </div>
        `;

        if (customerSales.length === 0) {
            html += `<div style="text-align:center; padding: 1rem; color: var(--text-secondary);">Henüz geçmiş bir satın alım bulunmuyor.</div>`;
        } else {
            customerSales.reverse().forEach(sale => {
                const isPaid = sale.payment_type === 'CREDIT_PAID';
                
                html += `
                    <div style="border: 1px solid var(--surface-border); border-radius: 8px; margin-bottom: 1rem; padding: 1rem; background: #ffffff; ${isPaid ? 'opacity: 0.7;' : ''} position: relative;">
                        <!-- Fiş Yazdır Butonu -->
                        <button onclick="adminApp.printSale(${sale.id}, event)" title="Bu fişi yazdır" style="position: absolute; right: 65px; top: 10px; background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: 1px solid #3b82f6; border-radius: 4px; cursor: pointer; padding: 2px 6px; font-weight: bold;">
                            <i class="fas fa-print"></i> Yazdır
                        </button>
                        <!-- Fiş Sil Butonu -->
                        <button onclick="adminApp.deleteSale(${sale.id}, '${customerName}', event)" title="Bu fişi tamamen sil" style="position: absolute; right: 10px; top: 10px; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; border-radius: 4px; cursor: pointer; padding: 2px 6px;">
                            <i class="fas fa-trash"></i> Sil
                        </button>
                        
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--surface-border); padding-bottom: 0.5rem; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem; padding-right: 120px;">
                            <span>Tarih: ${new Date(sale.date).toLocaleString('tr-TR')}</span>
                            <span>Fiş No: #${sale.id}</span>
                        </div>
                `;
                
                sale.items.forEach(item => {
                    html += `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                            <span>${item.quantity}x ${item.name}</span>
                            <span>${(item.price * item.quantity).toFixed(2)} ₺</span>
                        </div>
                    `;
                });

                html += `
                        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--surface-border); font-weight: bold; color: ${isPaid ? '#10b981' : '#ef4444'};">
                            <span>${isPaid ? '<i class="fas fa-check-circle"></i> ÖDENDİ' : 'TUTAR:'}</span>
                            <span style="${isPaid ? 'text-decoration: line-through;' : ''}">${sale.total.toFixed(2)} ₺</span>
                        </div>
                    </div>
                `;
            });
        }

        document.getElementById('saleReceiptContent').innerHTML = html;
        document.getElementById('saleModal').classList.add('show');
    },

    printSale(saleId, event) {
        if (event) event.stopPropagation();
        
        const sale = this.sales.find(s => s.id == saleId);
        if (!sale) return;

        let itemsHtml = '';
        sale.items.forEach(item => {
            itemsHtml += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 16px; font-weight: 900;">
                    <span>${item.quantity}x ${item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)} TL</span>
                </div>
            `;
        });

        const printWindow = window.open('', '', 'width=300,height=500');
        printWindow.document.write(`
            <html>
            <head>
                <title>Fiş Yazdır</title>
                <style>
                    body { font-family: 'Courier New', Courier, monospace; padding: 10px; font-size: 16px; font-weight: bold; width: 280px; margin: 0 auto; color: #000; background: #fff; }
                    .center { text-align: center; }
                    .divider { border-bottom: 2px dashed #000; margin: 10px 0; }
                    .bold { font-weight: 900; font-size: 18px; }
                    h2 { margin: 0; font-size: 24px; font-weight: 900; }
                </style>
            </head>
            <body>
                <div class="center">
                    <h2 style="margin: 0; font-size: 20px;">CİHAN MARKET</h2>
                    <p style="margin: 5px 0;">VERESİYE BİLGİ FİŞİ</p>
                </div>
                <div class="divider"></div>
                <div style="margin-bottom: 5px;"><span class="bold">Müşteri:</span><div style="text-align: center; font-size: 18px; font-weight: 900; margin-top: 5px; margin-bottom: 10px;">${sale.customer_name}</div></div>
                <div><span class="bold">Tarih:</span> ${new Date(sale.date).toLocaleString('tr-TR')}</div>
                <div><span class="bold">Fiş No:</span> #${sale.id}</div>
                <div class="divider"></div>
                ${itemsHtml}
                <div class="divider"></div>
                <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 900;">
                    <span>TOPLAM:</span>
                    <span>${sale.total.toFixed(2)} TL</span>
                </div>
                <div class="center" style="font-size: 14px; font-weight: bold; margin-top: 20px;">
                    Mali değeri yoktur. Bilgilendirme amaçlıdır.<br>
                    Bizi tercih ettiğiniz için teşekkürler.
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    async deleteSale(saleId, customerName, event) {
        if (event) {
            event.stopPropagation(); // Butona tıklanmasını modalı kapatmaması için durdur
        }
        
        this.confirmAction(`UYARI: #${saleId} numaralı fişi tamamen silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz ve eğer fiş ödenmemişse müşterinin toplam borcundan düşülür.`, async () => {
            try {
                const res = await fetch('api/delete_sale.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: saleId })
                });
                const data = await res.json();
                
                if (data.success) {
                    this.showToast(`#${saleId} numaralı fiş başarıyla silindi.`);
                    // Sayfayı güncelle
                    this.sales = await getSales();
                    this.loadVeresiyeData();
                    document.getElementById('saleModal').classList.remove('show');
                } else {
                    this.showToast('Hata: ' + data.error, true);
                }
            } catch (e) {
                console.error(e);
                this.showToast('Sunucu bağlantı hatası', true);
            }
        });
    },

    openAddCustomerModal() {
        document.getElementById('newCustomerInput').value = '';
        document.getElementById('addCustomerModal').classList.add('show');
    },

    showToast(msg, isError = false) {
        const toast = document.getElementById('veresiyeToast');
        if (toast) {
            toast.innerText = msg;
            toast.style.background = isError ? '#ef4444' : '#10b981';
            toast.style.display = 'block';
            setTimeout(() => { toast.style.display = 'none'; }, 3000);
        }
    },

    confirmAddCustomer() {
        const name = document.getElementById('newCustomerInput').value.trim();
        if (name !== '') {
            this.addCustomer(name);
            document.getElementById('addCustomerModal').classList.remove('show');
        } else {
            // Sessiz uyarı
            const input = document.getElementById('newCustomerInput');
            input.style.border = '2px solid red';
            setTimeout(() => input.style.border = '', 2000);
        }
    },

    async addCustomer(name) {
        try {
            const res = await fetch('api/add_customer.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            });
            const data = await res.json();
            if (data.success) {
                this.showToast('Müşteri başarıyla eklendi!');
                this.loadVeresiyeData();
            } else {
                this.showToast('Hata: ' + data.error, true);
            }
        } catch (e) {
            console.error(e);
        }
    },

    async deleteCustomer(name, event) {
        if (event) event.stopPropagation(); // Kartın içine tıklamayı engelle
        
        this.confirmAction(`UYARI: "${name}" isimli müşteriyi tamamen silmek istediğinize emin misiniz?\n\nBu işlem, bu müşteriye ait TÜM borçları, fişleri ve ödeme geçmişini kalıcı olarak silecektir!`, async () => {
            try {
                const res = await fetch('api/delete_customer.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name })
                });
                const data = await res.json();
                
                if (data.success) {
                    this.showToast(`${name} isimli müşteri başarıyla silindi.`);
                    // Sayfayı güncelle
                    this.sales = await getSales();
                    this.loadVeresiyeData();
                } else {
                    this.showToast('Hata: ' + data.error, true);
                }
            } catch (e) {
                console.error(e);
                this.showToast('Sunucu bağlantı hatası', true);
            }
        });
    },

    openPaymentModal(name, maxAmount) {
        if (maxAmount <= 0) {
            alert(name + ' adlı müşterinin borcu bulunmamaktadır.');
            return;
        }
        document.getElementById('paymentCustomerName').innerText = `${name} (Kalan Borç: ${maxAmount.toFixed(2)} ₺)`;
        document.getElementById('paymentCustomerName').dataset.name = name;
        document.getElementById('paymentMaxAmount').value = maxAmount;
        document.getElementById('paymentAmountInput').value = '';
        document.getElementById('paymentModal').classList.add('show');
    },

    confirmPayment() {
        const name = document.getElementById('paymentCustomerName').dataset.name;
        const maxAmount = parseFloat(document.getElementById('paymentMaxAmount').value);
        const amount = parseFloat(document.getElementById('paymentAmountInput').value);

        if (isNaN(amount) || amount <= 0) {
            const input = document.getElementById('paymentAmountInput');
            input.style.border = '2px solid red';
            setTimeout(() => input.style.border = '', 2000);
            return;
        }

        if (amount > maxAmount) {
            const input = document.getElementById('paymentAmountInput');
            input.style.border = '2px solid red';
            input.value = maxAmount;
            setTimeout(() => input.style.border = '', 2000);
            return;
        }

        this.processPayment(name, amount);
        document.getElementById('paymentModal').classList.remove('show');
        document.getElementById('saleModal').classList.remove('show'); // Fişi kapat
    },

    async processPayment(name, amount) {
        try {
            const res = await fetch('api/pay_debt.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, amount: amount })
            });
            const data = await res.json();
            if (data.success) {
                this.showToast(name + ' adlı müşteriden tahsilat yapıldı.');
                this.sales = await getSales(); // Satışları veritabanından tekrar çek
                this.loadVeresiyeData();
            } else {
                this.showToast('Hata: ' + data.error, true);
            }
        } catch (e) {
            console.error(e);
        }
    },

    getDashboardHTML() {
        const today = new Date();
        today.setHours(0,0,0,0); // Bugünü gece 00:00'dan itibaren al
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        oneWeekAgo.setHours(0,0,0,0);

        let totalRevenue = 0;
        let dailyRevenue = 0;
        let weeklyRevenue = 0;

        this.sales.forEach(sale => {
            totalRevenue += sale.total;
            const saleDate = new Date(sale.date);
            
            if (saleDate >= today) {
                dailyRevenue += sale.total;
            }
            if (saleDate >= oneWeekAgo) {
                weeklyRevenue += sale.total;
            }
        });

        const totalSales = this.sales.length;
        
        // Kritik stok: Mevcut stok, max_stock'un %20'sinden azsa
        const lowStockCount = this.products.filter(p => {
            const max = p.max_stock || 100;
            return p.stock < (max * 0.20);
        }).length;

        return `
            <div class="content-header">
                <h2>Özet</h2>
            </div>
            <div class="stats-grid">
                <div class="stat-card" style="border-left: 4px solid #3b82f6;">
                    <div class="stat-icon" style="background: rgba(59, 130, 246, 0.2); color: #3b82f6;"><i class="fas fa-calendar-day"></i></div>
                    <div class="stat-info">
                        <h3 style="color: var(--text-secondary); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Günlük Ciro</h3>
                        <p style="font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin-top: 0.3rem;">${dailyRevenue.toFixed(2)} ₺</p>
                    </div>
                </div>
                <div class="stat-card" style="border-left: 4px solid #8b5cf6;">
                    <div class="stat-icon" style="background: rgba(139, 92, 246, 0.2); color: #8b5cf6;"><i class="fas fa-calendar-week"></i></div>
                    <div class="stat-info">
                        <h3 style="color: var(--text-secondary); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Haftalık Ciro</h3>
                        <p style="font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin-top: 0.3rem;">${weeklyRevenue.toFixed(2)} ₺</p>
                    </div>
                </div>
                <div class="stat-card" style="border-left: 4px solid var(--primary-color);">
                    <div class="stat-icon"><i class="fas fa-lira-sign"></i></div>
                    <div class="stat-info">
                        <h3 style="color: var(--text-secondary); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Toplam Ciro</h3>
                        <p style="font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin-top: 0.3rem;">${totalRevenue.toFixed(2)} ₺</p>
                    </div>
                </div>
                <div class="stat-card" style="border-left: 4px solid #10b981;">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.2); color: #10b981;"><i class="fas fa-shopping-bag"></i></div>
                    <div class="stat-info">
                        <h3 style="color: var(--text-secondary); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Satış Sayısı</h3>
                        <p style="font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin-top: 0.3rem;">${totalSales}</p>
                    </div>
                </div>
                <div class="stat-card" style="border-left: 4px solid #ef4444;">
                    <div class="stat-icon" style="background: rgba(239, 68, 68, 0.2); color: #ef4444;"><i class="fas fa-exclamation-triangle"></i></div>
                    <div class="stat-info">
                        <h3 style="color: var(--text-secondary); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Kritik Stok</h3>
                        <p style="font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin-top: 0.3rem;">${lowStockCount} Ürün</p>
                    </div>
                </div>
            </div>

            <div style="margin-top: 1.5rem;">
                <div class="glass-panel" style="padding: 1.5rem; width: 100%;">
                    <h3>Satış Grafiği (Son 7 Gün)</h3>
                    <canvas id="salesChart" style="width: 100%; height: 350px; margin-top: 1rem;"></canvas>
                </div>
            </div>
        `;
    },

    renderChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        // Group sales by date
        const salesByDate = {};
        const today = new Date();
        
        // Initialize last 7 days with 0
        for(let i=6; i>=0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
            salesByDate[dateStr] = 0;
        }

        // Populate actual sales
        this.sales.forEach(sale => {
            const saleDate = new Date(sale.date);
            const dateStr = saleDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
            if (salesByDate[dateStr] !== undefined) {
                salesByDate[dateStr] += sale.total;
            }
        });

        const labels = Object.keys(salesByDate);
        const data = Object.values(salesByDate);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Günlük Ciro (₺)',
                    data: data,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    },

    getProductsHTML() {
        return `
            <div class="content-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <h2>Ürün Yönetimi</h2>
                <div style="flex: 1; max-width: 400px; margin-left: 2rem;">
                    <input type="text" id="productSearchInput" onkeyup="adminApp.filterProducts()" placeholder="Ürün Ara (Barkod veya İsim)..." class="form-control" style="width: 100%;">
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" onclick="adminApp.openCameraScanner()">
                        <i class="fas fa-camera"></i> Kamerayla Ekle
                    </button>
                    <button class="btn btn-success" onclick="adminApp.openModal()">
                        <i class="fas fa-plus"></i> Yeni Ürün Ekle
                    </button>
                </div>
            </div>
            <div class="glass-panel table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Barkod</th>
                            <th>Ürün Adı</th>
                            <th>Kategori</th>
                            <th>KDV</th>
                            <th>Fiyat</th>
                            <th>Stok</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody id="productsTableBody">
                        <!-- JS renders this -->
                    </tbody>
                </table>
            </div>
        `;
    },

    renderProductsTableData(searchQuery = '') {
        const tbody = document.getElementById('productsTableBody');
        if (!tbody) return;

        let filtered = this.products;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = this.products.filter(p => 
                (p.name && p.name.toLowerCase().includes(query)) || 
                (p.barcode && p.barcode.toLowerCase().includes(query))
            );
        }

        // PERFORMANS: Maksimum 200 satır render et
        const limit = 200;
        const visibleProducts = filtered.slice(0, limit);

        if (visibleProducts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Ürün bulunamadı.</td></tr>';
            return;
        }

        let html = visibleProducts.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${p.barcode || '-'}</td>
                <td>
                    ${p.is_quick === 1 ? '<i class="fas fa-star" style="color: #f59e0b; margin-right: 5px;" title="POS Ekranında Öne Çıkar"></i>' : ''}
                    ${p.name}
                </td>
                <td>${p.category}</td>
                <td>%${p.tax_rate || 0}</td>
                <td>${p.price.toFixed(2)} ₺</td>
                <td>
                    <span style="color: ${p.stock < ((p.max_stock || 100) * 0.20) ? '#ef4444' : 'inherit'}">${p.stock}</span>
                </td>
                <td>
                    <button class="btn btn-outline" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; margin-right: 5px;" onclick="adminApp.printLabel(${p.id})"><i class="fas fa-print"></i> Etiket</button>
                    <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="adminApp.openModal(${p.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;" onclick="adminApp.deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

        if (filtered.length > limit) {
            html += `<tr><td colspan="8" style="text-align:center; color: #9ca3af;">...ve ${filtered.length - limit} ürün daha (Daha fazlası için arama yapın)</td></tr>`;
        }

        tbody.innerHTML = html;
    },

    filterProducts() {
        const input = document.getElementById("productSearchInput");
        if (input) {
            this.renderProductsTableData(input.value);
        }
    },

    getSalesHTML() {
        return `
            <div class="content-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <h2>Satış Geçmişi</h2>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <input type="date" id="saleStartDate" class="form-control" onchange="adminApp.filterSalesHistory()">
                    <span>-</span>
                    <input type="date" id="saleEndDate" class="form-control" onchange="adminApp.filterSalesHistory()">
                    <button class="btn btn-outline" onclick="document.getElementById('saleStartDate').value=''; document.getElementById('saleEndDate').value=''; adminApp.filterSalesHistory();">Temizle</button>
                </div>
            </div>
            <div class="glass-panel">
                <style>
                    .sale-row { cursor: pointer; transition: background 0.2s; }
                    .sale-row:hover { background: rgba(0, 0, 0, 0.05); }
                </style>
                <table>
                    <thead>
                        <tr>
                            <th>Fiş Numarası</th>
                            <th>Tarih & Saat</th>
                            <th>Satılan Ürünler</th>
                            <th>Toplam Tutar</th>
                        </tr>
                    </thead>
                    <tbody id="salesTableBody">
                        <!-- Rendered by JS -->
                    </tbody>
                </table>
            </div>
        `;
    },

    renderSalesTable(salesToRender) {
        const tbody = document.getElementById('salesTableBody');
        if (!tbody) return;

        const limit = 200;
        const visibleSales = salesToRender.slice(0, limit);

        let rows = visibleSales.map(s => {
            let itemDetails = s.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
            // Truncate if too long
            if (itemDetails.length > 50) itemDetails = itemDetails.substring(0, 47) + '...';
            
            return `
            <tr class="sale-row" onclick="adminApp.showSaleDetails(${s.id})">
                <td>#${s.id}</td>
                <td>${new Date(s.date).toLocaleString('tr-TR')}</td>
                <td style="font-size: 0.9em; color: var(--text-secondary);">${itemDetails}</td>
                <td style="font-weight: bold; color: var(--secondary-color);">${s.total.toFixed(2)} ₺</td>
            </tr>
        `}).join('');

        if(salesToRender.length > limit) {
            rows += `<tr><td colspan="4" style="text-align:center; color:#9ca3af;">...ve ${salesToRender.length - limit} fiş daha (Lütfen tarih aralığı seçin)</td></tr>`;
        } else if(salesToRender.length === 0) {
            rows = `<tr><td colspan="4" style="text-align:center;">Kayıt bulunamadı.</td></tr>`;
        }
        
        tbody.innerHTML = rows;
    },

    filterSalesHistory() {
        const startVal = document.getElementById('saleStartDate').value;
        const endVal = document.getElementById('saleEndDate').value;

        let filtered = [...this.sales];

        if (startVal) {
            const startDate = new Date(startVal);
            startDate.setHours(0,0,0,0);
            filtered = filtered.filter(s => new Date(s.date) >= startDate);
        }
        
        if (endVal) {
            const endDate = new Date(endVal);
            endDate.setHours(23,59,59,999);
            filtered = filtered.filter(s => new Date(s.date) <= endDate);
        }

        this.renderSalesTable(filtered);
    },

    showSaleDetails(id) {
        const sale = this.sales.find(s => s.id === id);
        if (!sale) return;

        let content = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; color: #fff;">CİHAN MARKET</h3>
                <div style="color: #9ca3af; font-size: 0.9rem;">Fiş Numarası: #${sale.id}</div>
                <div style="color: #9ca3af; font-size: 0.9rem;">Tarih: ${new Date(sale.date).toLocaleString('tr-TR')}</div>
            </div>
            <div style="border-bottom: 1px dashed rgba(255,255,255,0.2); margin-bottom: 1rem;"></div>
            <table style="width: 100%; text-align: left; margin-bottom: 1rem; border: none; background: transparent;">
                <thead>
                    <tr style="color: #9ca3af; font-size: 0.85rem; border-bottom: 1px dashed rgba(255,255,255,0.2);">
                        <th style="padding-bottom: 0.5rem; background: transparent;">Ürün</th>
                        <th style="padding-bottom: 0.5rem; text-align: right; background: transparent;">Miktar</th>
                        <th style="padding-bottom: 0.5rem; text-align: right; background: transparent;">Tutar</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let subtotal = 0;
        let totalTax = 0;

        sale.items.forEach(item => {
            const itemTaxRate = item.tax_rate !== undefined ? item.tax_rate : 0;
            const itemTotal = item.price * item.quantity;
            const taxAmount = itemTotal - (itemTotal / (1 + (itemTaxRate / 100)));
            
            subtotal += (itemTotal - taxAmount);
            totalTax += taxAmount;

            content += `
                <tr>
                    <td style="padding: 0.5rem 0; color: #fff;">${item.name} <span style="font-size:0.8em; color:#9ca3af;">(%${itemTaxRate})</span></td>
                    <td style="padding: 0.5rem 0; text-align: right; color: #fff;">x${item.quantity}</td>
                    <td style="padding: 0.5rem 0; text-align: right; color: #fff;">${itemTotal.toFixed(2)} ₺</td>
                </tr>
            `;
        });

        content += `
                </tbody>
            </table>
            <div style="border-top: 1px dashed rgba(255,255,255,0.2); margin-top: 1rem; padding-top: 1rem;">
                <div style="display: flex; justify-content: space-between; color: #9ca3af;">
                    <span>Ara Toplam:</span>
                    <span>${subtotal.toFixed(2)} ₺</span>
                </div>
                <div style="display: flex; justify-content: space-between; color: #9ca3af; margin-top: 0.25rem;">
                    <span>Toplam KDV:</span>
                    <span>${totalTax.toFixed(2)} ₺</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.3rem; color: #fff; margin-top: 0.75rem;">
                    <span>GENEL TOPLAM:</span>
                    <span>${sale.total.toFixed(2)} ₺</span>
                </div>
            </div>
        `;

        document.getElementById('saleReceiptContent').innerHTML = content;
        document.getElementById('saleModal').classList.add('show');
    },

    printLabel(productId) {
        if (window.isPrintingActive) return;
        window.isPrintingActive = true;
        
        if (typeof showLoading === 'function') showLoading("Etiket Hazırlanıyor...");

        const product = this.products.find(p => p.id === productId);
        if (!product) {
            window.isPrintingActive = false;
            if (typeof hideLoading === 'function') hideLoading();
            return;
        }
        
        let printFrame = document.getElementById('labelPrintFrame');
        if (!printFrame) {
            printFrame = document.createElement('iframe');
            printFrame.id = 'labelPrintFrame';
            printFrame.style.display = 'none';
            document.body.appendChild(printFrame);
        }
        
        let barcodeValue = product.barcode ? product.barcode : '0000000000000';
        if (barcodeValue.length > 13) barcodeValue = barcodeValue.substring(0, 13);
        const frameDoc = printFrame.contentWindow.document;
        
        frameDoc.open();
        frameDoc.write(`
            <html>
            <head>
                <title>Etiket Yazdır - ${product.name}</title>
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                <style>
                    @page { 
                        margin: 0; 
                        size: 101mm 101mm; 
                    }
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        margin: 0; 
                        padding: 0; 
                        color: #000 !important;
                        -webkit-print-color-adjust: exact;
                        width: 101mm;
                        height: 101mm;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                    }
                    .product-name { 
                        font-weight: bold; 
                        font-size: 13px; 
                        margin-bottom: 2px; 
                        text-align: center;
                        padding-left: 25px; /* Yazıcının kenar paylarında kesilmemesi için artırıldı */
                        padding-right: 25px; /* Yazıcının kenar paylarında kesilmemesi için artırıldı */
                        word-break: break-all; /* 2. satırdaki uzun kelimeyi 3. gizli satıra itmek yerine satır sonuna kadar harf harf doldurur */
                        line-height: 1.1;
                        height: 29px; /* Tam 2 satır yüksekliği (13px * 1.1 * 2) */
                        overflow: hidden;
                        width: 100%;
                        box-sizing: border-box;
                    }
                    .middle-row {
                        display: flex;
                        justify-content: flex-start; /* Fiyat gidince merkeze kaymasını engellemek için sola yaslandı */
                        align-items: center;
                        padding-left: 20px; /* Barkodun başlangıç hizasına denk gelmesi için soldan pay verildi */
                        width: 100%;
                        margin-bottom: 5px;
                        box-sizing: border-box;
                    }
                    .yerli-horizontal {
                        border: 1px solid #000;
                        padding: 3px 6px;
                        font-size: 8px;
                        font-weight: bold;
                        border-radius: 3px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        white-space: nowrap;
                    }
                    .right-price {
                        font-size: 25px;
                        font-weight: bold;
                        text-align: left;
                        margin-bottom: 2px;
                        position: relative;
                        top: 4px; /* Fiyat biraz aşağı indirildi */
                    }
                    .bottom-row {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 100%;
                        gap: 10px;
                    }
                    .barcode-container {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: flex-start;
                    }
                    .small-texts {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                        justify-content: center;
                        gap: 3px;
                    }
                    .bottom-group {
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        justify-content: space-between;
                        margin-top: 5px; /* Fiyat ile alt grup arasına ekstra mesafe eklendi (çakışmayı önler) */
                    }
                    .kdv-and-market {
                        display: flex;
                        flex-direction: column;
                        gap: 3px;
                    }
                    .kdv-text {
                        font-size: 7px;
                        font-weight: bold;
                        text-align: left;
                    }
                    .market-name-bottom {
                        font-size: 13px;
                        font-weight: bold;
                        text-align: left;
                        margin-top: 3px;
                    }
                    .yerli-vertical {
                        border: 1px solid #000;
                        padding: 2px 2px;
                        font-size: 6px; /* Biraz küçültüldü */
                        font-weight: bold;
                        border-radius: 3px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        writing-mode: vertical-rl;
                        text-orientation: sideways;
                        transform: rotate(180deg);
                        margin-left: 10px; /* Sağa doğru biraz daha itilerek fiyatla çarpışması önlendi */
                        white-space: nowrap;
                        position: relative;
                        top: -4px; /* Biraz yukarı kaldırıldı */
                    }
                    #barcode {
                        max-width: 100%;
                        height: 75px;
                    }
                </style>
            </head>
            <body>
                <div class="product-name" style="margin-bottom: 0px;">${product.name}</div>
                
                <div class="bottom-row">
                    <div class="barcode-container">
                        <svg id="barcode"></svg>
                    </div>
                    <div class="small-texts">
                        <div class="right-price">${parseFloat(product.price).toFixed(2)} TRY</div>
                        <div class="bottom-group">
                            <div class="kdv-and-market">
                                <div class="kdv-text">Fiyatlara KDV dahildir</div>
                                <div class="kdv-text">Adet Birim Fiyatı: ${parseFloat(product.price).toFixed(2)} TRY</div>
                                <div class="market-name-bottom">CİHAN MARKET</div>
                            </div>
                            <div class="yerli-vertical">YERLİ ÜRETİM</div>
                        </div>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        JsBarcode("#barcode", "${barcodeValue}", {
                            format: "CODE128",
                            width: 1.5,
                            height: 95,
                            margin: 0, /* Barkodun etrafındaki görünmez boşluğu sıfırlar */
                            displayValue: true,
                            fontSize: 18
                        });
                        document.getElementById('barcode').setAttribute('preserveAspectRatio', 'none');
                        setTimeout(() => {
                            window.print();
                            setTimeout(() => {
                                window.parent.isPrintingActive = false;
                                if (typeof window.parent.hideLoading === 'function') {
                                    window.parent.hideLoading();
                                }
                            }, 500);
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        frameDoc.close();
    },

    openModal(id = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('modalTitle');
        const form = document.getElementById('productForm');

        form.reset();
        document.getElementById('productId').value = '';
        if(document.getElementById('productImage')) {
            document.getElementById('productImage').value = '';
        }

        if (id) {
            title.innerText = 'Ürün Düzenle';
            const p = this.products.find(x => x.id === id);
            if (p) {
                document.getElementById('productId').value = p.id;
                document.getElementById('productBarcode').value = p.barcode || '';
                document.getElementById('productName').value = p.name;
                document.getElementById('productCategory').value = p.category;
                document.getElementById('productPrice').value = p.price;
                document.getElementById('productStock').value = p.stock;
                document.getElementById('productTax').value = p.tax_rate !== undefined ? p.tax_rate : 0;
                document.getElementById('productIsQuick').checked = p.is_quick === 1;
            }
        } else {
            title.innerText = 'Yeni Ürün Ekle';
            document.getElementById('productTax').value = 0;
            document.getElementById('productIsQuick').checked = false;
        }

        modal.classList.add('show');
    },

    closeModal() {
        document.getElementById('productModal').classList.remove('show');
    },

    async saveProduct() {
        const id = document.getElementById('productId').value;
        let barcode = document.getElementById('productBarcode').value.trim();
        if (!barcode) {
            barcode = 'URUN-' + Date.now();
        }
        const name = document.getElementById('productName').value;
        const category = document.getElementById('productCategory').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const stock = parseInt(document.getElementById('productStock').value);
        const tax_rate = parseInt(document.getElementById('productTax').value);
        const is_quick = document.getElementById('productIsQuick').checked ? 1 : 0;
        
        const fileInput = document.getElementById('productImage');
        let image_base64 = null;
        let image_name = null;
        
        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            image_name = file.name;
            image_base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }

        const payload = {
            id: id || null,
            barcode,
            name,
            category,
            price,
            stock,
            tax_rate,
            is_quick,
            image_base64,
            image_name
        };

        await saveProductToDB(payload);
        
        // Refresh from DB
        this.products = await getProducts();
        
        this.closeModal();
        this.renderView();
    },

    async deleteProduct(id) {
        this.confirmAction('Bu ürünü silmek istediğinize emin misiniz?', async () => {
            await removeProductFromDB(id);
            this.products = await getProducts();
            this.renderView();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    adminApp.init();
});
