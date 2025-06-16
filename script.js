let products = [];

// Preluare produse din Google Sheets
async function fetchProductsFromSheet() {
    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbz0z2YPYue5dd0kpxsmF4slmomL22ChlvFYwyBME7XAK-Js-TEj0X2DD94K7U_AD0U/exec");
        const data = await response.json();

        if (Array.isArray(data)) {
            products = data.map(item => ({
                id: parseInt(item.id),
                name: item.nume,
                price: parseFloat(item.pret),
                image: item.imagine?.trim() || 'https://via.placeholder.com/300x200.png?text=Fara+imagine',
                description: item.descriere || ''
            }));

            // Dacă ești deja pe pagina de produse, încarcă-le acum
            if (currentPage === 'products') loadProducts();
        }
    } catch (error) {
        console.error("Eroare la încărcarea produselor:", error);
    }
}

// Inițializare la încărcare pagină
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners(); // Activăm navigarea imediat

    updateCartCount();

    const initialPage = location.hash?.replace('#', '') || 'home';
    showPage(initialPage); // Navigăm în funcție de hash

    fetchProductsFromSheet(); // Încărcăm produsele, asincron
});
document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('adresa');
  if (textarea) {
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    });
  }
});


// Variabile globale
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentPage = 'home';

// Elemente DOM
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const mainContent = document.getElementById('main-content');
const cartCount = document.getElementById('cart-count');

// Funcții principale
function setupEventListeners() {
    navToggle.addEventListener('click', () => navMenu.classList.toggle('active'));

    document.addEventListener('click', function(e) {
        if (e.target.hasAttribute('data-page')) {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            showPage(page);
            scrollToTop();
            navMenu.classList.remove('active');
        }
    });

    document.addEventListener('click', function(e) {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navMenu.classList.remove('active');
        }
    });
}

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

    const targetPage = document.getElementById(pageName + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageName;
        history.pushState({ page: pageName }, '', `#${pageName}`);

        if (pageName === 'products') {
            if (products.length > 0) {
                loadProducts();
            } else {
                console.warn("Produsele nu au fost încă încărcate.");
            }
        }

        if (pageName === 'cart') loadCart();
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Produse
function loadProducts() {
    const productsGrid = document.getElementById('products-container');
    if (!productsGrid) return;

    productsGrid.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card fade-in';
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div class="product-content">
                <h3>${product.name}</h3>
                <p class="product-price">${product.price} RON</p>
                <p style="color: #d1d5db; margin-bottom: 1rem;">${product.description}</p>
                <button class="add-to-cart" onclick="addToCart(${product.id})">
                    <i class="fas fa-cart-plus"></i> Adaugă în coș
                </button>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

// Coș de cumpărături
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) existingItem.quantity += 1;
    else cart.push({ ...product, quantity: 1 });

    saveCart();
    updateCartCount();
    showNotification(`${product.name} a fost adăugat în coș!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    loadCart();
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity = newQuantity;
        saveCart();
        updateCartCount();
        loadCart();
    }
}

function loadCart() {
    const cartContent = document.getElementById('cart-content');
    if (!cartContent) return;

    if (cart.length === 0) {
        cartContent.innerHTML = `
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <h2 style="color: white; margin-bottom: 1rem;">Coșul tău este gol</h2>
                <p style="color: #d1d5db; margin-bottom: 2rem;">Descoperă produsele noastre spectaculoase!</p>
                <button class="btn btn-primary" data-page="products">Explorează produsele</button>
            </div>
        `;
        return;
    }

    const cartGrid = document.createElement('div');
    cartGrid.style.display = 'grid';
    cartGrid.style.gridTemplateColumns = '1fr 300px';
    cartGrid.style.gap = '2rem';

    const cartItems = document.createElement('div');
    cart.forEach(item => {
        const element = document.createElement('div');
        element.className = 'cart-item fade-in';
        element.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <p class="cart-item-price">${item.price} RON</p>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                </div>
            </div>
            <div style="text-align: right;">
                <p style="font-weight: bold; color: white; margin-bottom: 1rem;">
                    ${item.price * item.quantity} RON
                </p>
                <button class="remove-btn" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        cartItems.appendChild(element);
    });

    const summary = document.createElement('div');
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = 15;
    const total = subtotal + shipping;
    summary.className = 'cart-summary';
    summary.innerHTML = `
        <h3>Sumar comandă</h3>
        <div class="summary-row"><span>Subtotal:</span><span>${subtotal} RON</span></div>
        <div class="summary-row"><span>Transport:</span><span>${shipping} RON</span></div>
        <div class="summary-total"><span>Total:</span><span>${total} RON</span></div>
        <button class="checkout-btn" onclick="checkout()">Continuă la plată</button>
        <button class="btn btn-outline" data-page="products" style="width: 100%; margin-top: 1rem;">Continuă cumpărăturile</button>
        <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(234, 179, 8, 0.2); border: 1px solid rgba(234, 179, 8, 0.5); border-radius: 0.5rem;">
            <h4 style="color: #fbbf24;">⚠️ Important</h4>
            <p style="color: #fef3c7;">La livrare se verifică vârsta minimă de 18 ani.</p>
        </div>
    `;

    cartGrid.appendChild(cartItems);
    cartGrid.appendChild(summary);
    cartContent.innerHTML = '';
    cartContent.appendChild(cartGrid);
}

function checkout() {
    alert('Funcționalitatea de plată va fi implementată în curând!');
    scrollToTop();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}
function checkout() {
    showPage('checkout');
    scrollToTop();
}
document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('order-form');
    const produseInput = document.getElementById('produseInput');


    if (orderForm && produseInput) {
      orderForm.addEventListener('submit', function (e) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];

        if (cart.length === 0) {
          alert("Coșul este gol!");
          e.preventDefault();
          return;
        }

        const listaProduse = cart.map(item => {
          return `${item.name} x${item.quantity} (${item.price} RON)`;
        }).join(' | ');

        produseInput.value = listaProduse;
      });
    }
  });
function showNotification(msg) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 5rem;
        right: 1rem;
        background: linear-gradient(45deg, #ef4444, #f97316);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-weight: 500;
    `;
    notification.textContent = msg;
    document.body.appendChild(notification);
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
