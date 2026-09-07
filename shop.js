const productsContainer = document.getElementById("products-container");
const categoryButtons = document.querySelectorAll(".category-btn");

function readCart() {
  try {
    const cart = JSON.parse(localStorage.getItem("cart"));
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem("cart", JSON.stringify(cart));
    return true;
  } catch {
    return false;
  }
}

function getProductQuantity(cart, productId) {
  return cart.reduce((total, item) => {
    return Number(item.productId) === productId ? total + (Number(item.quantity) || 0) : total;
  }, 0);
}

function normalizeBand(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getRequestedFilters() {
  const params = new URLSearchParams(window.location.search);
  return {
    category: params.get("category") || "all",
    band: normalizeBand(params.get("band")),
  };
}

function filterProducts(category, band) {
  return products.filter((product) => {
    const categoryMatch = category === "all" || product.category === category;
    const bandMatch = !band || normalizeBand(product.band) === band;
    return categoryMatch && bandMatch;
  });
}

function renderProducts(productsToRender) {
  productsContainer.innerHTML = "";

  const fragment = document.createDocumentFragment();

  productsToRender.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.tabIndex = 0;
    card.setAttribute("role", "link");

    const imageWrap = document.createElement("div");
    imageWrap.className = "product-image";
    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.name;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => image.removeAttribute("src"), { once: true });
    imageWrap.appendChild(image);

    const info = document.createElement("div");
    info.className = "product-info";

    const band = document.createElement("p");
    band.className = "product-band";
    band.textContent = product.band || "";

    const name = document.createElement("h2");
    name.className = "product-name";
    name.textContent = product.name;

    const type = document.createElement("p");
    type.className = "product-type";
    type.textContent = product.type;

    const bottom = document.createElement("div");
    bottom.className = "product-bottom";

    const price = document.createElement("span");
    price.className = "product-price";
    price.textContent = `$${product.price}`;

    const addCartBtn = document.createElement("button");
    addCartBtn.type = "button";
    addCartBtn.className = "add-cart";
    addCartBtn.textContent = product.stock > 0 ? "ADD TO CART" : "OUT OF STOCK";
    addCartBtn.disabled = product.stock <= 0;

    bottom.append(price, addCartBtn);
    info.append(band, name, type, bottom);
    card.append(imageWrap, info);

    const openDetail = () => {
      window.location.href = `product-detail.html?id=${encodeURIComponent(product.id)}`;
    };

    card.addEventListener("click", (event) => {
      if (!event.target.closest(".add-cart")) openDetail();
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDetail();
      }
    });

    addCartBtn.addEventListener("click", (event) => {
      event.stopPropagation();

      const cart = readCart();
      const currentQuantity = getProductQuantity(cart, product.id);

      if (currentQuantity >= product.stock) {
        showWarning("This product is already at its stock limit.", "⚠ Stock Limit");
        return;
      }

      const existingItem = cart.find(
        (item) => Number(item.productId) === product.id && !item.size,
      );

      if (existingItem) {
        existingItem.quantity = Math.min(product.stock, Number(existingItem.quantity) + 1);
      } else {
        cart.push({
          productId: product.id,
          name: product.name,
          quantity: 1,
          price: product.price,
          image: product.image,
        });
      }

      if (!saveCart(cart)) {
        showError("Your cart could not be saved in this browser.", "Cart Error");
        return;
      }

      showSuccess(`${product.name} added to cart.`, "✓ Added to Cart");
      updateCartCount();

      const originalText = addCartBtn.textContent;
      addCartBtn.textContent = "✓ ADDED";
      addCartBtn.disabled = true;
      window.setTimeout(() => {
        addCartBtn.textContent = originalText;
        addCartBtn.disabled = getProductQuantity(readCart(), product.id) >= product.stock;
      }, 1500);
    });

    fragment.appendChild(card);
  });

  productsContainer.appendChild(fragment);
}

function applyFiltersFromUrl() {
  const { category, band } = getRequestedFilters();
  const selectedButton = [...categoryButtons].find(
    (button) => button.dataset.category === category,
  );

  categoryButtons.forEach((button) => button.classList.remove("active"));
  (selectedButton || categoryButtons[0])?.classList.add("active");
  renderProducts(filterProducts(category === "all" || selectedButton ? category : "all", band));
}

categoryButtons.forEach((button) => {
  button.type = "button";
  button.addEventListener("click", () => {
    const selectedCategory = button.dataset.category;
    categoryButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    const url = new URL(window.location.href);
    if (selectedCategory === "all") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", selectedCategory);
    }
    window.history.replaceState({}, "", url);

    const band = normalizeBand(url.searchParams.get("band"));
    renderProducts(filterProducts(selectedCategory, band));
  });
});

function updateCartCount() {
  const cart = readCart();
  const totalItems = cart.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
  const cartPill = document.querySelector(".cart-pill");
  if (cartPill) cartPill.textContent = `CART (${totalItems})`;
}

window.addEventListener("storage", (event) => {
  if (event.key === "cart") updateCartCount();
});

applyFiltersFromUrl();
updateCartCount();
