import { supabase } from "./js/supabase.js";

let products = [];

const productsContainer = document.getElementById("products-container");
const categoryButtons = document.querySelectorAll(".category-btn");


// ======================================================
// CART
// ======================================================

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
    return String(item.productId) === String(productId)
      ? total + (Number(item.quantity) || 0)
      : total;
  }, 0);
}


// ======================================================
// HELPERS
// ======================================================

function normalizeBand(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}


// ======================================================
// URL FILTERS
// ======================================================

function getRequestedFilters() {
  const params = new URLSearchParams(window.location.search);

  return {
    category: params.get("category") || "all",
    band: normalizeBand(params.get("band")),
  };
}


// ======================================================
// FILTER PRODUCTS
// ======================================================

function filterProducts(category, band) {
  return products.filter((product) => {

    const categoryMatch =
      category === "all" ||
      product.category === category;

    const bandMatch =
      !band ||
      normalizeBand(product.band) === band;

    return categoryMatch && bandMatch;
  });
}


// ======================================================
// RENDER PRODUCTS
// ======================================================

function renderProducts(productsToRender = products) {

  if (!productsContainer) {
    console.error("products-container not found.");
    return;
  }

  productsContainer.innerHTML = "";

  const fragment = document.createDocumentFragment();


  // اگر محصولی وجود نداشت
  if (!productsToRender.length) {

    const emptyMessage = document.createElement("p");

    emptyMessage.textContent = "No products found.";

    emptyMessage.className = "no-products";

    productsContainer.appendChild(emptyMessage);

    return;
  }


  productsToRender.forEach((product) => {

    // ==============================================
    // CARD
    // ==============================================

    const card = document.createElement("article");

    card.className = "product-card";

    card.tabIndex = 0;

    card.setAttribute("role", "link");


    // ==============================================
    // IMAGE
    // ==============================================

    const imageWrap = document.createElement("div");

    imageWrap.className = "product-image";


    // چون فعلاً محصول عکس ندارد
    // فقط وقتی image وجود داشته باشد img ساخته می‌شود

    if (product.image) {

      const image = document.createElement("img");

      image.src = product.image;

      image.alt = product.name || product.name;

      image.loading = "lazy";

      image.decoding = "async";


      image.addEventListener(
        "error",
        () => {
          imageWrap.classList.add("image-error");
          image.remove();
        },
        { once: true }
      );


      imageWrap.appendChild(image);
    }


    // ==============================================
    // INFO
    // ==============================================

    const info = document.createElement("div");

    info.className = "product-info";


    // ==============================================
    // BAND
    // ==============================================

    const band = document.createElement("p");

    band.className = "product-band";

    band.textContent = product.band || "";


    // ==============================================
    // NAME
    // ==============================================

    const name = document.createElement("h2");

    name.className = "product-name";

    name.textContent = product.name;


    // ==============================================
    // TYPE
    // ==============================================

    const type = document.createElement("p");

    type.className = "product-type";

    type.textContent = product.type || "";


    // ==============================================
    // BOTTOM
    // ==============================================

    const bottom = document.createElement("div");

    bottom.className = "product-bottom";


    // ==============================================
    // PRICE
    // ==============================================

    const price = document.createElement("span");

    price.className = "product-price";

    price.textContent =
      `${Number(product.price).toLocaleString("fa-IR")} تومان`;


    // ==============================================
    // ADD TO CART BUTTON
    // ==============================================

    const addCartBtn = document.createElement("button");

    addCartBtn.type = "button";

    addCartBtn.className = "add-cart";

    addCartBtn.textContent =
      product.stock > 0
        ? "ADD TO CART"
        : "OUT OF STOCK";

    addCartBtn.disabled = product.stock <= 0;


    // ==============================================
    // ADD TO CART
    // ==============================================

    addCartBtn.addEventListener("click", (event) => {

      event.stopPropagation();


      const cart = readCart();


      const currentQuantity =
        getProductQuantity(cart, product.id);


      // Stock limit
      if (currentQuantity >= product.stock) {

        if (typeof showWarning === "function") {

          showWarning(
            "This product is already at its stock limit.",
            "⚠ Stock Limit"
          );

        }

        return;
      }


      // Check existing item
      const existingItem = cart.find(
        (item) =>
          String(item.productId) === String(product.id) &&
          !item.size
      );


      if (existingItem) {

        existingItem.quantity = Math.min(
          product.stock,
          Number(existingItem.quantity || 0) + 1
        );

      } else {

        cart.push({
          productId: product.id,
          name: product.name,
          quantity: 1,
          price: product.price,
          image: product.image || "",
        });
      }


      // Save cart
      if (!saveCart(cart)) {

        if (typeof showError === "function") {

          showError(
            "Your cart could not be saved in this browser.",
            "Cart Error"
          );
        }

        return;
      }


      // Success message
      if (typeof showSuccess === "function") {

        showSuccess(
          `${product.name} added to cart.`,
          "✓ Added to Cart"
        );
      }


      updateCartCount();


      // Button animation
      const originalText =
        addCartBtn.textContent;


      addCartBtn.textContent = "✓ ADDED";

      addCartBtn.disabled = true;


      window.setTimeout(() => {

        addCartBtn.textContent = originalText;

        addCartBtn.disabled =
          getProductQuantity(
            readCart(),
            product.id
          ) >= product.stock;

      }, 1500);

    });


    // ==============================================
    // BUILD CARD
    // ==============================================

    bottom.append(
      price,
      addCartBtn
    );


    info.append(
      band,
      name,
      type,
      bottom
    );


    card.append(
      imageWrap,
      info
    );


    // ==============================================
    // OPEN PRODUCT DETAIL
    // ==============================================

    const openDetail = () => {

      window.location.href =
        `product-detail.html?id=${encodeURIComponent(product.id)}`;

    };


    card.addEventListener("click", (event) => {

      if (!event.target.closest(".add-cart")) {

        openDetail();

      }

    });


    // Keyboard
    card.addEventListener("keydown", (event) => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        openDetail();

      }

    });


    fragment.appendChild(card);

  });


  productsContainer.appendChild(fragment);
}


// ======================================================
// APPLY URL FILTER
// ======================================================

function applyFiltersFromUrl() {

  const {
    category,
    band
  } = getRequestedFilters();


  // ==============================================
  // VALID CATEGORY
  // ==============================================

  const validCategories = [
    "all",
    "necklaces",
    "pendants"
  ];


  const selectedCategory =
    validCategories.includes(category)
      ? category
      : "all";


  // ==============================================
  // ACTIVE BUTTON
  // ==============================================

  categoryButtons.forEach((button) => {

    button.classList.toggle(
      "active",
      button.dataset.category === selectedCategory
    );

  });


  // ==============================================
  // FILTER
  // ==============================================

  const filteredProducts =
    filterProducts(
      selectedCategory,
      band
    );


  renderProducts(filteredProducts);
}


// ======================================================
// CATEGORY BUTTONS
// ======================================================

categoryButtons.forEach((button) => {

  button.type = "button";


  button.addEventListener("click", () => {

    const selectedCategory =
      button.dataset.category;


    // Active button
    categoryButtons.forEach((btn) => {

      btn.classList.remove("active");

    });


    button.classList.add("active");


    // Update URL
    const url =
      new URL(window.location.href);


    if (selectedCategory === "all") {

      url.searchParams.delete("category");

    } else {

      url.searchParams.set(
        "category",
        selectedCategory
      );

    }


    window.history.replaceState(
      {},
      "",
      url
    );


    // Current band
    const band =
      normalizeBand(
        url.searchParams.get("band")
      );


    // Render
    renderProducts(
      filterProducts(
        selectedCategory,
        band
      )
    );

  });

});


// ======================================================
// CART COUNT
// ======================================================

function updateCartCount() {

  const cart = readCart();


  const totalItems =
    cart.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          Number(item.quantity) || 0
        ),
      0
    );


  const cartPill =
    document.querySelector(".cart-pill");


  if (cartPill) {

    cartPill.textContent =
      `CART (${totalItems})`;

  }

}


// ======================================================
// STORAGE EVENT
// ======================================================

window.addEventListener(
  "storage",
  (event) => {

    if (event.key === "cart") {

      updateCartCount();

    }

  }
);


// ======================================================
// LOAD PRODUCTS FROM SUPABASE
// ======================================================

async function loadProducts() {

  const {
    data,
    error
  } = await supabase

    .from("products")

    .select(`
            id,
            name,
            slug,
            description,
            type,
            price,
            material,
            is_active,

            categories (
                name,
                slug
            ),

            product_variants (
                id,
                size,
                stock,
                price
            ),
            product_images (
            id,
            storage_path,
            alt_text,
            is_primary,
            sort_order
        )
        `)

    .eq("is_active", true);


  console.log(
    "PRODUCTS FROM SUPABASE:",
    data
  );


  console.log(
    "SUPABASE ERROR:",
    error
  );


  // ==============================================
  // ERROR
  // ==============================================

  if (error) {

    console.error(
      "Error loading products:",
      error
    );


    productsContainer.innerHTML = `
            <p>Failed to load products.</p>
        `;


    return;
  }


  // ==============================================
  // MAP DATA
  // ==============================================

  products =
    (data || []).map((product) => {


      // Category
      let category = "";


      if (Array.isArray(product.categories)) {

        category =
          product.categories[0]?.slug || "";

      } else {

        category =
          product.categories?.slug || "";

      }


      // Variants
      const variants =
        Array.isArray(product.product_variants)
          ? product.product_variants
          : [];


      // Stock
      const stock =
        variants.reduce(
          (total, variant) =>
            total +
            Number(variant.stock || 0),
          0
        );
      const images =
        Array.isArray(product.product_images)
          ? product.product_images
          : [];

      const primaryImage =
        images
          .filter(image => image.is_primary)
          .sort(
            (a, b) =>
              (a.sort_order || 0) -
              (b.sort_order || 0)
          )[0]
        || images.sort(
          (a, b) =>
            (a.sort_order || 0) -
            (b.sort_order || 0)
        )[0]
        || null;

      return {

        id: product.id,

        name: product.name,

        category: category,

        band: null,

        type: product.type || "",

        price: product.price,

        // فعلاً عکس نداریم
        image: primaryImage?.storage_path || "",

        description:
          product.description || "",

        material:
          product.material || "",

        sizes:
          variants.map(
            (variant) =>
              variant.size
          ),

        stock: stock,

      };

    });


  console.log(
    "MAPPED PRODUCTS:",
    products
  );


  // ==============================================
  // IMPORTANT
  // ==============================================

  // بعد از اینکه محصولات از Supabase آمدند،
  // تازه فیلتر URL را اجرا می‌کنیم.

  applyFiltersFromUrl();

}


// ======================================================
// INITIALIZE
// ======================================================

updateCartCount();

loadProducts();