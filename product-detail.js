import { supabase } from "./js/supabase.js";


// ========================================
// Get product ID from URL
// ========================================

const urlParams =
  new URLSearchParams(window.location.search);

const productId =
  Number.parseInt(
    urlParams.get("id"),
    10
  );


// ========================================
// DOM elements
// ========================================

const productImage =
  document.getElementById("productImage");

const productName =
  document.getElementById("productName");

const productBand =
  document.getElementById("productBand");

const productDescription =
  document.getElementById("productDescription");

const productType =
  document.getElementById("productType");

const productPrice =
  document.getElementById("productPrice");

const productStock =
  document.getElementById("productStock");

const sizeOptions =
  document.getElementById("sizeOptions");

const qtyDecrease =
  document.getElementById("qtyDecrease");

const qtyIncrease =
  document.getElementById("qtyIncrease");

const qtyInput =
  document.getElementById("qtyInput");

const addToCartBtn =
  document.getElementById("addToCartBtn");

const relatedProductsGrid =
  document.getElementById(
    "relatedProductsGrid"
  );


// ========================================
// Helpers
// ========================================

function formatPrice(value) {

  return `${Number(value || 0).toLocaleString("fa-IR")} تومان`;
}


function readCart() {

  try {

    const cart =
      JSON.parse(
        localStorage.getItem("cart")
      );

    return Array.isArray(cart)
      ? cart
      : [];

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


function getCartQuantity(
  cart,
  productId
) {

  return cart.reduce(
    (total, item) => {

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


function updateCartCount() {

  const cart =
    readCart();

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
    document.querySelector(
      ".cart-pill"
    );

  if (cartPill) {

    cartPill.textContent =
      `CART (${totalItems})`;
  }
}


// ========================================
// Load product from Supabase
// ========================================

async function loadProduct() {

  if (
    !Number.isInteger(productId)
  ) {

    window.location.replace(
      "index-shop.html"
    );

    return;
  }


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
                id,
                name,
                slug
            ),

            product_variants (
                id,
                size,
                sku,
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
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();


  if (error) {

    console.error(
      "Error loading product:",
      error
    );

    showError(
      "Failed to load product.",
      "Product Error"
    );

    return;
  }


  if (!data) {

    window.location.replace(
      "index-shop.html"
    );

    return;
  }


  // ====================================
  // Normalize product data
  // ====================================

  const variants =
    Array.isArray(
      data.product_variants
    )
      ? data.product_variants
      : [];


  const images =
    Array.isArray(
      data.product_images
    )
      ? data.product_images
      : [];


  // Sort images
  images.sort(
    (a, b) =>
      (a.sort_order || 0) -
      (b.sort_order || 0)
  );


  // Primary image
  const primaryImage =
    images.find(
      image =>
        image.is_primary
    ) ||
    images[0] ||
    null;


  // Total stock
  const stock =
    variants.reduce(
      (total, variant) =>
        total +
        Number(
          variant.stock || 0
        ),
      0
    );


  // Price
  const price =
    variants[0]?.price != null
      ? Number(
        variants[0].price
      )
      : Number(
        data.price || 0
      );


  const product = {

    id: data.id,

    name: data.name,

    slug: data.slug,

    description:
      data.description || "",

    type:
      data.type || "",

    material:
      data.material || "",

    category:
      data.categories?.slug || "",

    categoryName:
      data.categories?.name || "",

    price,

    stock,

    variants,

    images,

    image:
      primaryImage?.storage_path || "",

    imageAlt:
      primaryImage?.alt_text ||
      data.name
  };


  console.log(
    "PRODUCT FROM SUPABASE:",
    product
  );


  renderProduct(
    product
  );


  await loadRelatedProducts(
    product
  );


  updateCartCount();
}


// ========================================
// Render product
// ========================================

function renderProduct(product) {

  // ====================================
  // Main image
  // ====================================

  if (
    productImage
  ) {

    if (product.image) {

      productImage.src =
        product.image;

      productImage.alt =
        product.imageAlt;

    } else {

      productImage.removeAttribute(
        "src"
      );

      productImage.alt =
        product.name;
    }


    productImage.loading =
      "eager";

    productImage.decoding =
      "async";


    productImage.addEventListener(
      "error",
      () => {

        productImage.removeAttribute(
          "src"
        );

      },
      {
        once: true
      }
    );
  }


  // ====================================
  // Basic information
  // ====================================

  if (productName) {

    productName.textContent =
      product.name;
  }


  if (productBand) {

    /*
     * فعلاً band در دیتابیس ما نداریم.
     * به جای آن category را نمایش می‌دهیم.
     */

    productBand.textContent =
      product.categoryName ||
      "";

    productBand.hidden =
      !product.categoryName;
  }


  if (productDescription) {

    productDescription.textContent =
      product.description;
  }


  if (productType) {

    productType.textContent =
      product.type;
  }


  if (productPrice) {

    productPrice.textContent =
      formatPrice(
        product.price
      );
  }


  // ====================================
  // Stock
  // ====================================

  if (productStock) {

    if (product.stock > 0) {

      productStock.textContent =
        `${product.stock} IN STOCK`;

    } else {

      productStock.textContent =
        "OUT OF STOCK";
    }
  }


  // ====================================
  // Size / Variants
  // ====================================

  renderVariants(
    product
  );


  // ====================================
  // Quantity
  // ====================================

  setupQuantity(
    product
  );


  // ====================================
  // Add to cart
  // ====================================

  setupAddToCart(
    product
  );
}


// ========================================
// Render variants / sizes
// ========================================

function renderVariants(product) {

  if (!sizeOptions) {
    return;
  }


  sizeOptions.innerHTML =
    "";


  const variants =
    product.variants
      .filter(
        variant =>
          variant.stock > 0
      );


  // No variants
  if (!variants.length) {

    const empty =
      document.createElement(
        "p"
      );

    empty.textContent =
      "One Size";

    sizeOptions.appendChild(
      empty
    );

    return;
  }


  let selectedSize =
    variants.length === 1
      ? variants[0].size
      : null;


  variants.forEach(
    variant => {

      const btn =
        document.createElement(
          "button"
        );


      btn.type =
        "button";


      btn.className =
        "size-btn";


      btn.textContent =
        variant.size ||
        "One Size";


      if (
        variant.size ===
        selectedSize
      ) {

        btn.classList.add(
          "selected"
        );
      }


      btn.addEventListener(
        "click",
        () => {

          sizeOptions
            .querySelectorAll(
              ".size-btn"
            )
            .forEach(
              item =>
                item.classList
                  .remove(
                    "selected"
                  )
            );


          btn.classList.add(
            "selected"
          );


          selectedSize =
            variant.size;
        }
      );


      sizeOptions.appendChild(
        btn
      );
    }
  );


  /*
   * selectedSize را روی عنصر ذخیره می‌کنیم
   * تا setupAddToCart بتواند آن را بخواند.
   */

  sizeOptions.dataset.selectedSize =
    selectedSize || "";
}


// ========================================
// Quantity controls
// ========================================

function setupQuantity(product) {

  if (
    !qtyInput ||
    !qtyDecrease ||
    !qtyIncrease
  ) {
    return;
  }


  qtyInput.type =
    "number";

  qtyInput.min =
    "1";

  qtyInput.max =
    String(
      Math.max(
        1,
        product.stock
      )
    );


  qtyDecrease.type =
    "button";

  qtyIncrease.type =
    "button";


  function setQuantity(value) {

    const next =
      Number.parseInt(
        value,
        10
      );


    const quantity =
      Number.isFinite(next)
        ? Math.min(
          product.stock,
          Math.max(
            1,
            next
          )
        )
        : 1;


    qtyInput.value =
      String(quantity);
  }


  qtyDecrease.onclick =
    () => {

      setQuantity(
        Number(
          qtyInput.value
        ) - 1
      );
    };


  qtyIncrease.onclick =
    () => {

      setQuantity(
        Number(
          qtyInput.value
        ) + 1
      );
    };


  qtyInput.onchange =
    () => {

      setQuantity(
        qtyInput.value
      );
    };
}


// ========================================
// Add to cart
// ========================================

function setupAddToCart(product) {

  if (!addToCartBtn) {
    return;
  }


  if (product.stock <= 0) {

    addToCartBtn.disabled =
      true;

    addToCartBtn.textContent =
      "OUT OF STOCK";

    return;
  }


  addToCartBtn.addEventListener(
    "click",
    () => {

      const quantity =
        Math.min(
          product.stock,
          Math.max(
            1,
            Number.parseInt(
              qtyInput?.value,
              10
            ) || 1
          )
        );


      const cart =
        readCart();


      const currentQuantity =
        getCartQuantity(
          cart,
          product.id
        );


      if (
        currentQuantity +
        quantity >
        product.stock
      ) {

        if (
          typeof showWarning ===
          "function"
        ) {

          showWarning(
            "You cannot add more than the available stock.",
            "⚠ Stock Limit"
          );
        }

        return;
      }


      // Selected size
      const selectedSize =
        sizeOptions?.dataset
          .selectedSize ||
        null;


      // Find existing item
      const existingItem =
        cart.find(
          item =>

            String(
              item.productId
            ) ===
            String(
              product.id
            ) &&

            (item.size || null) ===
            selectedSize
        );


      if (existingItem) {

        existingItem.quantity +=
          quantity;

        existingItem.name =
          product.name;

        existingItem.price =
          product.price;

        existingItem.image =
          product.image || "";

      } else {

        cart.push({

          productId:
            product.id,

          name:
            product.name,

          size:
            selectedSize,

          quantity,

          price:
            product.price,

          image:
            product.image || ""
        });
      }


      saveCart(
        cart
      );


      if (
        typeof showSuccess ===
        "function"
      ) {

        showSuccess(
          `${quantity} × ${product.name} added to cart.`,
          "✓ Added to Cart"
        );
      }


      const originalText =
        addToCartBtn.textContent;


      addToCartBtn.textContent =
        "✓ ADDED TO CART";


      addToCartBtn.disabled =
        true;


      window.setTimeout(
        () => {

          addToCartBtn.textContent =
            originalText;


          addToCartBtn.disabled =
            getCartQuantity(
              readCart(),
              product.id
            ) >=
            product.stock;

        },
        1500
      );


      updateCartCount();
    }
  );
}


// ========================================
// Related products
// ========================================

async function loadRelatedProducts(
  product
) {

  if (!relatedProductsGrid) {
    return;
  }


  /*
   * فعلاً محصولات مرتبط را
   * بر اساس category می‌گیریم.
   */

  const {
    data,
    error
  } = await supabase
    .from("products")
    .select(`
            id,
            name,
            price,
            type,
            categories (
                name,
                slug
            ),
            product_variants (
                stock,
                price
            ),
            product_images (
                image_url,
                alt_text,
                is_primary,
                sort_order
            )
        `)
    .eq(
      "is_active",
      true
    )
    .eq(
      "categories.slug",
      product.category
    )
    .neq(
      "id",
      product.id
    )
    .limit(4);


  if (error) {

    console.error(
      "Error loading related products:",
      error
    );

    return;
  }


  const relatedProducts =
    (data || []).map(
      item => {

        const variants =
          Array.isArray(
            item.product_variants
          )
            ? item.product_variants
            : [];


        const images =
          Array.isArray(
            item.product_images
          )
            ? item.product_images
            : [];


        images.sort(
          (a, b) =>
            (a.sort_order || 0) -
            (b.sort_order || 0)
        );


        const primaryImage =
          images.find(
            image =>
              image.is_primary
          ) ||
          images[0] ||
          null;


        const stock =
          variants.reduce(
            (total, variant) =>
              total +
              Number(
                variant.stock ||
                0
              ),
            0
          );


        const price =
          variants[0]?.price != null
            ? Number(
              variants[0].price
            )
            : Number(
              item.price || 0
            );


        return {

          id:
            item.id,

          name:
            item.name,

          type:
            item.type || "",

          category:
            item.categories?.slug ||
            "",

          price,

          stock,

          image:
            primaryImage?.storage_path ||
            "",

          imageAlt:
            primaryImage?.alt_text ||
            item.name
        };
      }
    );


  renderRelatedProducts(
    relatedProducts
  );
}


// ========================================
// Render related products
// ========================================

function renderRelatedProducts(
  relatedProducts
) {

  relatedProductsGrid.innerHTML =
    "";


  if (
    relatedProducts.length ===
    0
  ) {

    const empty =
      document.createElement(
        "p"
      );


    empty.textContent =
      "No related products";


    empty.style.cssText =
      "grid-column:1/-1;text-align:center;color:rgba(255,255,255,0.5);";


    relatedProductsGrid.appendChild(
      empty
    );


    return;
  }


  relatedProducts.forEach(
    relProduct => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "related-product-card";


      card.tabIndex =
        0;


      card.setAttribute(
        "role",
        "link"
      );


      // Image

      const imageWrap =
        document.createElement(
          "div"
        );


      imageWrap.className =
        "related-image";


      if (
        relProduct.image
      ) {

        const image =
          document.createElement(
            "img"
          );


        image.src =
          relProduct.image;


        image.alt =
          relProduct.imageAlt;


        image.loading =
          "lazy";


        image.decoding =
          "async";


        image.addEventListener(
          "error",
          () => {

            image.removeAttribute(
              "src"
            );

          },
          {
            once: true
          }
        );


        imageWrap.appendChild(
          image
        );
      }


      // Info

      const info =
        document.createElement(
          "div"
        );


      info.className =
        "related-info";


      const name =
        document.createElement(
          "h3"
        );


      name.className =
        "related-name";


      name.textContent =
        relProduct.name;


      const price =
        document.createElement(
          "p"
        );


      price.className =
        "related-price";


      price.textContent =
        formatPrice(
          relProduct.price
        );


      info.append(
        name,
        price
      );


      card.append(
        imageWrap,
        info
      );


      // Open product

      const openDetail =
        () => {

          window.location.href =
            `product-detail.html?id=${encodeURIComponent(
              relProduct.id
            )}`;
        };


      card.addEventListener(
        "click",
        openDetail
      );


      card.addEventListener(
        "keydown",
        event => {

          if (
            event.key ===
            "Enter" ||
            event.key ===
            " "
          ) {

            event.preventDefault();

            openDetail();
          }
        }
      );


      relatedProductsGrid.appendChild(
        card
      );
    }
  );
}


// ========================================
// Start
// ========================================

updateCartCount();

loadProduct();