// LocalStorage yedeği (PHP sunucusu yoksa diye, tamamen API'ye de çevrilebilir)
// Artık tamamen API üzerinden çalışacağız.

const USE_API = true; // Eğer sunucunuz yoksa false yapın (Local storage çalışır)
let API_BASE_URL = 'http://localhost/market/api/';

// Tarayıcıdan veya ngrok üzerinden giriliyorsa dinamik URL kullan
if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    const path = window.location.pathname;
    const dir = path.substring(0, path.lastIndexOf('/'));
    API_BASE_URL = window.location.origin + dir + '/api/';
}

const DB_KEY_PRODUCTS = 'market_products';
const DB_KEY_SALES = 'market_sales';

// GLOBAL SESSİZ KİLİTLEME VE API INTERCEPTOR (TÜM UYGULAMA İÇİN KESİN DEADLOCK KORUMASI)
let globalLoadingCount = 0;
window.showLoading = function(message = "") {
    globalLoadingCount++;
    let lockDiv = document.getElementById('global-ui-lock');
    if (!lockDiv) {
        lockDiv = document.createElement('div');
        lockDiv.id = 'global-ui-lock';
        document.body.appendChild(lockDiv);
    }
    lockDiv.classList.add('active');
};

window.hideLoading = function() {
    globalLoadingCount--;
    if (globalLoadingCount <= 0) {
        globalLoadingCount = 0;
        let lockDiv = document.getElementById('global-ui-lock');
        if (lockDiv) {
            lockDiv.classList.remove('active');
        }
    }
};

// Global Fetch Interceptor - Uygulamadaki TÜM API isteklerini otomatik yakalar!
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    if (typeof window.showLoading === 'function') window.showLoading();
    
    // Yolları otomatik olarak tam yola (EXE uyumlu) çevirir
    if (typeof args[0] === 'string' && args[0].startsWith('api/')) {
        args[0] = API_BASE_URL + args[0].substring(4);
    }
    
    try {
        const response = await originalFetch.apply(this, args);
        return response;
    } finally {
        if (typeof window.hideLoading === 'function') window.hideLoading();
    }
};


const defaultProducts = [
    { id: 1, barcode: '8690000000001', name: 'Süt 1L', category: 'Süt Ürünleri', price: 25.50, stock: 50, color: '#e0f2fe' },
    { id: 2, barcode: '8690000000002', name: 'Beyaz Peynir', category: 'Süt Ürünleri', price: 120.00, stock: 30, color: '#fef9c3' },
    { id: 3, barcode: '8690000000003', name: 'Ekmek', category: 'Fırın', price: 10.00, stock: 100, color: '#fef08a' },
    { id: 4, barcode: '8690000000004', name: 'Domates (kg)', category: 'Manav', price: 35.00, stock: 40, color: '#fecaca' },
    { id: 5, barcode: '8690000000005', name: 'Salatalık (kg)', category: 'Manav', price: 20.00, stock: 40, color: '#bbf7d0' },
    { id: 6, barcode: '8690000000006', name: 'Kola 1L', category: 'İçecek', price: 30.00, stock: 60, color: '#fbcfe8' },
    { id: 7, barcode: '8690000000007', name: 'Su 0.5L', category: 'İçecek', price: 5.00, stock: 200, color: '#bfdbfe' },
    { id: 8, barcode: '8690000000008', name: 'Çikolata', category: 'Atıştırmalık', price: 15.00, stock: 80, color: '#e9d5ff' },
];

function initDB() {
    if (!USE_API) {
        if (!localStorage.getItem(DB_KEY_PRODUCTS)) {
            localStorage.setItem(DB_KEY_PRODUCTS, JSON.stringify(defaultProducts));
        }
        if (!localStorage.getItem(DB_KEY_SALES)) {
            localStorage.setItem(DB_KEY_SALES, JSON.stringify([]));
        }
    }
}

async function getProducts() {
    if (USE_API) {
        try {
            const res = await fetch('api/get_products.php');
            if(!res.ok) throw new Error('API Hatası');
            return await res.json();
        } catch(e) {
            console.error("Veritabanına bağlanılamadı, API yok. Lütfen 'api/setup.php' çalıştırın.");
            return [];
        }
    }
    return JSON.parse(localStorage.getItem(DB_KEY_PRODUCTS));
}

async function saveProductToDB(product) {
    if (USE_API) {
        const res = await fetch('api/save_product.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(product)
        });
        return await res.json();
    }
}

async function removeProductFromDB(id) {
    if (USE_API) {
        const res = await fetch('api/delete_product.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id})
        });
        return await res.json();
    }
}

// Keep this for LocalStorage fallback compatibility
function saveProductsLocal(products) {
    localStorage.setItem(DB_KEY_PRODUCTS, JSON.stringify(products));
}

async function getSales() {
    if (USE_API) {
        try {
            const res = await fetch('api/get_sales.php');
            if(!res.ok) throw new Error('API Hatası');
            return await res.json();
        } catch(e) {
            return [];
        }
    }
    return JSON.parse(localStorage.getItem(DB_KEY_SALES));
}

async function addSale(sale) {
    if (USE_API) {
        const res = await fetch('api/save_sale.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(sale)
        });
        return await res.json();
    }
}

async function deleteSale(id) {
    if (USE_API) {
        const res = await fetch('api/delete_sale.php', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id})
        });
        return await res.json();
    }
}

async function getCustomers() {
    if (USE_API) {
        try {
            const res = await fetch('api/get_customers.php');
            if(!res.ok) throw new Error('API Hatası');
            return await res.json();
        } catch(e) {
            return [];
        }
    }
    return []; // For now, no local storage fallback for customers
}

initDB();
