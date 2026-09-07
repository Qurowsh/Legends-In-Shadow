/**
 * 🖼️ PRODUCT DETAIL PAGE — LOGIC
 * صفحه‌ی جزئیات محصول
 */

/* 
   ✅ URL سے Product ID نکالیں
   مثلاً: product-detail.html?id=1 → id = "1"
*/
const urlParams = new URLSearchParams(window.location.search);
const productId = parseInt(urlParams.get("id"));

/* اگر ID نہیں ملا یا غلط ہے، shop پر واپس جائیں */
if (!productId || !getProductById(productId)) {
  console.error("Product not found! Redirecting to shop...");
  window.location.href = "index-shop.html";
}

/* Product object حاصل کریں */
const product = getProductById(productId);

/* 
   ✅ DOM Elements حاصل کریں
*/
const productImage = document.getElementById("productImage");
const productName = document.getElementById("productName");
const productBand = document.getElementById("productBand");
const productDescription = document.getElementById("productDescription");
const productType = document.getElementById("productType");
const productPrice = document.getElementById("productPrice");
const productStock = document.getElementById("productStock");
const sizeOptions = document.getElementById("sizeOptions");
const qtyDecrease = document.getElementById("qtyDecrease");
const qtyIncrease = document.getElementById("qtyIncrease");
const qtyInput = document.getElementById("qtyInput");
const addToCartBtn = document.getElementById("addToCartBtn");
const relatedProductsGrid = document.getElementById("relatedProductsGrid");

/* 
   ✅ محصول کی معلومات صفحہ پر ڈالیں
*/
productImage.src = product.image;
productImage.alt = product.name;

productName.textContent = product.name;

if (product.band) {
  productBand.textContent = product.band;
  productBand.style.display = "block";
} else {
  productBand.style.display = "none";
}

productDescription.textContent = product.description;
productType.textContent = product.type;
productPrice.textContent = `$${product.price}`;

/* Stock status */
if (product.stock > 0) {
  productStock.textContent = `${product.stock} IN STOCK`;
  productStock.style.color = "rgba(144, 238, 144, 0.8)";
} else {
  productStock.textContent = "OUT OF STOCK";
  productStock.style.color = "rgba(255, 0, 0, 0.8)";
  addToCartBtn.disabled = true;
  addToCartBtn.textContent = "OUT OF STOCK";
}

/* 
   ✅ Size Buttons بنائیں
*/
let selectedSize = null;

product.sizes.forEach((size) => {
  const btn = document.createElement("button");
  btn.className = "size-btn";
  btn.textContent = size;
  btn.type = "button";

  btn.addEventListener("click", () => {
    /* پہلے تمام buttons سے selected class ہٹائیں */
    document.querySelectorAll(".size-btn").forEach((b) => {
      b.classList.remove("selected");
    });

    /* اس button پر selected class لگائیں */
    btn.classList.add("selected");
    selectedSize = size;
  });

  sizeOptions.appendChild(btn);
});

/* 
   ✅ Quantity Controls
*/
qtyDecrease.addEventListener("click", () => {
  const current = parseInt(qtyInput.value);
  if (current > 1) {
    qtyInput.value = current - 1;
  }
});

qtyIncrease.addEventListener("click", () => {
  const current = parseInt(qtyInput.value);
  if (current < product.stock) {
    qtyInput.value = current + 1;
  }
});

/* صرف valid numbers داخل کریں */
qtyInput.addEventListener("change", () => {
  let value = parseInt(qtyInput.value);
  if (isNaN(value) || value < 1) {
    qtyInput.value = 1;
  } else if (value > product.stock) {
    qtyInput.value = product.stock;
  }
});

/* 
   ✅ Add to Cart Button
*/
addToCartBtn.addEventListener("click", () => {
  const quantity = parseInt(qtyInput.value);

  if (!selectedSize) {
    showError("لطفاً سائز منتخب کریں", "⚠ سائز درکار ہے");
    return;
  }

  if (quantity < 1 || quantity > product.stock) {
    showError("تعداد غلط ہے", "✕ مسئلہ");
    return;
  }

  /* ✅ Cart item object بنائیں */
  const cartItem = {
    productId: product.id,
    name: product.name,
    size: selectedSize,
    quantity: quantity,
    price: product.price,
    image: product.image,
  };

  /* ✅ localStorage میں add کریں (بعد میں backend ہوگا) */
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  /* چیک کریں کہ یہ item پہلے سے موجود ہے یا نہیں */
  const existingItem = cart.find(
    (item) => item.productId === product.id && item.size === selectedSize,
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push(cartItem);
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  /* ✅ Toast success */
  showSuccess(
    `${quantity} × ${product.name} سبد میں شامل کیا گیا`,
    "✓ شامل کیا گیا",
  );

  /* ✅ Button animation */
  const originalText = addToCartBtn.textContent;
  addToCartBtn.textContent = "✓ ADDED TO CART";
  addToCartBtn.style.background =
    "linear-gradient(135deg, rgba(144, 238, 144, 0.15), rgba(144, 238, 144, 0.08))";
  addToCartBtn.style.borderColor = "rgba(144, 238, 144, 0.4)";
  addToCartBtn.style.color = "#90ee90";

  setTimeout(() => {
    addToCartBtn.textContent = originalText;
    addToCartBtn.style.background =
      "linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.08))";
    addToCartBtn.style.borderColor = "rgba(255, 215, 0, 0.4)";
    addToCartBtn.style.color = "#ffd700";
  }, 2000);

  /* ✅ Cart count update کریں (اگر header میں ہو) */
  updateCartCount();
});

/* 
   ✅ Related Products دکھائیں
   اسی category یا اسی band کے دوسرے محصولات
*/
function renderRelatedProducts() {
  let relatedProducts = [];

  /* اگر band موجود ہے، تو اسی band کے دوسرے محصولات */
  if (product.band) {
    relatedProducts = products.filter(
      (p) => p.band === product.band && p.id !== product.id,
    );
  }

  /* اگر کافی related نہیں ملے، تو category سے لو */
  if (relatedProducts.length < 4) {
    const categoryProducts = products.filter(
      (p) => p.category === product.category && p.id !== product.id,
    );
    relatedProducts = [...relatedProducts, ...categoryProducts];
    relatedProducts = [...new Set(relatedProducts)]; /* duplicates ہٹائیں */
  }

  /* صرف پہلے 4 دکھائیں */
  relatedProducts = relatedProducts.slice(0, 4);

  if (relatedProducts.length === 0) {
    relatedProductsGrid.innerHTML =
      "<p style='grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.5);'>No related products</p>";
    return;
  }

  relatedProducts.forEach((relProduct) => {
    const card = document.createElement("div");
    card.className = "related-product-card";

    card.innerHTML = `
      <div class="related-image">
        <img src="${relProduct.image}" alt="${relProduct.name}">
      </div>
      <div class="related-info">
        <h3 class="related-name">${relProduct.name}</h3>
        <p class="related-price">$${relProduct.price}</p>
      </div>
    `;

    /* کلیک کریں تو اس محصول کے detail پر جائیں */
    card.addEventListener("click", () => {
      window.location.href = `product-detail.html?id=${relProduct.id}`;
    });

    relatedProductsGrid.appendChild(card);
  });
}

renderRelatedProducts();

/* 
   ✅ Cart count update کریں (header میں)
*/
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartPill = document.querySelector(".cart-pill");
  if (cartPill) {
    cartPill.textContent = `CART (${totalItems})`;
  }
}

/* Page load کریں تو cart count update کریں */
updateCartCount();
