// پارامترهای URL صفحه محصول را می‌خواند.
const urlParams = new URLSearchParams(window.location.search);
// شناسه محصول را از URL به عدد تبدیل می‌کند.
const productId = Number.parseInt(urlParams.get("id"), 10);
// اگر شناسه معتبر باشد، محصول مربوطه را پیدا می‌کند.
const product = Number.isInteger(productId) ? getProductById(productId) : null;

// اگر محصول پیدا نشود، کاربر را به فروشگاه برمی‌گرداند.
if (!product) {
  window.location.replace("index-shop.html");
} else {
  // عناصر صفحه محصول را برای تغییر محتوای پویا پیدا می‌کند.
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

  // تصویر محصول را قرار می‌دهد و بارگذاری آن را سریع‌تر می‌کند.
  productImage.src = product.image;
  productImage.alt = product.name;
  productImage.loading = "eager";
  productImage.addEventListener("error", () => productImage.removeAttribute("src"), { once: true });

  // اطلاعات اصلی محصول را داخل صفحه می‌نویسد.
  productName.textContent = product.name;
  productBand.textContent = product.band || "";
  productBand.hidden = !product.band;
  productDescription.textContent = product.description;
  productType.textContent = product.type;
  productPrice.textContent = `$${product.price}`;

  // موجودی را نمایش می‌دهد و در صورت اتمام، دکمه خرید را غیرفعال می‌کند.
  if (product.stock > 0) {
    productStock.textContent = `${product.stock} IN STOCK`;
  } else {
    productStock.textContent = "OUT OF STOCK";
    addToCartBtn.disabled = true;
    addToCartBtn.textContent = "OUT OF STOCK";
  }

  // اگر سایز معتبر وجود نداشته باشد، One Size را به عنوان گزینه پیش‌فرض قرار می‌دهد.
  const sizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ["One Size"];
  // اگر فقط یک سایز باشد، همان سایز به صورت خودکار انتخاب می‌شود.
  let selectedSize = sizes.length === 1 ? sizes[0] : null;

  // برای هر سایز یک دکمه می‌سازد.
  sizes.forEach((size) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "size-btn";
    btn.textContent = size;
    // سایز انتخاب‌شده را از ابتدا فعال می‌کند.
    if (size === selectedSize) btn.classList.add("selected");

    // انتخاب سایز با کلیک را مدیریت می‌کند.
    btn.addEventListener("click", () => {
      // حالت انتخاب همه دکمه‌ها را پاک می‌کند.
      sizeOptions.querySelectorAll(".size-btn").forEach((item) => item.classList.remove("selected"));
      // دکمه فعلی را فعال می‌کند.
      btn.classList.add("selected");
      // سایز انتخاب‌شده را ذخیره می‌کند.
      selectedSize = size;
    });

    // دکمه سایز را به صفحه اضافه می‌کند.
    sizeOptions.appendChild(btn);
  });

  // حداکثر تعداد را با موجودی محصول هماهنگ می‌کند.
  qtyInput.max = String(Math.max(1, product.stock));
  qtyDecrease.type = "button";
  qtyIncrease.type = "button";

  // مقدار تعداد را بین حداقل یک و موجودی واقعی محدود می‌کند.
  function setQuantity(value) {
    const next = Number.parseInt(value, 10);
    qtyInput.value = String(Number.isFinite(next) ? Math.min(product.stock, Math.max(1, next)) : 1);
  }

  // دکمه کم کردن تعداد را فعال می‌کند.
  qtyDecrease.addEventListener("click", () => setQuantity(Number(qtyInput.value) - 1));
  // دکمه زیاد کردن تعداد را فعال می‌کند.
  qtyIncrease.addEventListener("click", () => setQuantity(Number(qtyInput.value) + 1));
  // تغییر مستقیم ورودی تعداد را کنترل می‌کند.
  qtyInput.addEventListener("change", () => setQuantity(qtyInput.value));

  // سبد ذخیره‌شده را از مرورگر می‌خواند.
  function readCart() {
    try {
      const cart = JSON.parse(localStorage.getItem("cart"));
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  }

  // سبد جدید را در مرورگر ذخیره می‌کند.
  function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  // تعداد یک محصول مشخص را در سبد جمع می‌کند.
  function getProductQuantity(cart, productId) {
    return cart.reduce((total, item) => {
      return item.productId === productId ? total + (Number(item.quantity) || 0) : total;
    }, 0);
  }

  // کلیک دکمه اضافه کردن به سبد را کنترل می‌کند.
  addToCartBtn.addEventListener("click", () => {
    // اگر موجودی صفر باشد، خرید انجام نمی‌شود.
    if (product.stock < 1) return;

    // تعداد واردشده را به محدوده موجودی محدود می‌کند.
    const quantity = Math.min(product.stock, Math.max(1, Number.parseInt(qtyInput.value, 10) || 1));
    // سبد فعلی را می‌خواند.
    const cart = readCart();
    // تعداد فعلی همین محصول را پیدا می‌کند.
    const currentQuantity = getProductQuantity(cart, product.id);

    // اگر مقدار جدید از موجودی عبور کند، هشدار می‌دهد.
    if (currentQuantity + quantity > product.stock) {
      showWarning("You cannot add more than the available stock.", "⚠ Stock Limit");
      return;
    }

    // آیتم مشابه با همان محصول و همان سایز را پیدا می‌کند.
    const existingItem = cart.find(
      (item) => item.productId === product.id && (item.size || null) === (selectedSize || null),
    );

    // اگر آیتم موجود باشد، تعداد و اطلاعاتش را به‌روزرسانی می‌کند.
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.name = product.name;
      existingItem.price = product.price;
      existingItem.image = product.image;
    } else {
      // اگر آیتم وجود نداشته باشد، یک آیتم جدید به سبد اضافه می‌کند.
      cart.push({
        productId: product.id,
        name: product.name,
        size: selectedSize,
        quantity,
        price: product.price,
        image: product.image,
      });
    }

    // سبد به‌روزشده را ذخیره می‌کند.
    saveCart(cart);
    // موفقیت اضافه شدن را اطلاع می‌دهد.
    showSuccess(`${quantity} × ${product.name} added to cart.`, "✓ Added to Cart");

    // متن قبلی دکمه را نگه می‌دارد.
    const originalText = addToCartBtn.textContent;
    addToCartBtn.textContent = "✓ ADDED TO CART";
    addToCartBtn.disabled = true;
    // بعد از مدت کوتاه دکمه را به حالت مناسب برمی‌گرداند.
    window.setTimeout(() => {
      addToCartBtn.textContent = originalText;
      addToCartBtn.disabled = getProductQuantity(readCart(), product.id) >= product.stock;
    }, 1500);

    // تعداد سبد در هدر را به‌روزرسانی می‌کند.
    updateCartCount();
  });

  // محصولات مرتبط را پیدا و نمایش می‌دهد.
  function renderRelatedProducts() {
    // اگر محصول گروه داشته باشد، ابتدا محصولات همان گروه را پیدا می‌کند.
    let relatedProducts = product.band
      ? products.filter((item) => item.band === product.band && item.id !== product.id)
      : [];

    // اگر کمتر از چهار محصول مرتبط وجود داشت، از همان دسته‌بندی کمک می‌گیرد.
    if (relatedProducts.length < 4) {
      const categoryProducts = products.filter(
        (item) => item.category === product.category && item.id !== product.id && !relatedProducts.includes(item),
      );
      relatedProducts = [...relatedProducts, ...categoryProducts];
    }

    // نمایش قبلی محصولات مرتبط را پاک می‌کند.
    relatedProductsGrid.innerHTML = "";

    // اگر محصول مرتبطی وجود نداشته باشد، پیام مناسب نشان می‌دهد.
    if (relatedProducts.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No related products";
      empty.style.cssText = "grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.5);";
      relatedProductsGrid.appendChild(empty);
      return;
    }

    // حداکثر چهار محصول مرتبط را نمایش می‌دهد.
    relatedProducts.slice(0, 4).forEach((relProduct) => {
      // کارت محصول مرتبط را می‌سازد.
      const card = document.createElement("article");
      card.className = "related-product-card";
      card.tabIndex = 0;
      card.setAttribute("role", "link");

      // تصویر محصول مرتبط را می‌سازد.
      const imageWrap = document.createElement("div");
      imageWrap.className = "related-image";
      const image = document.createElement("img");
      image.src = relProduct.image;
      image.alt = relProduct.name;
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("error", () => image.removeAttribute("src"), { once: true });
      imageWrap.appendChild(image);

      // اطلاعات محصول مرتبط را می‌سازد.
      const info = document.createElement("div");
      info.className = "related-info";
      const name = document.createElement("h3");
      name.className = "related-name";
      name.textContent = relProduct.name;
      const price = document.createElement("p");
      price.className = "related-price";
      price.textContent = `$${relProduct.price}`;
      info.append(name, price);

      // تصویر و اطلاعات را داخل کارت می‌گذارد.
      card.append(imageWrap, info);
      // تابع رفتن به صفحه جزئیات محصول مرتبط.
      const openDetail = () => {
        window.location.href = `product-detail.html?id=${encodeURIComponent(relProduct.id)}`;
      };
      // کلیک روی کارت را کنترل می‌کند.
      card.addEventListener("click", openDetail);
      // دسترسی به کارت با کیبورد را فعال می‌کند.
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail();
        }
      });
      // کارت را به شبکه محصولات مرتبط اضافه می‌کند.
      relatedProductsGrid.appendChild(card);
    });
  }

  // تعداد کالاهای سبد را در هدر نشان می‌دهد.
  function updateCartCount() {
    const cart = readCart();
    const totalItems = cart.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
    const cartPill = document.querySelector(".cart-pill");
    if (cartPill) cartPill.textContent = `CART (${totalItems})`;
  }

  // محصولات مرتبط را هنگام باز شدن صفحه می‌سازد.
  renderRelatedProducts();
  // تعداد اولیه سبد را نمایش می‌دهد.
  updateCartCount();
}
