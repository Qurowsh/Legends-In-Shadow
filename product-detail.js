const urlParams = new URLSearchParams(window.location.search);
const productId = Number.parseInt(urlParams.get("id"), 10);
const product = Number.isInteger(productId) ? getProductById(productId) : null;

if (!product) {
  window.location.replace("index-shop.html");
} else {
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
  productImage.addEventListener("error", () => productImage.removeAttribute("src"), { once: true });

  productName.textContent = product.name;
  productBand.textContent = product.band || "";
  productBand.hidden = !product.band;
  productDescription.textContent = product.description;
  productType.textContent = product.type;
  productPrice.textContent = `$${product.price}`;

  if (product.stock > 0) {
    productStock.textContent = `${product.stock} IN STOCK`;
  } else {
    productStock.textContent = "OUT OF STOCK";
    addToCartBtn.disabled = true;
    addToCartBtn.textContent = "OUT OF STOCK";
  }

  const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ["One Size"];
  let selectedSize = sizes.length === 1 ? sizes[0] : null;

  sizes.forEach((size) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "size-btn";
    btn.textContent = size;
    if (size === selectedSize) btn.classList.add("selected");

    btn.addEventListener("click", () => {
      sizeOptions.querySelectorAll(".size-btn").forEach((item) => item.classList.remove("selected"));
      btn.classList.add("selected");
      selectedSize = size;
    });

    sizeOptions.appendChild(btn);
  });

  qtyInput.max = String(Math.max(1, product.stock));
  qtyDecrease.type = "button";
  qtyIncrease.type = "button";

  function setQuantity(value) {
    const next = Number.parseInt(value, 10);
    qtyInput.value = String(Number.isFinite(next) ? Math.min(product.stock, Math.max(1, next)) : 1);
  }

  qtyDecrease.addEventListener("click", () => setQuantity(Number(qtyInput.value) - 1));
  qtyIncrease.addEventListener("click", () => setQuantity(Number(qtyInput.value) + 1));
  qtyInput.addEventListener("change", () => setQuantity(qtyInput.value));

  function readCart() {
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

  function getProductQuantity(cart, productId) {
    return cart.reduce((total, item) => {
      return item.productId === productId ? total + (Number(item.quantity) || 0) : total;
    }, 0);
  }

  addToCartBtn.addEventListener("click", () => {
    if (product.stock < 1) return;

    const quantity = Math.min(product.stock, Math.max(1, Number.parseInt(qtyInput.value, 10) || 1));
    const cart = readCart();
    const currentQuantity = getProductQuantity(cart, product.id);

    if (currentQuantity + quantity > product.stock) {
      showWarning("You cannot add more than the available stock.", "⚠ Stock Limit");
      return;
    }

    const existingItem = cart.find(
      (item) => item.productId === product.id && (item.size || null) === (selectedSize || null),
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.name = product.name;
      existingItem.price = product.price;
      existingItem.image = product.image;
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
    showSuccess(`${quantity} × ${product.name} added to cart.`, "✓ Added to Cart");

    const originalText = addToCartBtn.textContent;
    addToCartBtn.textContent = "✓ ADDED TO CART";
    addToCartBtn.disabled = true;
    window.setTimeout(() => {
      addToCartBtn.textContent = originalText;
      addToCartBtn.disabled = getProductQuantity(readCart(), product.id) >= product.stock;
    }, 1500);

    updateCartCount();
  });

  function renderRelatedProducts() {
    let relatedProducts = product.band
      ? products.filter((item) => item.band === product.band && item.id !== product.id)
      : [];

    if (relatedProducts.length < 4) {
      const categoryProducts = products.filter(
        (item) => item.category === product.category && item.id !== product.id && !relatedProducts.includes(item),
      );
      relatedProducts = [...relatedProducts, ...categoryProducts];
    }

    relatedProductsGrid.innerHTML = "";

    if (relatedProducts.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No related products";
      empty.style.cssText = "grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.5);";
      relatedProductsGrid.appendChild(empty);
      return;
    }

    relatedProducts.slice(0, 4).forEach((relProduct) => {
      const card = document.createElement("article");
      card.className = "related-product-card";
      card.tabIndex = 0;
      card.setAttribute("role", "link");

      const imageWrap = document.createElement("div");
      imageWrap.className = "related-image";
      const image = document.createElement("img");
      image.src = relProduct.image;
      image.alt = relProduct.name;
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => image.removeAttribute("src"), { once: true });
      imageWrap.appendChild(image);

      const info = document.createElement("div");
      info.className = "related-info";
      const name = document.createElement("h3");
      name.className = "related-name";
      name.textContent = relProduct.name;
      const price = document.createElement("p");
      price.className = "related-price";
      price.textContent = `$${relProduct.price}`;
      info.append(name, price);

      card.append(imageWrap, info);
      const openDetail = () => {
        window.location.href = `product-detail.html?id=${encodeURIComponent(relProduct.id)}`;
      };
      card.addEventListener("click", openDetail);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail();
        }
      });
      relatedProductsGrid.appendChild(card);
    });
  }

  function updateCartCount() {
    const cart = readCart();
    const totalItems = cart.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
    const cartPill = document.querySelector(".cart-pill");
    if (cartPill) cartPill.textContent = `CART (${totalItems})`;
  }

  renderRelatedProducts();
  updateCartCount();
}
