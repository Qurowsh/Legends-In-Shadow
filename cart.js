const cartItemsContainer = document.getElementById("cartItemsContainer");
const emptyCartMessage = document.getElementById("emptyCartMessage");
const subtotalAmount = document.getElementById("subtotalAmount");
const shippingAmount = document.getElementById("shippingAmount");
const taxAmount = document.getElementById("taxAmount");
const discountRow = document.getElementById("discountRow");
const discountAmount = document.getElementById("discountAmount");
const totalAmount = document.getElementById("totalAmount");
const checkoutBtn = document.getElementById("checkoutBtn");
const promoInput = document.getElementById("promoInput");
const promoBtn = document.getElementById("promoBtn");
const cartPill = document.querySelector(".cart-pill");

let discountRate = 0;

function loadCart() {
  try {
    const cart = JSON.parse(localStorage.getItem("cart"));
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function getProductStock(productId) {
  const product = getProductById(productId);
  return product ? Number(product.stock) || 0 : 0;
}

function getProductQuantityInCart(cart, productId, exceptIndex = -1) {
  return cart.reduce((total, item, index) => {
    if (index === exceptIndex || item.productId !== productId) return total;
    return total + Math.max(0, Number(item.quantity) || 0);
  }, 0);
}

function sanitizeCart(cart) {
  const cleanCart = [];

  cart.forEach((item) => {
    const product = getProductById(Number(item.productId));
    if (!product) return;

    const quantity = Math.floor(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) return;

    const stock = getProductStock(product.id);
    const used = getProductQuantityInCart(cleanCart, product.id);
    const available = Math.max(0, stock - used);
    if (available < 1) return;

    cleanCart.push({
      productId: product.id,
      name: product.name,
      size: item.size || null,
      quantity: Math.min(quantity, available),
      price: product.price,
      image: product.image,
    });
  });

  return cleanCart;
}

function renderCart() {
  let cart = sanitizeCart(loadCart());
  saveCart(cart);
  cartItemsContainer.innerHTML = "";

  const isEmpty = cart.length === 0;
  emptyCartMessage.hidden = !isEmpty;
  checkoutBtn.disabled = isEmpty;

  if (isEmpty) {
    updateTotals();
    updateCartCount();
    return;
  }

  cart.forEach((item, index) => {
    const product = getProductById(item.productId);
    const itemTotal = product.price * item.quantity;
    const stock = getProductStock(product.id);
    const otherQuantity = getProductQuantityInCart(cart, product.id, index);
    const canIncrease = otherQuantity + item.quantity < stock;

    const itemDiv = document.createElement("article");
    itemDiv.className = "cart-item";

    const imageWrap = document.createElement("div");
    imageWrap.className = "item-image";
    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.name;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => image.removeAttribute("src"), { once: true });
    imageWrap.appendChild(image);

    const details = document.createElement("div");
    details.className = "item-details";
    const name = document.createElement("h3");
    name.className = "item-name";
    name.textContent = product.name;
    const meta = document.createElement("div");
    meta.className = "item-meta";

    if (item.size) {
      const sizeRow = document.createElement("div");
      sizeRow.className = "item-meta-row";
      sizeRow.innerHTML = '<span class="item-meta-label">Size:</span>';
      const sizeValue = document.createElement("span");
      sizeValue.className = "item-meta-value";
      sizeValue.textContent = item.size;
      sizeRow.appendChild(sizeValue);
      meta.appendChild(sizeRow);
    }

    const priceRow = document.createElement("div");
    priceRow.className = "item-meta-row";
    priceRow.innerHTML = '<span class="item-meta-label">Price:</span>';
    const priceValue = document.createElement("span");
    priceValue.className = "item-price";
    priceValue.textContent = `$${product.price}`;
    priceRow.appendChild(priceValue);
    meta.appendChild(priceRow);

    details.append(name, meta);

    const actions = document.createElement("div");
    actions.className = "item-actions";
    const total = document.createElement("div");
    total.className = "item-total";
    total.textContent = `$${itemTotal.toFixed(2)}`;

    const controls = document.createElement("div");
    controls.className = "item-controls";
    const qtyControl = document.createElement("div");
    qtyControl.className = "qty-control";

    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.className = "qty-decrease";
    decrease.dataset.index = index;
    decrease.textContent = "−";
    decrease.setAttribute("aria-label", `Decrease ${product.name} quantity`);

    const input = document.createElement("input");
    input.type = "number";
    input.className = "qty-input";
    input.dataset.index = index;
    input.value = item.quantity;
    input.min = "1";
    input.max = String(Math.max(1, stock - otherQuantity));
    input.inputMode = "numeric";
    input.setAttribute("aria-label", `${product.name} quantity`);

    const increase = document.createElement("button");
    increase.type = "button";
    increase.className = "qty-increase";
    increase.dataset.index = index;
    increase.textContent = "+";
    increase.disabled = !canIncrease;
    increase.setAttribute("aria-label", `Increase ${product.name} quantity`);

    qtyControl.append(decrease, input, increase);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-btn";
    remove.dataset.index = index;
    remove.textContent = "REMOVE";

    controls.append(qtyControl, remove);
    actions.append(total, controls);
    itemDiv.append(imageWrap, details, actions);
    cartItemsContainer.appendChild(itemDiv);
  });

  document.querySelectorAll(".qty-decrease").forEach((button) => {
    button.addEventListener("click", () => changeQuantity(Number(button.dataset.index), -1));
  });

  document.querySelectorAll(".qty-increase").forEach((button) => {
    button.addEventListener("click", () => changeQuantity(Number(button.dataset.index), 1));
  });

  document.querySelectorAll(".qty-input").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.index);
      const cart = loadCart();
      const item = cart[index];
      const product = item ? getProductById(Number(item.productId)) : null;
      if (!product) return renderCart();

      const requested = Math.floor(Number(input.value));
      const otherQuantity = getProductQuantityInCart(cart, product.id, index);
      const max = Math.max(1, product.stock - otherQuantity);

      if (!Number.isFinite(requested)) return renderCart();
      cart[index].quantity = Math.min(Math.max(1, requested), max);
      saveCart(cart);
      renderCart();
    });
  });

  document.querySelectorAll(".remove-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      const cart = loadCart();
      if (!Number.isInteger(index) || !cart[index]) return;
      cart.splice(index, 1);
      saveCart(cart);
      renderCart();
    });
  });

  updateTotals();
  updateCartCount();
}

function changeQuantity(index, delta) {
  const cart = loadCart();
  const item = cart[index];
  if (!item) return;

  const product = getProductById(Number(item.productId));
  if (!product) return renderCart();

  const otherQuantity = getProductQuantityInCart(cart, product.id, index);
  const max = Math.max(1, product.stock - otherQuantity);
  item.quantity = Math.min(max, Math.max(1, (Number(item.quantity) || 1) + delta));
  saveCart(cart);
  renderCart();
}

function updateTotals() {
  const cart = sanitizeCart(loadCart());
  const subtotal = cart.reduce((sum, item) => {
    const product = getProductById(item.productId);
    return sum + product.price * item.quantity;
  }, 0);

  const shipping = subtotal > 50 || subtotal === 0 ? 0 : 10;
  const tax = subtotal * 0.1;
  const discount = subtotal * discountRate;
  const total = Math.max(0, subtotal + shipping + tax - discount);

  subtotalAmount.textContent = `$${subtotal.toFixed(2)}`;
  shippingAmount.textContent = shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`;
  taxAmount.textContent = `$${tax.toFixed(2)}`;
  discountAmount.textContent = `-$${discount.toFixed(2)}`;
  discountRow.hidden = discount === 0;
  totalAmount.textContent = `$${total.toFixed(2)}`;
}

function updateCartCount() {
  const cart = sanitizeCart(loadCart());
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartPill) cartPill.textContent = `CART (${totalItems})`;
}

checkoutBtn.addEventListener("click", () => {
  if (loadCart().length === 0) {
    showWarning("Your cart is empty.", "⚠ Cart Empty");
    return;
  }

  showInfo("Checkout is not connected yet. Your cart has been kept intact.", "ⓘ Demo Checkout");
});

promoBtn.addEventListener("click", () => {
  const promoCode = promoInput.value.trim().toUpperCase();

  if (!promoCode) {
    showInfo("Please enter a promo code.", "ⓘ Code Required");
    return;
  }

  if (promoCode === "LEGEND20") {
    discountRate = 0.2;
    promoInput.value = "";
    updateTotals();
    showSuccess("20% discount applied to your subtotal.", "✓ Promo Applied");
    return;
  }

  showError("That promo code is not valid.", "✕ Invalid Code");
});

renderCart();
