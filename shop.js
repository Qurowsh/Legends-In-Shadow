const productsContainer = document.getElementById("products-container");
const categoryButtons = document.querySelectorAll(".category-btn");

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

function renderProducts(productsToRender) {
  productsContainer.innerHTML = "";

  productsToRender.forEach((product) => {
    const card = document.createElement("article");
    card.classList.add("product-card");
    card.tabIndex = 0;
    card.setAttribute("role", "link");

    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy" decoding="async">
      </div>
      <div class="product-info">
        <p class="product-band">${product.band ?? ""}</p>
        <h2 class="product-name">${product.name}</h2>
        <p class="product-type">${product.type}</p>
        <div class="product-bottom">
          <span class="product-price">$${product.price}</span>
          <button class="add-cart" type="button" ${product.stock < 1 ? "disabled" : ""}>
            ${product.stock < 1 ? "OUT OF STOCK" : "ADD TO CART"}
          </button>
        </div>
      </div>
    `;

    const openProduct = () => {
      window.location.href = `product-detail.html?id=${product.id}`;
    };

    card.addEventListener("click", (event) => {
      if (event.target.closest(".add-cart")) return;
      openProduct();
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openProduct();
      }
    });

    const addCartBtn = card.querySelector(".add-cart");
    addCartBtn.addEventListener("click", (event) => {
      event.stopPropagation();

      if (product.stock < 1) return;

      const cart = readCart();
      const existingItem = cart.find(
        (item) => item.productId === product.id && !item.size,
      );
      const currentQuantity = existingItem?.quantity ?? 0;

      if (currentQuantity >= product.stock) {
        addCartBtn.textContent = "MAX STOCK";
        setTimeout(() => {
          addCartBtn.textContent = "ADD TO CART";
        }, 1500);
        return;
      }

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          productId: product.id,
          name: product.name,
          quantity: 1,
          price: product.price,
          image: product.image,
        });
      }

      saveCart(cart);

      const originalText = addCartBtn.textContent;
      addCartBtn.textContent = "✓ ADDED";
      addCartBtn.style.color = "#90ee90";

      setTimeout(() => {
        addCartBtn.textContent = originalText;
        addCartBtn.style.color = "";
      }, 1500);

      updateCartCount();
    });

    const productImage = card.querySelector("img");
    productImage.addEventListener("error", () => {
      productImage.removeAttribute("src");
      productImage.alt = `${product.name} image unavailable`;
    }, { once: true });

    productsContainer.appendChild(card);
  });
}

function getRequestedFilters() {
  const params = new URLSearchParams(window.location.search);
  return {
    category: params.get("category") || "all",
    band: params.get("band") || "",
  };
}

function applyFilters(category, band) {
  let filteredProducts = products;

  if (category !== "all") {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === category,
    );
  }

  if (band) {
    const normalizedBand = band.trim().toLowerCase();
    filteredProducts = filteredProducts.filter(
      (product) => product.band?.trim().toLowerCase() === normalizedBand,
    );
  }

  renderProducts(filteredProducts);

  categoryButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.category === category);
  });
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedCategory = button.dataset.category;
    const params = new URLSearchParams(window.location.search);

    if (selectedCategory === "all") {
      params.delete("category");
    } else {
      params.set("category", selectedCategory);
    }

    params.delete("band");
    window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
    applyFilters(selectedCategory, "");
  });
});

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

const requestedFilters = getRequestedFilters();
applyFilters(requestedFilters.category, requestedFilters.band);
updateCartCount();
