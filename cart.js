/**
 * 🛒 SHOPPING CART — LOGIC
 * صفحه‌ی سبد خریدی
 */

const cartItemsContainer = document.getElementById("cartItemsContainer");
const emptyCartMessage = document.getElementById("emptyCartMessage");
const subtotalAmount = document.getElementById("subtotalAmount");
const taxAmount = document.getElementById("taxAmount");
const totalAmount = document.getElementById("totalAmount");
const checkoutBtn = document.getElementById("checkoutBtn");
const cartPill = document.querySelector(".cart-pill");

/* 
   ✅ سبد خریدی رو لود کنیں
   localStorage میں ذخیره شده است
*/
function loadCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

/* 
   ✅ سبد رو محفوظ کنیں
*/
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* 
   ✅ سبد کو رینڈر کریں
*/
function renderCart() {
  const cart = loadCart();

  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    emptyCartMessage.style.display = "block";
    checkoutBtn.disabled = true;
    updateTotals();
    updateCartCount();
    return;
  }

  emptyCartMessage.style.display = "none";
  checkoutBtn.disabled = false;

  cart.forEach((item, index) => {
    const product = getProductById(item.productId);

    if (!product) return; // اگر محصول نہ ملے

    const itemDiv = document.createElement("div");
    itemDiv.className = "cart-item";

    const itemTotal = item.price * item.quantity;

    itemDiv.innerHTML = `
      <div class="item-image">
        <img src="${item.image}" alt="${item.name}" />
      </div>

      <div class="item-details">
        <h3 class="item-name">${item.name}</h3>
        <div class="item-meta">
          ${
            item.size
              ? `<div class="item-meta-row">
              <span class="item-meta-label">Size:</span>
              <span class="item-meta-value">${item.size}</span>
            </div>`
              : ""
          }
          <div class="item-meta-row">
            <span class="item-meta-label">Price:</span>
            <span class="item-price">$${item.price}</span>
          </div>
        </div>
      </div>

      <div class="item-actions">
        <div class="item-total">$${itemTotal.toFixed(2)}</div>
        <div class="item-controls">
          <div class="qty-control">
            <button class="qty-decrease" data-index="${index}">−</button>
            <input
              type="number"
              class="qty-input"
              data-index="${index}"
              value="${item.quantity}"
              min="1"
            />
            <button class="qty-increase" data-index="${index}">+</button>
          </div>
          <button class="remove-btn" data-index="${index}">REMOVE</button>
        </div>
      </div>
    `;

    cartItemsContainer.appendChild(itemDiv);
  });

  /* 
     ✅ Event listeners برائے quantity controls
  */
  document.querySelectorAll(".qty-decrease").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      const cart = loadCart();
      if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
        saveCart(cart);
        renderCart();
      }
    });
  });

  document.querySelectorAll(".qty-increase").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      const cart = loadCart();
      cart[index].quantity += 1;
      saveCart(cart);
      renderCart();
    });
  });

  document.querySelectorAll(".qty-input").forEach((input) => {
    input.addEventListener("change", (e) => {
      const index = parseInt(e.target.dataset.index);
      const newQty = parseInt(e.target.value);

      if (isNaN(newQty) || newQty < 1) {
        renderCart();
        return;
      }

      const cart = loadCart();
      cart[index].quantity = newQty;
      saveCart(cart);
      renderCart();
    });
  });

  /* 
     ✅ Remove button listeners
  */
  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      const cart = loadCart();
      cart.splice(index, 1); // 1 item حذف کریں
      saveCart(cart);
      renderCart();
    });
  });

  updateTotals();
}

/* 
   ✅ اپڈیٹ Totals
*/
function updateTotals() {
  const cart = loadCart();

  let subtotal = 0;
  cart.forEach((item) => {
    subtotal += item.price * item.quantity;
  });

  const shipping = subtotal > 50 ? 0 : 10; //
  const tax = subtotal * 0.1; // 10% ٹیکس
  const total = subtotal + shipping + tax;

  subtotalAmount.textContent = `$${subtotal.toFixed(2)}`;
  taxAmount.textContent = `$${tax.toFixed(2)}`;

  if (shipping === 0) {
    document.getElementById("shippingAmount").textContent = "FREE";
  } else {
    document.getElementById("shippingAmount").textContent =
      `$${shipping.toFixed(2)}`;
  }

  totalAmount.textContent = `$${total.toFixed(2)}`;
}

/* 
   ✅ Cart count اپڈیٹ کریں (header میں)
*/
function updateCartCount() {
  const cart = loadCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartPill.textContent = `CART (${totalItems})`;
}

/* 
   ✅ Checkout button
*/
checkoutBtn.addEventListener("click", () => {
  const cart = loadCart();

  if (cart.length === 0) {
    showWarning("آپ کی سبد خالی ہے", "⚠ خالی سبد");
    return;
  }

  /* 
     بعد میں: Payment gateway / Checkout page
     فی الحال: Toast پیغام
  */
  const orderMessage = `${cart.length} اشیاء کے لیے آپ کی آرڈر ${new Date().toLocaleDateString("ur-PK")} کو مکمل ہو گئی۔`;
  showSuccess(
    "ڈیمو ماڈ میں آپ ادائیگی کے صفحہ پر ری ڈائریکٹ ہوں گے۔\n\n" + orderMessage,
    "✓ آرڈر مکمل",
  );

  /* 
     Optional: سبد کو خالی کریں بعد میں
  */
  // localStorage.removeItem("cart");
  // renderCart();
});

/* 
   ✅ Promo code (demo)
*/
document.getElementById("promoBtn").addEventListener("click", () => {
  const promoCode = document.getElementById("promoInput").value.trim();

  if (promoCode === "LEGEND20") {
    showSuccess("LEGEND20 - 20% ڈسکاؤنٹ اعمال میں آگیا", "✓ کوڈ درست ہے");
    document.getElementById("promoInput").value = "";
  } else if (promoCode === "") {
    showInfo("براہ کرم پروموشنل کوڈ درج کریں", "ⓘ کوڈ درج کریں");
  } else {
    showError("یہ کوڈ درست نہیں ہے", "✕ غلط کوڈ");
  }
});

/* 
   ✅ Page load ہو تو سبد لود کریں
*/
renderCart();
