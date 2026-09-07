const urlParams = new URLSearchParams(window.location.search);
const productId = Number.parseInt(urlParams.get("id"), 10);
const product = getProductById(productId);

if (!product) {
  console.error("Product not found. Redirecting to shop...");
  window.location.replace("index-shop.html");
  throw new Error("Product not found");
}

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

productImage.src = product.image;
productImage.alt = product.name;
productImage.loading = "eager";
productImage.decoding = "async";

productName.textContent = product.name;
productDescription.textContent = product.description;
productType.textContent = product.type;
productPrice.textContent = `$${product.price}`;

if (product.band) {
  productBand.textContent = product.band;
  productBand.style.display = "block";
} else {
  productBand.style.display = "none";
}

if (product.stock > 0) {
  productStock.textContent = `${product.stock} IN STOCK`;
  productStock.style.color = "rgba(144, 238, 144, 0.8)";
} else {
  productStock.textContent = "OUT OF STOCK";
  productStock.style.color = "rgba(255, 0, 0, 0.8)";
  addToCartBtn.disabled = true;
  addToCartBtn.textContent = "OUT OF STOCK";
}

let selectedSize = product.sizes?.[0] ?? null;

product.sizes.forEach((size) => {
  const btn = document.createElement("button");
  btn.className = "size-btn";
  btn.textContent = size;
  btn.type = "button";

  if (size === selectedSize) {
    btn.classList.add("selected");
  }

  btn.addEventListener("click", () => {
    document.querySelectorAll(".size-btn").forEach((button) => {
      button.classList.remove("selected");
    });

    btn.classList.add("selected");
    selectedSize = size;
  });

  sizeOptions.appendChild(btn);
});

qtyInput.min = "1";
qtyInput.max = String(Math.max(0, product.stock));
qtyInput.value = product.stock > 0 ? "1" : "0";

qtyDecrease.addEventListener("click", () => {
  const current = Number.parseInt(qtyInput.value, 10) || 1;
  qtyInput.value = String(Math.max(1, current - 1));
});

qtyIncrease.addEventListener("click", () => {
  const current = Number.parseInt(qtyInput.value, 10) || 1;
  qtyInput.value = String(Math.min(product.stock, current + 1));
});

qtyInput.addEventListener("change", () => {
  let value = Number.parseInt(qtyInput.value, 10);

  if (!Number.isFinite(value)) {
    value = 1;
  }

  value = Math.max(1, Math.min(product.stock, value));
  qtyInput.value = String(value);
});

function readCart() {
  try {
    const storedCart = JSON.parse(localStorage.getItem("cart"));
    return Array.isArray(storedCart) ? storedCart : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

addToCartBtn.addEventListener("click", () => {
  if (product.stock < 1) return;

  const quantity = Number.parseInt(qtyInput.value, 10);

  if (!Number.isFinite(quantity) || quantity < 1 || quantity > product.stock) {
    alert("Invalid quantity");
    return;
  }

  const cart = readCart();
  const existingItem = cart.find(
    (item) => item.productId === product.id && item.size === selectedSize,
  );

  const existingQuantity = existingItem?.quantity ?? 0;

  if (existingQuantity + quantity > product.stock) {
    alert(`Only ${Math.max(0, product.stock - existingQuantity)} item(s) available.`);
    return;
  }

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      size: selectedSize,
      quantity,
      price: product.price,
      image: product.image,
    });
  }

  saveCart(cart);

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

  updateCartCount();
});

function renderRelatedProducts() {
  let relatedProducts = [];

  if (product.band) {
    relatedProducts = products.filter(
      (item) => item.band === product.band && item.id !== product.id,
    );
  }

  if (relatedProducts.length < 4) {
    const categoryProducts = products.filter(
      (item) => item.category === product.category && item.id !== product.id,
    );

    for (const item of categoryProducts) {
      if (!relatedProducts.some((related) => related.id === item.id)) {
        relatedProducts.push(item);
      }
    }
  }

  relatedProducts = relatedProducts.slice(0, 4);

  if (relatedProducts.length === 0) {
    relatedProductsGrid.innerHTML =
      "<p style='grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.5);'>No related products</p>";
    return;
  }

  relatedProducts.forEach((relProduct) => {
    const card = document.createElement("article");
    card.className = "related-product-card";
    card.tabIndex = 0;
    card.setAttribute("role", "link");

    card.innerHTML = `
      <div class="related-image">
        <img src="${relProduct.image}" alt="${relProduct.name}" loading="lazy" decoding="async">
      </div>
      <div class="related-info">
        <h3 class="related-name">${relProduct.name}</h3>
        <p class="related-price">$${relProduct.price}</p>
      </div>
    `;

    const openProduct = () => {
      window.location.href = `product-detail.html?id=${relProduct.id}`;
    };

    card.addEventListener("click", openProduct);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openProduct();
      }
    });

    relatedProductsGrid.appendChild(card);
  });
}

function updateCartCount() {
  const cart = readCart();
  const totalItems = cart.reduce(
    (sum, item) => sum + Math.max(0, Number(item.quantity) || 0),
    0,
  );

  const cartPill = document.querySelector(".cart-pill");
  if (cartPill) {
    cartPill.textContent = `CART (${totalItems})`;
  }
}

productImage.addEventListener("error", () => {
  productImage.removeAttribute("src");
  productImage.alt = `${product.name} image unavailable`;
}, { once: true });

renderRelatedProducts();
updateCartCount();
