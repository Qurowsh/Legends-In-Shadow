import { supabase } from "./js/supabase.js";

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

let products = [];
let discountRate = 0;


// ===============================
// Helpers
// ===============================

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("fa-IR")} تومان`;
}


function loadCart() {
  try {
    const cart = JSON.parse(localStorage.getItem("cart"));

    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}


function saveCart(cart) {
  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );
}


function getProductById(productId) {
  return products.find(
    product =>
      String(product.id) === String(productId)
  );
}


function getProductQuantity(cart, productId, exceptIndex = -1) {
  return cart.reduce(
    (total, item, index) => {

      if (index === exceptIndex) {
        return total;
      }

      if (
        String(item.productId) !==
        String(productId)
      ) {
        return total;
      }

      return (
        total +
        Math.max(
          0,
          Number(item.quantity) || 0
        )
      );
    },
    0
  );
}


// ===============================
// Load products from Supabase
// ===============================

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

    console.error(
      "Error loading products:",
      error
    );

    cartItemsContainer.innerHTML = `
            <p>Failed to load products.</p>
        `;

    return false;
  }


  products = (data || []).map(product => {

    const variants =
      Array.isArray(product.product_variants)
        ? product.product_variants
        : [];


    const stock =
      variants.reduce(
        (total, variant) =>
          total +
          Number(variant.stock || 0),
        0
      );


    /*
     * اگر variant قیمت داشته باشد
     * از قیمت variant استفاده می‌کنیم.
     *
     * در غیر این صورت قیمت خود product.
     */
    const variantPrice =
      variants[0]?.price != null
        ? Number(variants[0].price)
        : Number(product.price);
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

      slug: product.slug,

      description:
        product.description || "",

      type:
        product.type || "",

      material:
        product.material || "",

      price:
        variantPrice,

      stock,

      image: primaryImage?.storage_path || "",

      sizes:
        variants.map(
          variant => variant.size
        )
    };
  });


  return true;
}


// ===============================
// Clean cart
// ===============================

function sanitizeCart(cart) {

  const cleanCart = [];

  cart.forEach(item => {

    const product =
      getProductById(item.productId);


    // محصول دیگر در دیتابیس نیست
    if (!product) {
      return;
    }


    let quantity =
      Math.floor(
        Number(item.quantity)
      );


    if (
      !Number.isFinite(quantity) ||
      quantity < 1
    ) {
      return;
    }


    const used =
      getProductQuantity(
        cleanCart,
        product.id
      );


    const available =
      Math.max(
        0,
        product.stock - used
      );


    if (available < 1) {
      return;
    }


    cleanCart.push({

      productId:
        product.id,

      name:
        product.name,

      size:
        item.size || null,

      quantity:
        Math.min(
          quantity,
          available
        ),

      price:
        product.price,

      image:
        product.image || ""
    });
  });


  return cleanCart;
}


// ===============================
// Render cart
// ===============================

function renderCart() {

  let cart =
    sanitizeCart(
      loadCart()
    );


  saveCart(cart);


  cartItemsContainer.innerHTML = "";


  const isEmpty =
    cart.length === 0;


  if (emptyCartMessage) {
    emptyCartMessage.hidden =
      !isEmpty;
  }


  if (checkoutBtn) {
    checkoutBtn.disabled =
      isEmpty;
  }


  if (isEmpty) {

    updateTotals();
    updateCartCount();

    return;
  }


  cart.forEach(
    (item, index) => {

      const product =
        getProductById(
          item.productId
        );


      if (!product) {
        return;
      }


      const itemTotal =
        product.price *
        item.quantity;


      const stock =
        product.stock;


      const otherQuantity =
        getProductQuantity(
          cart,
          product.id,
          index
        );


      const canIncrease =
        otherQuantity +
        item.quantity <
        stock;


      // =========================
      // Main item
      // =========================

      const itemDiv =
        document.createElement(
          "article"
        );

      itemDiv.className =
        "cart-item";


      // =========================
      // Image
      // =========================

      const imageWrap =
        document.createElement(
          "div"
        );

      imageWrap.className =
        "item-image";


      if (product.image) {
        const image = document.createElement("img");

        image.src = product.image;
        image.alt = product.imageAlt || product.name;

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

      // =========================
      // Details
      // =========================

      const details =
        document.createElement(
          "div"
        );

      details.className =
        "item-details";


      const name =
        document.createElement(
          "h3"
        );

      name.className =
        "item-name";

      name.textContent =
        product.name;


      const meta =
        document.createElement(
          "div"
        );

      meta.className =
        "item-meta";


      // Size

      if (item.size) {

        const sizeRow =
          document.createElement(
            "div"
          );

        sizeRow.className =
          "item-meta-row";


        const sizeLabel =
          document.createElement(
            "span"
          );

        sizeLabel.className =
          "item-meta-label";

        sizeLabel.textContent =
          "Size:";


        const sizeValue =
          document.createElement(
            "span"
          );

        sizeValue.className =
          "item-meta-value";

        sizeValue.textContent =
          item.size;


        sizeRow.append(
          sizeLabel,
          sizeValue
        );


        meta.appendChild(
          sizeRow
        );
      }


      // Price

      const priceRow =
        document.createElement(
          "div"
        );

      priceRow.className =
        "item-meta-row";


      const priceLabel =
        document.createElement(
          "span"
        );

      priceLabel.className =
        "item-meta-label";

      priceLabel.textContent =
        "Price:";


      const priceValue =
        document.createElement(
          "span"
        );

      priceValue.className =
        "item-price";

      priceValue.textContent =
        formatPrice(
          product.price
        );


      priceRow.append(
        priceLabel,
        priceValue
      );


      meta.appendChild(
        priceRow
      );


      details.append(
        name,
        meta
      );


      // =========================
      // Actions
      // =========================

      const actions =
        document.createElement(
          "div"
        );

      actions.className =
        "item-actions";


      const total =
        document.createElement(
          "div"
        );

      total.className =
        "item-total";

      total.textContent =
        formatPrice(
          itemTotal
        );


      // =========================
      // Quantity controls
      // =========================

      const controls =
        document.createElement(
          "div"
        );

      controls.className =
        "item-controls";


      const qtyControl =
        document.createElement(
          "div"
        );

      qtyControl.className =
        "qty-control";


      // Decrease

      const decrease =
        document.createElement(
          "button"
        );

      decrease.type =
        "button";

      decrease.className =
        "qty-decrease";

      decrease.dataset.index =
        index;

      decrease.textContent =
        "−";


      decrease.setAttribute(
        "aria-label",
        `Decrease ${product.name} quantity`
      );


      // Input

      const input =
        document.createElement(
          "input"
        );

      input.type =
        "number";

      input.className =
        "qty-input";

      input.dataset.index =
        index;

      input.value =
        item.quantity;

      input.min =
        "1";

      input.max =
        String(
          Math.max(
            1,
            stock -
            otherQuantity
          )
        );


      // Increase

      const increase =
        document.createElement(
          "button"
        );

      increase.type =
        "button";

      increase.className =
        "qty-increase";

      increase.dataset.index =
        index;

      increase.textContent =
        "+";


      increase.disabled =
        !canIncrease;


      increase.setAttribute(
        "aria-label",
        `Increase ${product.name} quantity`
      );


      qtyControl.append(
        decrease,
        input,
        increase
      );


      // =========================
      // Remove
      // =========================

      const remove =
        document.createElement(
          "button"
        );

      remove.type =
        "button";

      remove.className =
        "remove-btn";

      remove.dataset.index =
        index;

      remove.textContent =
        "REMOVE";


      controls.append(
        qtyControl,
        remove
      );


      actions.append(
        total,
        controls
      );


      itemDiv.append(
        imageWrap,
        details,
        actions
      );


      cartItemsContainer.appendChild(
        itemDiv
      );
    }
  );


  // =========================
  // Events
  // =========================

  document
    .querySelectorAll(".qty-decrease")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          changeQuantity(
            Number(
              button.dataset.index
            ),
            -1
          );
        }
      );
    });


  document
    .querySelectorAll(".qty-increase")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          changeQuantity(
            Number(
              button.dataset.index
            ),
            1
          );
        }
      );
    });


  document
    .querySelectorAll(".qty-input")
    .forEach(input => {

      input.addEventListener(
        "change",
        () => {

          const index =
            Number(
              input.dataset.index
            );


          const cart =
            loadCart();


          const item =
            cart[index];


          if (!item) {
            return;
          }


          const product =
            getProductById(
              item.productId
            );


          if (!product) {
            renderCart();
            return;
          }


          const requested =
            Math.floor(
              Number(
                input.value
              )
            );


          if (
            !Number.isFinite(
              requested
            )
          ) {
            renderCart();
            return;
          }


          const otherQuantity =
            getProductQuantity(
              cart,
              product.id,
              index
            );


          const max =
            Math.max(
              1,
              product.stock -
              otherQuantity
            );


          cart[index].quantity =
            Math.min(
              Math.max(
                1,
                requested
              ),
              max
            );


          saveCart(cart);

          renderCart();
        }
      );
    });


  document
    .querySelectorAll(".remove-btn")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.index
            );


          const cart =
            loadCart();


          if (
            !Number.isInteger(
              index
            ) ||
            !cart[index]
          ) {
            return;
          }


          cart.splice(
            index,
            1
          );


          saveCart(cart);

          renderCart();
        }
      );
    });


  updateTotals();
  updateCartCount();
}


// ===============================
// Quantity
// ===============================

function changeQuantity(
  index,
  delta
) {

  const cart =
    loadCart();


  const item =
    cart[index];


  if (!item) {
    return;
  }


  const product =
    getProductById(
      item.productId
    );


  if (!product) {
    renderCart();
    return;
  }


  const otherQuantity =
    getProductQuantity(
      cart,
      product.id,
      index
    );


  const max =
    Math.max(
      1,
      product.stock -
      otherQuantity
    );


  item.quantity =
    Math.min(
      max,
      Math.max(
        1,
        (Number(item.quantity) || 1) +
        delta
      )
    );


  saveCart(cart);

  renderCart();
}


// ===============================
// Totals
// ===============================

function updateTotals() {

  const cart =
    sanitizeCart(
      loadCart()
    );


  const subtotal =
    cart.reduce(
      (sum, item) => {

        const product =
          getProductById(
            item.productId
          );


        if (!product) {
          return sum;
        }


        return (
          sum +
          product.price *
          item.quantity
        );
      },
      0
    );


  /*
   * فعلاً ارسال را رایگان گذاشتیم.
   *
   * بعداً می‌توانیم بر اساس
   * شهر / روش ارسال / مبلغ سفارش
   * آن را تغییر دهیم.
   */

  const shipping = 0;


  /*
   * فعلاً مالیات را صفر گذاشتیم.
   *
   * چون برای فروشگاه ایران
   * نباید منطق مالیات 10٪ دلاری قبلی
   * را همین‌طوری نگه داریم.
   */

  const tax = 0;


  const discount =
    subtotal *
    discountRate;


  const total =
    Math.max(
      0,
      subtotal +
      shipping +
      tax -
      discount
    );


  subtotalAmount.textContent =
    formatPrice(
      subtotal
    );


  shippingAmount.textContent =
    shipping === 0
      ? "رایگان"
      : formatPrice(
        shipping
      );


  taxAmount.textContent =
    formatPrice(
      tax
    );


  discountAmount.textContent =
    `-${formatPrice(
      discount
    )}`;


  discountRow.hidden =
    discount === 0;


  totalAmount.textContent =
    formatPrice(
      total
    );
}


// ===============================
// Cart count
// ===============================

function updateCartCount() {

  const cart =
    sanitizeCart(
      loadCart()
    );


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


  if (cartPill) {

    cartPill.textContent =
      `CART (${totalItems})`;
  }
}


// ===============================
// Checkout
// ===============================

if (checkoutBtn) {

  checkoutBtn.addEventListener(
    "click",
    () => {

      const cart =
        sanitizeCart(
          loadCart()
        );


      if (cart.length === 0) {

        if (
          typeof showWarning ===
          "function"
        ) {
          showWarning(
            "Your cart is empty.",
            "⚠ Cart Empty"
          );
        }

        return;
      }


      if (
        typeof showInfo ===
        "function"
      ) {

        showInfo(
          "Checkout is not connected yet.",
          "ⓘ Checkout"
        );
      }
    }
  );
}


// ===============================
// Promo code
// ===============================

if (promoBtn) {

  promoBtn.addEventListener(
    "click",
    () => {

      const promoCode =
        promoInput.value
          .trim()
          .toUpperCase();


      if (!promoCode) {

        showInfo(
          "Please enter a promo code.",
          "ⓘ Code Required"
        );

        return;
      }


      /*
       * فعلاً برای تست frontend
       * این کد را نگه می‌داریم.
       *
       * بعداً باید promo_codes
       * را از Supabase بخوانیم.
       */

      if (
        promoCode ===
        "LEGEND20"
      ) {

        discountRate =
          0.20;


        promoInput.value =
          "";


        updateTotals();


        showSuccess(
          "20% discount applied.",
          "✓ Promo Applied"
        );


        return;
      }


      showError(
        "That promo code is not valid.",
        "✕ Invalid Code"
      );
    }
  );
}


// ===============================
// Initial load
// ===============================

async function initCart() {

  const loaded =
    await loadProducts();


  if (!loaded) {
    return;
  }


  renderCart();
}


initCart();