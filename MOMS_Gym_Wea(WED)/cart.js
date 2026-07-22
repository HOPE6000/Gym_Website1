/* ============================================================
   CART.JS — shared cart engine + drawer UI
   Include this file on EVERY page (after sameline-shared / before
   page-specific scripts). Uses localStorage so the cart survives
   navigation between pages.
   ============================================================ */

const CART_KEY = 'mom_cart_v1';

/* ---------- Core storage helpers ---------- */

function getCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Cart read error', e);
        return [];
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
        console.error('Cart save error', e);
    }
    renderCartUI();
}

/* A line's identity is product + colour + size, so picking the same
   product/colour/size twice just increases quantity instead of
   creating a duplicate row. */
function lineId(item) {
    return [item.key, item.colour, item.size].join('::');
}

function addToCart(item) {
    const cart = getCart();
    const id = lineId(item);
    const existing = cart.find(l => lineId(l) === id);
    if (existing) {
        existing.qty += item.qty;
    } else {
        cart.push(item);
    }
    saveCart(cart);
}

function updateCartQty(id, qty) {
    const cart = getCart();
    const line = cart.find(l => lineId(l) === id);
    if (!line) return;
    line.qty = Math.max(1, qty);
    saveCart(cart);
}

function removeFromCart(id) {
    const cart = getCart().filter(l => lineId(l) !== id);
    saveCart(cart);
}

function clearCart() {
    saveCart([]);
}

function cartCount() {
    return getCart().reduce((sum, l) => sum + l.qty, 0);
}

function cartTotal() {
    return getCart().reduce((sum, l) => sum + l.qty * l.price, 0);
}

/* ---------- Drawer UI ---------- */

function buildDrawerSkeleton() {
    if (document.getElementById('cartDrawer')) return;

    const overlay = document.createElement('div');
    overlay.id = 'cartOverlay';
    overlay.className = 'cart-overlay';

    const drawer = document.createElement('aside');
    drawer.id = 'cartDrawer';
    drawer.className = 'cart-drawer';
    drawer.innerHTML = `
        <div class="cart-drawer-head">
            <h3><i class="fa-solid fa-bag-shopping"></i> Your Cart</h3>
            <button type="button" id="cartCloseBtn" class="cart-close-btn" aria-label="Close cart">&times;</button>
        </div>
        <div class="cart-drawer-body" id="cartDrawerBody"></div>
        <div class="cart-drawer-foot">
            <div class="cart-subtotal-row">
                <span>Subtotal</span>
                <strong id="cartSubtotal">R0</strong>
            </div>
            <a href="Checkout.html" class="submit-btn cart-checkout-btn" id="cartCheckoutBtn">
                Proceed to Checkout <i class="fa-solid fa-arrow-right"></i>
            </a>
        </div>`;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    overlay.addEventListener('click', closeCart);
    document.getElementById('cartCloseBtn').addEventListener('click', closeCart);
}

function openCart() {
    document.getElementById('cartDrawer').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function renderCartUI() {
    // Update every nav cart badge on the page (some pages have a desktop + mobile nav)
    document.querySelectorAll('.cart-count-badge').forEach(badge => {
        const count = cartCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    });

    const body = document.getElementById('cartDrawerBody');
    if (!body) return; // drawer not built yet on this page load

    const cart = getCart();

    if (cart.length === 0) {
        body.innerHTML = `
            <div class="cart-empty">
                <i class="fa-solid fa-bag-shopping"></i>
                <p>Your cart is empty.</p>
                <a href="Womens.html" class="text-link">Browse products <i class="fa-solid fa-arrow-right"></i></a>
            </div>`;
        document.getElementById('cartCheckoutBtn').classList.add('disabled-link');
    } else {
        body.innerHTML = cart.map(line => {
            const id = lineId(line);
            return `
            <div class="cart-line" data-id="${id}">
                <img src="${line.image}" alt="${line.name}" class="cart-line-img">
                <div class="cart-line-info">
                    <span class="cart-line-name">${line.name}</span>
                    <span class="cart-line-meta">${line.colour} · ${line.size}</span>
                    <div class="cart-line-qty">
                        <button type="button" class="cart-qty-minus" data-id="${id}">−</button>
                        <span>${line.qty}</span>
                        <button type="button" class="cart-qty-plus" data-id="${id}">+</button>
                    </div>
                </div>
                <div class="cart-line-right">
                    <span class="cart-line-price">R${line.price * line.qty}</span>
                    <button type="button" class="cart-line-remove" data-id="${id}" aria-label="Remove"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`;
        }).join('');
        document.getElementById('cartCheckoutBtn').classList.remove('disabled-link');

        body.querySelectorAll('.cart-qty-plus').forEach(btn => btn.addEventListener('click', () => {
            const line = getCart().find(l => lineId(l) === btn.dataset.id);
            if (line) updateCartQty(btn.dataset.id, line.qty + 1);
        }));
        body.querySelectorAll('.cart-qty-minus').forEach(btn => btn.addEventListener('click', () => {
            const line = getCart().find(l => lineId(l) === btn.dataset.id);
            if (line) {
                if (line.qty <= 1) removeFromCart(btn.dataset.id);
                else updateCartQty(btn.dataset.id, line.qty - 1);
            }
        }));
        body.querySelectorAll('.cart-line-remove').forEach(btn => btn.addEventListener('click', () => {
            removeFromCart(btn.dataset.id);
        }));
    }

    const subtotalEl = document.getElementById('cartSubtotal');
    if (subtotalEl) subtotalEl.textContent = 'R' + cartTotal();
}

function initCartUI() {
    buildDrawerSkeleton();

    // Wire up every nav cart trigger on the page
    document.querySelectorAll('.cart-nav-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openCart();
        });
    });

    renderCartUI();
}

document.addEventListener('DOMContentLoaded', initCartUI);