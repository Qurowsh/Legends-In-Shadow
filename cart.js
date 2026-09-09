import { supabase } from "./js/supabase.js";

let products = [];
let discountRate = 0;
let currentUser = null;
let currentUserCart = null;
let currentDbCartItems = [];

/* =========================================================
   PRICE
========================================================= */

function formatPrice(value) {
  const price = Number(value) || 0;

  return `${new Intl.NumberFormat("fa-IR").format(
    Math.round(price)
  )} تومان`;
}


/* =========================================================
   IMAGE
========================================================= */

function getProductImageUrl(storagePath) {
  if (!storagePath) {
    return "";
  }

  const rawPath = String(storagePath).trim();

  if (!rawPath) {
    return "";
  }

  // اگر storage_path خودش URL کامل باشد
  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath;
  }

  // اگر path معمولی داخل bucket باشد
  let path = rawPath.replace(/^\/+/, "");

  // اگر اسم bucket هم داخل storage_path ذخیره شده باشد
  if (path.startsWith("product-images/")) {
    path = path.substring("product-images/".length);
  }

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(path);

  return data?.publicUrl || "";
}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function getGuestCart() {
  try {
    const cart = JSON.parse(
      localStorage.getItem("cart") || "[]"
    );

    return Array.isArray(cart) ? cart : [];
  } catch (error) {
    console.error("Failed to read guest cart:", error);
    return [];
  }
}

function saveGuestCart(cart) {
  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );
}


/* =========================================================
   AUTH
========================================================= */

async function getCurrentUser() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Failed to get current user:", error);
    return null;
  }

  return user || null;
}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {
  const { data, error } = await supabase
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

  if (error) {
    console.error("Failed to load products:", error);
    products = [];
    return;
  }

  products = (data || []).map(product => {
    const variants = Array.isArray(product.product_variants)
      ? product.product_variants
      : [];

    const images = Array.isArray(product.product_images)
      ? product.product_images
      : [];

    const primaryImage =
      images.find(image => image.is_primary) ||
      [...images].sort(
        (a, b) =>
          Number(a.sort_order || 0) -
          Number(b.sort_order || 0)
      )[0];

    const imageUrl = getProductImageUrl(
      primaryImage?.storage_path
    );

    const variantStocks = variants.map(
      variant => Number(variant.stock) || 0
    );

    const totalStock = variantStocks.reduce(
      (sum, stock) => sum + stock,
      0
    );

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      type: product.type,
      material: product.material,
      price: Number(product.price) || 0,
      stock: totalStock,
      image: imageUrl,
      images,
      variants
    };
  });
}


/* =========================================================
   PRODUCT HELPERS
========================================================= */

function getProduct(productId) {
  return products.find(
    product => Number(product.id) === Number(productId)
  );
}

function getProductVariant(product, variantId) {
  if (!product || !Array.isArray(product.variants)) {
    return null;
  }

  return product.variants.find(
    variant => Number(variant.id) === Number(variantId)
  );
}

function getProductPrice(product, variantId = null) {
  if (!product) {
    return 0;
  }

  if (variantId) {
    const variant = getProductVariant(
      product,
      variantId
    );

    if (
      variant &&
      variant.price !== null &&
      variant.price !== undefined
    ) {
      return Number(variant.price) || 0;
    }
  }

  return Number(product.price) || 0;
}


/* =========================================================
   USER CART
========================================================= */

async function getOrCreateUserCart() {
  if (!currentUser) {
    return null;
  }

  const { data: existingCart, error: fetchError } =
    await supabase
      .from("carts")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", {
        ascending: true
      })
      .limit(1)
      .maybeSingle();

  if (fetchError) {
    console.error(
      "Failed to load user cart:",
      fetchError
    );

    return null;
  }

  if (existingCart) {
    return existingCart;
  }

  const { data: newCart, error: createError } =
    await supabase
      .from("carts")
      .insert({
        user_id: currentUser.id
      })
      .select()
      .single();

  if (createError) {
    console.error(
      "Failed to create user cart:",
      createError
    );

    return null;
  }

  return newCart;
}


/* =========================================================
   LOAD USER CART ITEMS
========================================================= */

async function loadUserCartItems() {
  currentDbCartItems = [];

  if (!currentUserCart) {
    return;
  }

  const { data, error } = await supabase
    .from("cart_items")
    .select(`
            id,
            cart_id,
            product_variant_id,
            quantity
        `)
    .eq("cart_id", currentUserCart.id);

  if (error) {
    console.error(
      "Failed to load cart items:",
      error
    );

    return;
  }

  currentDbCartItems = data || [];
}


/* =========================================================
   ADD ITEM TO USER CART
========================================================= */

async function addVariantToUserCart(
  variantId,
  quantity = 1
) {
  if (!currentUser || !currentUserCart) {
    return false;
  }

  const numericVariantId = Number(variantId);
  const numericQuantity = Number(quantity) || 1;

  const existingItem = currentDbCartItems.find(
    item =>
      Number(item.product_variant_id) ===
      numericVariantId
  );

  if (existingItem) {
    const newQuantity =
      Number(existingItem.quantity) +
      numericQuantity;

    const { error } = await supabase
      .from("cart_items")
      .update({
        quantity: newQuantity
      })
      .eq("id", existingItem.id)
      .eq("cart_id", currentUserCart.id);

    if (error) {
      console.error(
        "Failed to update cart item:",
        error
      );

      return false;
    }
  } else {
    const { error } = await supabase
      .from("cart_items")
      .insert({
        cart_id: currentUserCart.id,
        product_variant_id: numericVariantId,
        quantity: numericQuantity
      });

    if (error) {
      console.error(
        "Failed to add cart item:",
        error
      );

      return false;
    }
  }

  await loadUserCartItems();

  return true;
}


/* =========================================================
   UPDATE USER CART ITEM
========================================================= */

async function updateUserCartItem(
  itemId,
  quantity
) {
  if (!currentUser || !currentUserCart) {
    return false;
  }

  const numericQuantity = Number(quantity);

  if (numericQuantity <= 0) {
    return removeUserCartItem(itemId);
  }

  const { error } = await supabase
    .from("cart_items")
    .update({
      quantity: numericQuantity
    })
    .eq("id", itemId)
    .eq("cart_id", currentUserCart.id);

  if (error) {
    console.error(
      "Failed to update cart item:",
      error
    );

    return false;
  }

  await loadUserCartItems();

  return true;
}


/* =========================================================
   REMOVE USER CART ITEM
========================================================= */

async function removeUserCartItem(itemId) {
  if (!currentUser || !currentUserCart) {
    return false;
  }

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId)
    .eq("cart_id", currentUserCart.id);

  if (error) {
    console.error(
      "Failed to remove cart item:",
      error
    );

    return false;
  }

  await loadUserCartItems();

  return true;
}


/* =========================================================
   NORMALIZE CART
========================================================= */

function getCartItemsForDisplay() {
  if (currentUser) {
    return currentDbCartItems
      .map(dbItem => {
        const product = products.find(
          item => {
            if (
              !Array.isArray(
                item.variants
              )
            ) {
              return false;
            }

            return item.variants.some(
              variant =>
                Number(variant.id) ===
                Number(
                  dbItem.product_variant_id
                )
            );
          }
        );

        if (!product) {
          return null;
        }

        const variant =
          getProductVariant(
            product,
            dbItem.product_variant_id
          );

        return {
          cartItemId: dbItem.id,
          productId: product.id,
          variantId:
            dbItem.product_variant_id,
          quantity:
            Number(dbItem.quantity) || 1,
          product,
          variant,
          price: getProductPrice(
            product,
            dbItem.product_variant_id
          )
        };
      })
      .filter(Boolean);
  }

  const guestCart = getGuestCart();

  return guestCart
    .map(item => {
      const product = getProduct(
        item.productId ?? item.id
      );

      if (!product) {
        return null;
      }

      const variantId =
        item.variantId ??
        item.product_variant_id ??
        null;

      const variant = variantId
        ? getProductVariant(
          product,
          variantId
        )
        : null;

      return {
        cartItemId: null,
        productId: product.id,
        variantId,
        quantity:
          Number(item.quantity) || 1,
        product,
        variant,
        price: getProductPrice(
          product,
          variantId
        )
      };
    })
    .filter(Boolean);
}


/* =========================================================
   RENDER CART
========================================================= */

function renderCart() {
  const cartItemsContainer =
    document.getElementById(
      "cartItemsContainer"
    );

  if (!cartItemsContainer) {
    return;
  }

  const cartItems =
    getCartItemsForDisplay();

  cartItemsContainer.innerHTML = "";

  if (cartItems.length === 0) {
    cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <h2>YOUR CART IS EMPTY</h2>
                <p>There are no products in your cart.</p>
                <a href="index-shop.html">
                    CONTINUE SHOPPING
                </a>
            </div>
        `;

    updateSummary([]);
    updateCartCount(0);

    return;
  }

  cartItems.forEach(item => {
    const product = item.product;

    const itemTotal =
      item.price * item.quantity;

    const variantSize =
      item.variant?.size || "One Size";

    const itemElement =
      document.createElement("div");

    itemElement.className = "cart-item";

    itemElement.innerHTML = `
            <div class="cart-item-image">
                ${product.image
        ? `
                            <img
                                src="${product.image}"
                                alt="${escapeHtml(
          product.name
        )}"
                                loading="lazy"
                                onerror="this.style.display='none';"
                            >
                        `
        : `
                            <div class="no-image">
                                NO IMAGE
                            </div>
                        `
      }
            </div>

            <div class="cart-item-info">
                <h3 class="cart-item-name">
                    ${escapeHtml(product.name)}
                </h3>

                <div class="cart-item-size">
                    SIZE: ${escapeHtml(
        String(variantSize)
      )}
                </div>

                <div class="cart-item-price">
                    ${formatPrice(item.price)}
                </div>
            </div>

            <div class="cart-item-actions">

                <div class="quantity-controls">

                    <button
                        type="button"
                        class="quantity-btn decrease-btn"
                        aria-label="Decrease quantity"
                    >
                        −
                    </button>

                    <span class="quantity">
                        ${item.quantity}
                    </span>

                    <button
                        type="button"
                        class="quantity-btn increase-btn"
                        aria-label="Increase quantity"
                    >
                        +
                    </button>

                </div>

                <div class="cart-item-total">
                    ${formatPrice(itemTotal)}
                </div>

                <button
                    type="button"
                    class="remove-item"
                >
                    REMOVE
                </button>

            </div>
        `;

    const decreaseBtn =
      itemElement.querySelector(
        ".decrease-btn"
      );

    const increaseBtn =
      itemElement.querySelector(
        ".increase-btn"
      );

    const removeBtn =
      itemElement.querySelector(
        ".remove-item"
      );

    decreaseBtn.addEventListener(
      "click",
      async () => {
        await changeQuantity(
          item,
          -1
        );
      }
    );

    increaseBtn.addEventListener(
      "click",
      async () => {
        await changeQuantity(
          item,
          1
        );
      }
    );

    removeBtn.addEventListener(
      "click",
      async () => {
        await removeCartItem(item);
      }
    );

    cartItemsContainer.appendChild(
      itemElement
    );
  });

  updateSummary(cartItems);

  updateCartCount(
    cartItems.reduce(
      (total, item) =>
        total + item.quantity,
      0
    )
  );
}


/* =========================================================
   CHANGE QUANTITY
========================================================= */

async function changeQuantity(item, amount) {
  const newQuantity =
    Number(item.quantity) + Number(amount);

  // حذف وقتی تعداد به صفر می‌رسد
  if (newQuantity <= 0) {
    await removeCartItem(item);
    return;
  }

  // فقط هنگام افزایش تعداد، موجودی را بررسی کن
  if (amount > 0) {
    const variant = item.variant;

    if (!variant) {
      console.error(
        "Product variant not found:",
        item
      );
      return;
    }

    const stock = Number(variant.stock) || 0;

    console.log(
      "Stock:",
      stock,
      "New quantity:",
      newQuantity
    );

    if (newQuantity > stock) {
      showStockPopup(stock);
      return;
    }
  }

  // کاربر لاگین کرده
  if (currentUser) {
    const success =
      await updateUserCartItem(
        item.cartItemId,
        newQuantity
      );

    if (!success) {
      return;
    }
  }

  // مهمان
  else {
    const cart = getGuestCart();

    const cartItem = cart.find(
      cartItem => {
        const productId =
          cartItem.productId ??
          cartItem.id;

        const variantId =
          cartItem.variantId ??
          cartItem.product_variant_id ??
          null;

        return (
          Number(productId) ===
          Number(item.productId) &&
          Number(variantId || 0) ===
          Number(item.variantId || 0)
        );
      }
    );

    if (cartItem) {
      cartItem.quantity = newQuantity;
      saveGuestCart(cart);
    }
  }

  renderCart();
}
/* =========================================================
   REMOVE CART ITEM
========================================================= */

async function removeCartItem(item) {
  if (currentUser) {
    await removeUserCartItem(
      item.cartItemId
    );
  } else {
    const cart = getGuestCart();

    const newCart = cart.filter(
      cartItem => {
        const productId =
          cartItem.productId ??
          cartItem.id;

        const variantId =
          cartItem.variantId ??
          cartItem.product_variant_id ??
          null;

        return !(
          Number(productId) ===
          Number(item.productId) &&
          Number(variantId || 0) ===
          Number(item.variantId || 0)
        );
      }
    );

    saveGuestCart(newCart);
  }

  renderCart();
}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary(cartItems) {
  const subtotalAmount =
    document.getElementById(
      "subtotalAmount"
    );

  const shippingAmount =
    document.getElementById(
      "shippingAmount"
    );

  const taxAmount =
    document.getElementById(
      "taxAmount"
    );

  const discountAmount =
    document.getElementById(
      "discountAmount"
    );

  const totalAmount =
    document.getElementById(
      "totalAmount"
    );

  const subtotal = cartItems.reduce(
    (total, item) =>
      total +
      item.price *
      item.quantity,
    0
  );

  /*
   * فعلاً ارسال و مالیات صفر هستند.
   * بعداً می‌توانیم منطق واقعی آنها را اضافه کنیم.
   */
  const shipping = 0;
  const tax = 0;

  const discount =
    subtotal *
    (discountRate / 100);

  const total =
    subtotal +
    shipping +
    tax -
    discount;

  if (subtotalAmount) {
    subtotalAmount.textContent =
      formatPrice(subtotal);
  }

  if (shippingAmount) {
    shippingAmount.textContent =
      formatPrice(shipping);
  }

  if (taxAmount) {
    taxAmount.textContent =
      formatPrice(tax);
  }

  if (discountAmount) {
    discountAmount.textContent =
      discount > 0
        ? `-${formatPrice(discount)}`
        : formatPrice(0);
  }

  if (totalAmount) {
    totalAmount.textContent =
      formatPrice(
        Math.max(0, total)
      );
  }
}


/* =========================================================
   CART COUNT
========================================================= */

async function updateCartCount(
  forcedCount = null
) {
  const cartCountElements =
    document.querySelectorAll(
      "[data-cart-count], .cart-count"
    );

  let count = forcedCount;

  if (count === null) {
    if (currentUser) {
      count = currentDbCartItems.reduce(
        (total, item) =>
          total +
          (Number(item.quantity) || 0),
        0
      );
    } else {
      count = getGuestCart().reduce(
        (total, item) =>
          total +
          (Number(item.quantity) || 0),
        0
      );
    }
  }

  cartCountElements.forEach(
    element => {
      element.textContent =
        String(count);
    }
  );
}


/* =========================================================
   PROMO CODE
========================================================= */

async function applyPromoCode() {
  const promoInput =
    document.getElementById(
      "promoCode"
    );

  if (!promoInput) {
    return;
  }

  const code =
    promoInput.value
      .trim()
      .toUpperCase();

  if (!code) {
    return;
  }

  const { data, error } =
    await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

  if (error) {
    console.error(
      "Failed to check promo code:",
      error
    );

    return;
  }

  if (!data) {
    discountRate = 0;

    alert("Invalid promo code.");

    renderCart();

    return;
  }

  const now = new Date();

  if (
    data.starts_at &&
    new Date(data.starts_at) > now
  ) {
    alert("This promo code is not active yet.");
    return;
  }

  if (
    data.expires_at &&
    new Date(data.expires_at) < now
  ) {
    alert("This promo code has expired.");
    return;
  }

  discountRate =
    Number(data.discount_percent) || 0;

  renderCart();
}


/* =========================================================
   CHECKOUT
========================================================= */

async function handleCheckout() {
  if (!currentUser) {
    window.location.href =
      "login.html?redirect=cart.html";

    return;
  }

  if (
    !currentDbCartItems ||
    currentDbCartItems.length === 0
  ) {
    alert("Your cart is empty.");
    return;
  }

  /*
   * فعلاً فقط کاربر را به Checkout می‌فرستیم.
   * محاسبه نهایی قیمت/موجودی باید در RPC امن
   * سمت Supabase انجام شود.
   */
  window.location.href =
    "checkout.html";
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {
  const promoButton =
    document.getElementById(
      "applyPromoBtn"
    );

  if (promoButton) {
    promoButton.addEventListener(
      "click",
      applyPromoCode
    );
  }

  const promoInput =
    document.getElementById(
      "promoCode"
    );

  if (promoInput) {
    promoInput.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter"
        ) {
          event.preventDefault();
          applyPromoCode();
        }
      }
    );
  }

  const checkoutButton =
    document.getElementById(
      "checkoutBtn"
    );

  if (checkoutButton) {
    checkoutButton.addEventListener(
      "click",
      handleCheckout
    );
  }
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   INITIALIZE
========================================================= */

async function initCart() {
  try {
    await loadProducts();

    currentUser =
      await getCurrentUser();

    if (currentUser) {
      currentUserCart =
        await getOrCreateUserCart();

      await loadUserCartItems();
    } else {
      currentUserCart = null;
      currentDbCartItems = [];
    }

    setupEventListeners();

    renderCart();

    await updateCartCount();

  } catch (error) {
    console.error(
      "Cart initialization failed:",
      error
    );
  }
}


/* =========================================================
   AUTH STATE CHANGES
========================================================= */

supabase.auth.onAuthStateChange(
  async () => {
    currentUser =
      await getCurrentUser();

    if (currentUser) {
      currentUserCart =
        await getOrCreateUserCart();

      await loadUserCartItems();
    } else {
      currentUserCart = null;
      currentDbCartItems = [];
    }

    renderCart();
    await updateCartCount();
  }
);
function showStockPopup(stock) {
  let popup = document.getElementById("stockPopup");

  if (!popup) {
    popup = document.createElement("div");

    popup.id = "stockPopup";

    popup.innerHTML = `
            <div class="stock-popup-backdrop"></div>

            <div class="stock-popup">
                <button
                    type="button"
                    class="stock-popup-close"
                    aria-label="Close"
                >
                    ×
                </button>

                <div class="stock-popup-icon">
                    !
                </div>

                <div class="stock-popup-content">
                    <div class="stock-popup-label">
                        STOCK LIMIT
                    </div>

                    <h3>موجودی کافی نیست</h3>

                    <p>
                        فقط
                        <strong class="stock-popup-number"></strong>
                        عدد از این محصول موجود است.
                    </p>
                </div>

                <button
                    type="button"
                    class="stock-popup-ok"
                >
                    متوجه شدم
                </button>
            </div>
        `;

    document.body.appendChild(popup);

    const closePopup = () => {
      popup.classList.remove("show");

      setTimeout(() => {
        if (popup && popup.parentNode) {
          popup.remove();
        }
      }, 250);
    };

    popup
      .querySelector(".stock-popup-backdrop")
      .addEventListener("click", closePopup);

    popup
      .querySelector(".stock-popup-close")
      .addEventListener("click", closePopup);

    popup
      .querySelector(".stock-popup-ok")
      .addEventListener("click", closePopup);
  }

  const numberElement = popup.querySelector(
    ".stock-popup-number"
  );

  numberElement.textContent =
    new Intl.NumberFormat("fa-IR").format(
      Number(stock)
    );

  // اگر Popup قبلاً ساخته شده ولی مخفی شده باشد
  popup.classList.remove("show");

  requestAnimationFrame(() => {
    popup.classList.add("show");
  });
}

/* =========================================================
   START
========================================================= */

initCart();