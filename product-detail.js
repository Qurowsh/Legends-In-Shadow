const urlParams = new URLSearchParams(window.location.search);
const productId = Number(urlParams.get("id"));
const product = getProductById(productId);

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
  productImage.decoding = "async";

  productName.textContent = product.name;
  productDescription.textContent = product.description;
  productType.textContent = product.type;
  productPrice.textContent = `$${product.price}`;

  if (product.band) {
    productBand.textContent = product.band;
    productBand.style.display = "block";
  } else {
    productBand.textContent = "";
    productBand.style.display = "none";
  }

  productStock.textContent =
    product.stock > 0 ? `${product.stock} IN STOCK` : "OUT OF STOCK";

  const sizeButtons = [];
  let selectedSize = product.sizes.length === 1 ? product.sizes[0] : null;

  product.sizes.forEach((size) => {
    const button = document.createElement("button");
    button.className = "size-btn";
    button.type = "button";
    button.textContent = size;

    if (size === selectedSize) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      sizeButtons.forEach((sizeButton) => {
        sizeButton.classList.remove("selected");
      });

      button.classList.add("selected");
      selectedSize = size;
    });

    sizeButtons.push(button);
    sizeOptions.appendChild(button);
  });

  function getCart() {
    try {
      const savedCart = JSON.parse(localStorage.getItem("cart"));
      return Array.isArray(savedCart) ? savedCart : [];
    } catch {
      return [];
    }
  }

  function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );
    const cartPill = document.querySelector(".cart-pill");

    if (cartPill) {
      cartPill.textContent = `CART (${totalItems})`;
    }
  }

  function getCartQuantity(productId, size) {
    const item = getCart().find(
      (cartItem) =>
        cartItem.productId === productId && cartItem.size === size,
    );

    return item ? Number(item.quantity || 0) : 0;
  }

  function setQuantity(value) {
    const nextValue = Math.min(product.stock, Math.max(1, Number(value) || 1));
    qtyInput.value = nextValue;
  }

  qtyDecrease.addEventListener("click", () => {
    setQuantity(Number(qtyInput.value) - 1);
  });

  qtyIncrease.addEventListener("click", () => {
    setQuantity(Number(qtyInput.value) + 1);
  });

  qtyInput.addEventListener("change", () => {
    setQuantity(qtyInput.value);
  });

  if (product.stock <= 0) {
    addToCartBtn.disabled = true;
    addToCartBtn.textContent = "OUT OF STOCK";
    qtyDecrease.disabled = true;
    qtyIncrease.disabled = true;
    qtyInput.disabled = true;
  }

  addToCartBtn.addEventListener("click", () => {
    if (product.stock <= 0) {
      return;
    }

    if (!selectedSize) {
      alert("Please select a size");
      return;
    }

    const quantity = Math.min(
      product.stock,
      Math.max(1, Number(qtyInput.value) || 1),
    );
    const existingQuantity = getCartQuantity(product.id, selectedSize);

    if (existingQuantity + quantity > product.stock) {
      alert(`Only ${Math.max(0, product.stock - existingQuantity)} more available.`);
      return;
    }

    const cart = getCart();
    const existingItem = cart.find(
      (item) =>
        item.productId === product.id && item.size === selectedSize,
    );

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

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();

    const originalText = addToCartBtn.textContent;
    addToCartBtn.textContent = "✓ ADDED TO CART";
    addToCartBtn.classList.add("added");

    window.setTimeout(() => {
      addToCartBtn.textContent = originalText;
      addToCartBtn.classList.remove("added");
    }, 1500);
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

      relatedProducts = [
        ...relatedProducts,
        ...categoryProducts.filter(
          (item) => !relatedProducts.some((related) => related.id === item.id),
        ),
      ];
    }

    relatedProducts.slice(0, 4).forEach((relatedProduct) => {
      const card = document.createElement("article");
      card.className = "related-product-card";
      card.tabIndex = 0;
      card.setAttribute("role", "link");

      const imageWrapper = document.createElement("div");
      imageWrapper.className = "related-image";

      const image = document.createElement("img");
      image.src = relatedProduct.image;
      image.alt = relatedProduct.name;
      image.width = 600;
      image.height = 600;
      image.loading = "lazy";
      image.decoding = "async";

      const info = document.createElement("div");
      info.className = "related-info";

      const name = document.createElement("h3");
      name.className = "related-name";
      name.textContent = relatedProduct.name;

      const price = document.createElement("p");
      price.className = "related-price";
      price.textContent = `$${relatedProduct.price}`;

      imageWrapper.appendChild(image);
      info.append(name, price);
      card.append(imageWrapper, info);

      const openProduct = () => {
        window.location.href = `product-detail.html?id=${relatedProduct.id}`;
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

    if (!relatedProducts.length) {
      const emptyState = document.createElement("p");
      emptyState.className = "related-empty";
      emptyState.textContent = "No related products";
      relatedProductsGrid.appendChild(emptyState);
    }
  }

  renderRelatedProducts();
  updateCartCount();
}
