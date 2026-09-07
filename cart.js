// ظرف نمایش آیتم‌های سبد را پیدا می‌کند.
const cartItemsContainer = document.getElementById("cartItemsContainer");
// پیام مربوط به خالی بودن سبد را پیدا می‌کند.
const emptyCartMessage = document.getElementById("emptyCartMessage");
// محل نمایش مبلغ کالاها را پیدا می‌کند.
const subtotalAmount = document.getElementById("subtotalAmount");
// محل نمایش هزینه ارسال را پیدا می‌کند.
const shippingAmount = document.getElementById("shippingAmount");
// محل نمایش مالیات را پیدا می‌کند.
const taxAmount = document.getElementById("taxAmount");
// ردیف تخفیف را پیدا می‌کند.
const discountRow = document.getElementById("discountRow");
// محل نمایش مبلغ تخفیف را پیدا می‌کند.
const discountAmount = document.getElementById("discountAmount");
// محل نمایش مبلغ نهایی را پیدا می‌کند.
const totalAmount = document.getElementById("totalAmount");
// دکمه رفتن به مرحله پرداخت را پیدا می‌کند.
const checkoutBtn = document.getElementById("checkoutBtn");
// ورودی کد تخفیف را پیدا می‌کند.
const promoInput = document.getElementById("promoInput");
// دکمه اعمال کد تخفیف را پیدا می‌کند.
const promoBtn = document.getElementById("promoBtn");
// دکمه سبد خرید داخل هدر را پیدا می‌کند.
const cartPill = document.querySelector(".cart-pill");

// درصد تخفیف فعال در سفارش را نگه می‌دارد.
let discountRate = 0;

// سبد ذخیره‌شده در مرورگر را می‌خواند.
function loadCart() {
  try {
    // متن ذخیره‌شده در localStorage را به داده JavaScript تبدیل می‌کند.
    const cart = JSON.parse(localStorage.getItem("cart"));
    // فقط آرایه معتبر را قبول می‌کند و در غیر این صورت سبد خالی می‌دهد.
    return Array.isArray(cart) ? cart : [];
  } catch {
    // اگر داده خراب باشد، به جای متوقف کردن صفحه سبد خالی برمی‌گرداند.
    return [];
  }
}

// سبد فعلی را در localStorage ذخیره می‌کند.
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// موجودی واقعی یک محصول را از دیتابیس محصولات می‌گیرد.
function getProductStock(productId) {
  // محصول را با شناسه پیدا می‌کند.
  const product = getProductById(productId);
  // اگر محصول وجود داشت موجودی عددی آن را می‌دهد، وگرنه صفر.
  return product ? Number(product.stock) || 0 : 0;
}

// تعداد فعلی یک محصول را در آیتم‌های دیگر سبد جمع می‌کند.
function getProductQuantityInCart(cart, productId, exceptIndex = -1) {
  return cart.reduce((total, item, index) => {
    // آیتم موردنظر یا آیتمی با شناسه متفاوت در این جمع حساب نمی‌شود.
    if (index === exceptIndex || item.productId !== productId) return total;
    // تعداد معتبر آیتم را به جمع اضافه می‌کند.
    return total + Math.max(0, Number(item.quantity) || 0);
  }, 0);
}

// داده‌های سبد را پاک‌سازی و با موجودی واقعی هماهنگ می‌کند.
function sanitizeCart(cart) {
  // سبد جدید و معتبر را آماده می‌کند.
  const cleanCart = [];

  // تک‌تک آیتم‌های ذخیره‌شده را بررسی می‌کند.
  cart.forEach((item) => {
    // محصول اصلی را با شناسه ذخیره‌شده پیدا می‌کند.
    const product = getProductById(Number(item.productId));
    // اگر محصول حذف شده باشد، آیتم آن وارد سبد تمیز نمی‌شود.
    if (!product) return;

    // تعداد را به عدد صحیح تبدیل می‌کند.
    const quantity = Math.floor(Number(item.quantity));
    // تعداد نامعتبر یا کمتر از یک کنار گذاشته می‌شود.
    if (!Number.isFinite(quantity) || quantity < 1) return;

    // موجودی واقعی محصول را می‌گیرد.
    const stock = getProductStock(product.id);
    // تعداد همین محصول که قبلاً در سبد تمیز قرار گرفته را حساب می‌کند.
    const used = getProductQuantityInCart(cleanCart, product.id);
    // مقدار قابل استفاده بعد از در نظر گرفتن موجودی را محاسبه می‌کند.
    const available = Math.max(0, stock - used);
    // اگر موجودی باقی نمانده باشد، آیتم حذف می‌شود.
    if (available < 1) return;

    // نسخه معتبر و هماهنگ‌شده آیتم را به سبد اضافه می‌کند.
    cleanCart.push({
      productId: product.id,
      name: product.name,
      size: item.size || null,
      quantity: Math.min(quantity, available),
      price: product.price,
      image: product.image,
    });
  });

  // سبد پاک‌سازی‌شده را برمی‌گرداند.
  return cleanCart;
}

// تمام بخش‌های ظاهری سبد خرید را دوباره می‌سازد.
function renderCart() {
  // ابتدا سبد را پاک‌سازی می‌کند.
  let cart = sanitizeCart(loadCart());
  // نسخه تمیز را دوباره ذخیره می‌کند تا داده خراب باقی نماند.
  saveCart(cart);
  // محتوای قبلی نمایش سبد را پاک می‌کند.
  cartItemsContainer.innerHTML = "";

  // مشخص می‌کند سبد خالی است یا نه.
  const isEmpty = cart.length === 0;
  // پیام سبد خالی را فقط در حالت لازم نشان می‌دهد.
  emptyCartMessage.hidden = !isEmpty;
  // دکمه Checkout را در حالت خالی غیرفعال می‌کند.
  checkoutBtn.disabled = isEmpty;

  // اگر سبد خالی باشد، فقط مبلغ‌ها و تعداد سبد را به‌روزرسانی می‌کند.
  if (isEmpty) {
    updateTotals();
    updateCartCount();
    return;
  }

  // برای هر آیتم معتبر یک کارت سبد می‌سازد.
  cart.forEach((item, index) => {
    // اطلاعات محصول اصلی را پیدا می‌کند.
    const product = getProductById(item.productId);
    // قیمت کل همین آیتم را حساب می‌کند.
    const itemTotal = product.price * item.quantity;
    // موجودی محصول را می‌گیرد.
    const stock = getProductStock(product.id);
    // تعداد همین محصول در آیتم‌های دیگر سبد را حساب می‌کند.
    const otherQuantity = getProductQuantityInCart(cart, product.id, index);
    // مشخص می‌کند افزایش تعداد هنوز ممکن است یا نه.
    const canIncrease = otherQuantity + item.quantity < stock;

    // عنصر اصلی کارت آیتم را می‌سازد.
    const itemDiv = document.createElement("article");
    itemDiv.className = "cart-item";

    // ظرف تصویر محصول را می‌سازد.
    const imageWrap = document.createElement("div");
    imageWrap.className = "item-image";
    // خود تصویر محصول را می‌سازد.
    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.name;
    image.loading = "lazy";
    image.decoding = "async";
    // اگر تصویر خراب باشد، منبع آن را حذف می‌کند.
    image.addEventListener("error", () => image.removeAttribute("src"), { once: true });
    imageWrap.appendChild(image);

    // ظرف اطلاعات محصول را می‌سازد.
    const details = document.createElement("div");
    details.className = "item-details";
    // نام محصول را می‌سازد.
    const name = document.createElement("h3");
    name.className = "item-name";
    name.textContent = product.name;
    // ظرف اطلاعات جزئی مثل سایز و قیمت را می‌سازد.
    const meta = document.createElement("div");
    meta.className = "item-meta";

    // اگر محصول سایز داشته باشد، ردیف سایز را اضافه می‌کند.
    if (item.size) {
      const sizeRow = document.createElement("div");
      sizeRow.className = "item-meta-row";
      sizeRow.innerHTML = '<span class="item-meta-label">Size:</span>';
      const sizeValue = document.createElement("span");
      sizeValue.className = "item-meta-value";
      sizeValue.textContent = item.size;
      sizeRow.appendChild(sizeValue);
      meta.appendChild(sizeRow);
    }

    // ردیف قیمت را می‌سازد.
    const priceRow = document.createElement("div");
    priceRow.className = "item-meta-row";
    priceRow.innerHTML = '<span class="item-meta-label">Price:</span>';
    const priceValue = document.createElement("span");
    priceValue.className = "item-price";
    priceValue.textContent = `$${product.price}`;
    priceRow.appendChild(priceValue);
    meta.appendChild(priceRow);

    // نام و اطلاعات محصول را کنار هم قرار می‌دهد.
    details.append(name, meta);

    // بخش عملیات و قیمت کل آیتم را می‌سازد.
    const actions = document.createElement("div");
    actions.className = "item-actions";
    // مبلغ کل همین ردیف را نمایش می‌دهد.
    const total = document.createElement("div");
    total.className = "item-total";
    total.textContent = `$${itemTotal.toFixed(2)}`;

    // ظرف کنترل تعداد را می‌سازد.
    const controls = document.createElement("div");
    controls.className = "item-controls";
    const qtyControl = document.createElement("div");
    qtyControl.className = "qty-control";

    // دکمه کم کردن تعداد را می‌سازد.
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.className = "qty-decrease";
    decrease.dataset.index = index;
    decrease.textContent = "−";
    decrease.setAttribute("aria-label", `Decrease ${product.name} quantity`);

    // ورودی عددی تعداد را می‌سازد.
    const input = document.createElement("input");
    input.type = "number";
    input.className = "qty-input";
    input.dataset.index = index;
    input.value = item.quantity;
    input.min = "1";
    input.max = String(Math.max(1, stock - otherQuantity));
    input.inputMode = "numeric";
    input.setAttribute("aria-label", `${product.name} quantity`);

    // دکمه زیاد کردن تعداد را می‌سازد.
    const increase = document.createElement("button");
    increase.type = "button";
    increase.className = "qty-increase";
    increase.dataset.index = index;
    increase.textContent = "+";
    increase.disabled = !canIncrease;
    increase.setAttribute("aria-label", `Increase ${product.name} quantity`);

    // سه کنترل تعداد را کنار هم قرار می‌دهد.
    qtyControl.append(decrease, input, increase);

    // دکمه حذف آیتم را می‌سازد.
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-btn";
    remove.dataset.index = index;
    remove.textContent = "REMOVE";

    // کنترل تعداد و حذف را کنار هم قرار می‌دهد.
    controls.append(qtyControl, remove);
    // قیمت کل و کنترل‌ها را به بخش عملیات اضافه می‌کند.
    actions.append(total, controls);
    // سه بخش تصویر، اطلاعات و عملیات را داخل کارت قرار می‌دهد.
    itemDiv.append(imageWrap, details, actions);
    // کارت ساخته‌شده را به سبد اضافه می‌کند.
    cartItemsContainer.appendChild(itemDiv);
  });

  // برای همه دکمه‌های کم کردن رویداد کلیک می‌گذارد.
  document.querySelectorAll(".qty-decrease").forEach((button) => {
    button.addEventListener("click", () => changeQuantity(Number(button.dataset.index), -1));
  });

  // برای همه دکمه‌های زیاد کردن رویداد کلیک می‌گذارد.
  document.querySelectorAll(".qty-increase").forEach((button) => {
    button.addEventListener("click", () => changeQuantity(Number(button.dataset.index), 1));
  });

  // تغییر مستقیم مقدار داخل input را کنترل می‌کند.
  document.querySelectorAll(".qty-input").forEach((input) => {
    input.addEventListener("change", () => {
      // شماره آیتم تغییرکرده را از data attribute می‌گیرد.
      const index = Number(input.dataset.index);
      // سبد فعلی را می‌خواند.
      const cart = loadCart();
      // آیتم مربوط به ورودی را پیدا می‌کند.
      const item = cart[index];
      // محصول اصلی را پیدا می‌کند.
      const product = item ? getProductById(Number(item.productId)) : null;
      // اگر محصول دیگر وجود نداشته باشد، سبد را دوباره می‌سازد.
      if (!product) return renderCart();

      // مقدار واردشده را به عدد صحیح تبدیل می‌کند.
      const requested = Math.floor(Number(input.value));
      // تعداد همین محصول در آیتم‌های دیگر را حساب می‌کند.
      const otherQuantity = getProductQuantityInCart(cart, product.id, index);
      // بیشترین مقدار مجاز را با توجه به موجودی تعیین می‌کند.
      const max = Math.max(1, product.stock - otherQuantity);

      // مقدار غیرعددی باعث بازسازی سبد می‌شود.
      if (!Number.isFinite(requested)) return renderCart();
      // مقدار جدید را بین حداقل یک و حداکثر موجودی نگه می‌دارد.
      cart[index].quantity = Math.min(Math.max(1, requested), max);
      // مقدار جدید را ذخیره می‌کند.
      saveCart(cart);
      // نمایش سبد را دوباره می‌سازد.
      renderCart();
    });
  });

  // رویداد حذف را برای همه دکمه‌های REMOVE فعال می‌کند.
  document.querySelectorAll(".remove-btn").forEach((button) => {
    button.addEventListener("click", () => {
      // شماره آیتم برای حذف را می‌گیرد.
      const index = Number(button.dataset.index);
      // سبد فعلی را می‌خواند.
      const cart = loadCart();
      // اگر شماره یا آیتم معتبر نباشد، کاری انجام نمی‌دهد.
      if (!Number.isInteger(index) || !cart[index]) return;
      // آیتم انتخاب‌شده را حذف می‌کند.
      cart.splice(index, 1);
      // سبد جدید را ذخیره می‌کند.
      saveCart(cart);
      // نمایش جدید را می‌سازد.
      renderCart();
    });
  });

  // مبلغ‌ها را به‌روزرسانی می‌کند.
  updateTotals();
  // تعداد کالاهای سبد را به‌روزرسانی می‌کند.
  updateCartCount();
}

// تعداد یک آیتم را با مقدار مثبت یا منفی تغییر می‌دهد.
function changeQuantity(index, delta) {
  // سبد فعلی را می‌خواند.
  const cart = loadCart();
  // آیتم موردنظر را پیدا می‌کند.
  const item = cart[index];
  // اگر آیتم وجود نداشته باشد، ادامه نمی‌دهد.
  if (!item) return;

  // محصول اصلی را پیدا می‌کند.
  const product = getProductById(Number(item.productId));
  // اگر محصول حذف شده باشد، سبد را دوباره پاک‌سازی می‌کند.
  if (!product) return renderCart();

  // تعداد همین محصول در آیتم‌های دیگر را حساب می‌کند.
  const otherQuantity = getProductQuantityInCart(cart, product.id, index);
  // بیشترین تعداد مجاز را مشخص می‌کند.
  const max = Math.max(1, product.stock - otherQuantity);
  // مقدار جدید را بین حداقل یک و حداکثر موجودی محدود می‌کند.
  item.quantity = Math.min(max, Math.max(1, (Number(item.quantity) || 1) + delta));
  // سبد جدید را ذخیره می‌کند.
  saveCart(cart);
  // نمایش سبد را دوباره می‌سازد.
  renderCart();
}

// تمام مبلغ‌های خلاصه سفارش را محاسبه می‌کند.
function updateTotals() {
  // سبد معتبر را دوباره می‌گیرد.
  const cart = sanitizeCart(loadCart());
  // جمع قیمت تمام کالاها را محاسبه می‌کند.
  const subtotal = cart.reduce((sum, item) => {
    // محصول اصلی هر آیتم را پیدا می‌کند.
    const product = getProductById(item.productId);
    // قیمت محصول ضربدر تعداد را به جمع اضافه می‌کند.
    return sum + product.price * item.quantity;
  }, 0);

  // ارسال برای خرید بالای ۵۰ دلار یا سبد خالی رایگان است.
  const shipping = subtotal > 50 || subtotal === 0 ? 0 : 10;
  // مالیات ده درصدی را محاسبه می‌کند.
  const tax = subtotal * 0.1;
  // تخفیف را بر اساس درصد فعال حساب می‌کند.
  const discount = subtotal * discountRate;
  // مبلغ نهایی را محاسبه می‌کند و اجازه منفی شدن نمی‌دهد.
  const total = Math.max(0, subtotal + shipping + tax - discount);

  // مبلغ اولیه را در صفحه می‌نویسد.
  subtotalAmount.textContent = `$${subtotal.toFixed(2)}`;
  // هزینه ارسال را به شکل FREE یا مبلغ واقعی نشان می‌دهد.
  shippingAmount.textContent = shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`;
  // مالیات را نمایش می‌دهد.
  taxAmount.textContent = `$${tax.toFixed(2)}`;
  // تخفیف را نمایش می‌دهد.
  discountAmount.textContent = `-$${discount.toFixed(2)}`;
  // ردیف تخفیف را فقط وقتی لازم است نشان می‌دهد.
  discountRow.hidden = discount === 0;
  // مبلغ نهایی را نمایش می‌دهد.
  totalAmount.textContent = `$${total.toFixed(2)}`;
}

// تعداد کل کالاها را روی دکمه سبد خرید نشان می‌دهد.
function updateCartCount() {
  // سبد معتبر را می‌گیرد.
  const cart = sanitizeCart(loadCart());
  // تعداد همه واحدهای کالا را جمع می‌کند.
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  // اگر دکمه هدر وجود داشته باشد، متن آن را تغییر می‌دهد.
  if (cartPill) cartPill.textContent = `CART (${totalItems})`;
}

// کلیک روی Checkout را کنترل می‌کند.
checkoutBtn.addEventListener("click", () => {
  // اگر سبد واقعاً خالی باشد، هشدار می‌دهد.
  if (loadCart().length === 0) {
    showWarning("Your cart is empty.", "⚠ Cart Empty");
    return;
  }

  // چون پرداخت واقعی وصل نیست، پیام نمایشی نشان می‌دهد و سبد را حفظ می‌کند.
  showInfo("Checkout is not connected yet. Your cart has been kept intact.", "ⓘ Demo Checkout");
});

// کلیک روی دکمه promo را کنترل می‌کند.
promoBtn.addEventListener("click", () => {
  // کد واردشده را تمیز و به حروف بزرگ تبدیل می‌کند.
  const promoCode = promoInput.value.trim().toUpperCase();

  // اگر کدی وارد نشده باشد، پیام راهنما نشان می‌دهد.
  if (!promoCode) {
    showInfo("Please enter a promo code.", "ⓘ Code Required");
    return;
  }

  // کد معتبر فروشگاه را بررسی می‌کند.
  if (promoCode === "LEGEND20") {
    // تخفیف را روی بیست درصد قرار می‌دهد.
    discountRate = 0.2;
    // ورودی کد را خالی می‌کند.
    promoInput.value = "";
    // مبلغ‌ها را با تخفیف جدید دوباره حساب می‌کند.
    updateTotals();
    // موفقیت اعمال کد را اطلاع می‌دهد.
    showSuccess("20% discount applied to your subtotal.", "✓ Promo Applied");
    return;
  }

  // برای کد نامعتبر پیام خطا نشان می‌دهد.
  showError("That promo code is not valid.", "✕ Invalid Code");
});

// در پایان، سبد را هنگام باز شدن صفحه نمایش می‌دهد.
renderCart();
