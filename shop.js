// ظرف نمایش کارت‌های محصول را پیدا می‌کند.
const productsContainer = document.getElementById("products-container");
// همه دکمه‌های دسته‌بندی را پیدا می‌کند.
const categoryButtons = document.querySelectorAll(".category-btn");

// سبد ذخیره‌شده در مرورگر را می‌خواند.
function readCart() {
  try {
    // داده ذخیره‌شده را از localStorage می‌گیرد.
    const cart = JSON.parse(localStorage.getItem("cart"));
    // فقط آرایه معتبر را برمی‌گرداند.
    return Array.isArray(cart) ? cart : [];
  } catch {
    // در صورت خراب بودن داده، سبد خالی در نظر گرفته می‌شود.
    return [];
  }
}

// سبد را در مرورگر ذخیره می‌کند.
function saveCart(cart) {
  try {
    // آرایه سبد را به متن JSON تبدیل و ذخیره می‌کند.
    localStorage.setItem("cart", JSON.stringify(cart));
    return true;
  } catch {
    // اگر مرورگر اجازه ذخیره ندهد، خطا را به صورت false اعلام می‌کند.
    return false;
  }
}

// تعداد یک محصول مشخص را در سبد حساب می‌کند.
function getProductQuantity(cart, productId) {
  return cart.reduce((total, item) => {
    // اگر شناسه یکی باشد، تعداد آن محصول را به جمع اضافه می‌کند.
    return Number(item.productId) === productId ? total + (Number(item.quantity) || 0) : total;
  }, 0);
}

// نام گروه را برای مقایسه یکدست می‌کند.
function normalizeBand(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

// فیلترهای موجود در URL را می‌خواند.
function getRequestedFilters() {
  // پارامترهای Query String صفحه را می‌گیرد.
  const params = new URLSearchParams(window.location.search);
  return {
    // دسته‌بندی انتخاب‌شده یا all.
    category: params.get("category") || "all",
    // نام گروه را برای مقایسه نرمال می‌کند.
    band: normalizeBand(params.get("band")),
  };
}

// محصولات را بر اساس دسته و گروه فیلتر می‌کند.
function filterProducts(category, band) {
  return products.filter((product) => {
    // بررسی می‌کند محصول در دسته انتخاب‌شده باشد.
    const categoryMatch = category === "all" || product.category === category;
    // بررسی می‌کند محصول به گروه انتخاب‌شده مربوط باشد.
    const bandMatch = !band || normalizeBand(product.band) === band;
    // فقط محصولاتی که هر دو شرط را دارند نگه می‌دارد.
    return categoryMatch && bandMatch;
  });
}

// کارت‌های محصولات فیلترشده را روی صفحه می‌سازد.
function renderProducts(productsToRender) {
  // نمایش قبلی محصولات را پاک می‌کند.
  productsContainer.innerHTML = "";

  // برای ساخت چند کارت بدون رندرهای اضافه، Fragment می‌سازد.
  const fragment = document.createDocumentFragment();

  // برای هر محصول یک کارت ایجاد می‌کند.
  productsToRender.forEach((product) => {
    // عنصر اصلی کارت را می‌سازد.
    const card = document.createElement("article");
    card.className = "product-card";
    // کارت را قابل انتخاب با کیبورد می‌کند.
    card.tabIndex = 0;
    card.setAttribute("role", "link");

    // ظرف تصویر محصول را می‌سازد.
    const imageWrap = document.createElement("div");
    imageWrap.className = "product-image";
    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.name;
    image.loading = "lazy";
    image.decoding = "async";
    // اگر تصویر خراب شد، منبع آن را حذف می‌کند.
    image.addEventListener("error", () => image.removeAttribute("src"), { once: true });
    imageWrap.appendChild(image);

    // ظرف اطلاعات محصول را می‌سازد.
    const info = document.createElement("div");
    info.className = "product-info";

    // نام گروه مرتبط با محصول را می‌سازد.
    const band = document.createElement("p");
    band.className = "product-band";
    band.textContent = product.band || "";

    // نام محصول را می‌سازد.
    const name = document.createElement("h2");
    name.className = "product-name";
    name.textContent = product.name;

    // نوع محصول را می‌سازد.
    const type = document.createElement("p");
    type.className = "product-type";
    type.textContent = product.type;

    // بخش پایینی کارت را می‌سازد.
    const bottom = document.createElement("div");
    bottom.className = "product-bottom";

    // قیمت محصول را می‌سازد.
    const price = document.createElement("span");
    price.className = "product-price";
    price.textContent = `$${product.price}`;

    // دکمه اضافه کردن به سبد را می‌سازد.
    const addCartBtn = document.createElement("button");
    addCartBtn.type = "button";
    addCartBtn.className = "add-cart";
    addCartBtn.textContent = product.stock > 0 ? "ADD TO CART" : "OUT OF STOCK";
    addCartBtn.disabled = product.stock <= 0;

    // قیمت و دکمه را داخل بخش پایین قرار می‌دهد.
    bottom.append(price, addCartBtn);
    // اطلاعات محصول را کنار هم می‌گذارد.
    info.append(band, name, type, bottom);
    // تصویر و اطلاعات را داخل کارت قرار می‌دهد.
    card.append(imageWrap, info);

    // رفتن به صفحه جزئیات همین محصول را آماده می‌کند.
    const openDetail = () => {
      window.location.href = `product-detail.html?id=${encodeURIComponent(product.id)}`;
    };

    // کلیک روی کارت را کنترل می‌کند، مگر اینکه روی دکمه سبد کلیک شده باشد.
    card.addEventListener("click", (event) => {
      if (!event.target.closest(".add-cart")) openDetail();
    });

    // فعال‌سازی کارت با Enter یا Space برای کیبورد.
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDetail();
      }
    });

    // کلیک دکمه Add to Cart را کنترل می‌کند.
    addCartBtn.addEventListener("click", (event) => {
      // جلوی کلیک کارت را می‌گیرد تا صفحه جزئیات باز نشود.
      event.stopPropagation();

      // سبد فعلی را می‌خواند.
      const cart = readCart();
      // تعداد فعلی محصول را پیدا می‌کند.
      const currentQuantity = getProductQuantity(cart, product.id);

      // اگر موجودی کامل مصرف شده باشد، پیام هشدار می‌دهد.
      if (currentQuantity >= product.stock) {
        showWarning("This product is already at its stock limit.", "⚠ Stock Limit");
        return;
      }

      // آیتم موجودی را پیدا می‌کند که سایز مشخصی ندارد.
      const existingItem = cart.find(
        (item) => Number(item.productId) === product.id && !item.size,
      );

      // اگر آیتم از قبل وجود داشته باشد، تعداد آن را افزایش می‌دهد.
      if (existingItem) {
        existingItem.quantity = Math.min(product.stock, Number(existingItem.quantity) + 1);
      } else {
        // در غیر این صورت آیتم جدید را به سبد اضافه می‌کند.
        cart.push({
          productId: product.id,
          name: product.name,
          quantity: 1,
          price: product.price,
          image: product.image,
        });
      }

      // اگر ذخیره‌سازی سبد شکست خورد، پیام خطا نشان می‌دهد.
      if (!saveCart(cart)) {
        showError("Your cart could not be saved in this browser.", "Cart Error");
        return;
      }

      // موفقیت اضافه شدن محصول را اطلاع می‌دهد.
      showSuccess(`${product.name} added to cart.`, "✓ Added to Cart");
      // تعداد سبد را به‌روزرسانی می‌کند.
      updateCartCount();

      // متن اصلی دکمه را نگه می‌دارد تا بعداً برگردانده شود.
      const originalText = addCartBtn.textContent;
      addCartBtn.textContent = "✓ ADDED";
      addCartBtn.disabled = true;
      // بعد از مدت کوتاه، دکمه را به حالت قبلی برمی‌گرداند.
      window.setTimeout(() => {
        addCartBtn.textContent = originalText;
        addCartBtn.disabled = getProductQuantity(readCart(), product.id) >= product.stock;
      }, 1500);
    });

    // کارت ساخته‌شده را به Fragment اضافه می‌کند.
    fragment.appendChild(card);
  });

  // همه کارت‌ها را یک‌جا به صفحه اضافه می‌کند.
  productsContainer.appendChild(fragment);
}

// فیلترهای URL را خوانده و محصولات مناسب را نمایش می‌دهد.
function applyFiltersFromUrl() {
  // دسته و گروه درخواست‌شده را از URL می‌گیرد.
  const { category, band } = getRequestedFilters();
  // دکمه‌ای که دسته فعلی را نشان می‌دهد پیدا می‌کند.
  const selectedButton = [...categoryButtons].find(
    (button) => button.dataset.category === category,
  );

  // حالت فعال همه دکمه‌ها را پاک می‌کند.
  categoryButtons.forEach((button) => button.classList.remove("active"));
  // دکمه مناسب را فعال می‌کند.
  (selectedButton || categoryButtons[0])?.classList.add("active");
  // محصولات فیلترشده را نمایش می‌دهد.
  renderProducts(filterProducts(category === "all" || selectedButton ? category : "all", band));
}

// برای هر دکمه دسته‌بندی رویداد کلیک ثبت می‌کند.
categoryButtons.forEach((button) => {
  // نوع دکمه را صریحاً button قرار می‌دهد.
  button.type = "button";
  button.addEventListener("click", () => {
    // دسته انتخاب‌شده را می‌گیرد.
    const selectedCategory = button.dataset.category;
    // حالت فعال قبلی را پاک می‌کند.
    categoryButtons.forEach((btn) => btn.classList.remove("active"));
    // دکمه انتخاب‌شده را فعال می‌کند.
    button.classList.add("active");

    // URL فعلی را برای به‌روزرسانی فیلترها می‌سازد.
    const url = new URL(window.location.href);
    if (selectedCategory === "all") {
      // برای حالت all پارامتر دسته را حذف می‌کند.
      url.searchParams.delete("category");
    } else {
      // برای دسته دیگر مقدار جدید را در URL قرار می‌دهد.
      url.searchParams.set("category", selectedCategory);
    }
    // URL را بدون Reload صفحه به‌روزرسانی می‌کند.
    window.history.replaceState({}, "", url);

    // گروه انتخاب‌شده را از URL می‌گیرد.
    const band = normalizeBand(url.searchParams.get("band"));
    // محصولات را با دسته و گروه فعلی دوباره فیلتر می‌کند.
    renderProducts(filterProducts(selectedCategory, band));
  });
});

// تعداد کالاهای سبد را در هدر نشان می‌دهد.
function updateCartCount() {
  // سبد فعلی را می‌خواند.
  const cart = readCart();
  // تعداد تمام واحدهای موجود در سبد را جمع می‌کند.
  const totalItems = cart.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
  // دکمه سبد را پیدا می‌کند.
  const cartPill = document.querySelector(".cart-pill");
  // اگر دکمه وجود داشت، تعداد را داخل آن نمایش می‌دهد.
  if (cartPill) cartPill.textContent = `CART (${totalItems})`;
}

// تغییرات سبد از تب یا صفحه دیگری را دنبال می‌کند.
window.addEventListener("storage", (event) => {
  // فقط تغییرات کلید cart باعث به‌روزرسانی می‌شوند.
  if (event.key === "cart") updateCartCount();
});

// فیلترهای اولیه URL را اعمال می‌کند.
applyFiltersFromUrl();
// تعداد اولیه سبد را نمایش می‌دهد.
updateCartCount();
