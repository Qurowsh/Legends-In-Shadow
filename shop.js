const productsContainer = document.getElementById("products-container");
const categoryButtons = document.querySelectorAll(".category-btn");

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
  const totalItems = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const cartPill = document.querySelector(".cart-pill");

  if (cartPill) {
    cartPill.textContent = `CART (${totalItems})`;
  }
}

function addProductToCart(product) {
  const cart = getCart();
  const existingItem = cart.find((item) => item.productId === product.id);

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

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function renderProducts(productsToRender) {
  if (!productsContainer) {
    return;
  }

  const fragment = document.createDocumentFragment();

  productsToRender.forEach((product) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.tabIndex = 0;
    card.setAttribute("role", "link");

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.name;
    image.width = 600;
    image.height = 600;
    image.loading = "lazy";
    image.decoding = "async";

    const imageWrapper = document.createElement("div");
    imageWrapper.className = "product-image";
    imageWrapper.appendChild(image);

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

    const addCartButton = document.createElement("button");
    addCartButton.className = "add-cart";
    addCartButton.type = "button";
    addCartButton.textContent = "ADD TO CART";
    addCartButton.disabled = product.stock <= 0;

    if (product.stock <= 0) {
      addCartButton.textContent = "OUT OF STOCK";
    }

    addCartButton.addEventListener("click", (event) => {
      event.stopPropagation();

      if (product.stock <= 0) {
        return;
      }

      addProductToCart(product);

      const originalText = addCartButton.textContent;
      addCartButton.textContent = "✓ ADDED";

      window.setTimeout(() => {
        addCartButton.textContent = originalText;
      }, 1200);
    });

    bottom.append(price, addCartButton);
    info.append(band, name, type, bottom);
    card.append(imageWrapper, info);

    const openProduct = () => {
      window.location.href = `product-detail.html?id=${product.id}`;
    };

    card.addEventListener("click", (event) => {
      if (!event.target.closest("button")) {
        openProduct();
      }
    });

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openProduct();
      }
    });

    fragment.appendChild(card);
  });

  productsContainer.replaceChildren(fragment);
}

function setActiveCategory(button) {
  categoryButtons.forEach((categoryButton) => {
    const isActive = categoryButton === button;
    categoryButton.classList.toggle("active", isActive);
    categoryButton.setAttribute("aria-pressed", String(isActive));
  });
}

function applyFilters(category) {
  const filteredProducts = getProductsByCategory(category);
  renderProducts(filteredProducts);
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedCategory = button.dataset.category || "all";
    setActiveCategory(button);
    applyFilters(selectedCategory);
  });
});

function applyUrlFilter() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const band = params.get("band");

  if (category) {
    const button = [...categoryButtons].find(
      (categoryButton) => categoryButton.dataset.category === category,
    );

    if (button) {
      setActiveCategory(button);
      applyFilters(category);
      return;
    }
  }

  if (band) {
    const filteredProducts = products.filter(
      (product) => product.band?.toLowerCase() === band.toLowerCase(),
    );
    renderProducts(filteredProducts);
    return;
  }

  renderProducts(products);
}

applyUrlFilter();
updateCartCount();
