// لیست کامل محصولاتی که فروشگاه و صفحه جزئیات از آن استفاده می‌کنند.
const products = [
  // محصول شماره ۱ و اطلاعات مربوط به آن.
  {
    id: 1,
    name: "Dean Blunt chain",
    category: "accessories",
    band: "Dean Blunt",
    type: "necklace",
    price: null,
    image: "Images/products/dean_blunt_chain.jpg",
    description:
      "dean blunt chain, made of high-quality stainless steel. Perfect for fans of the artist and those who love unique accessories.",
    sizes: ["X", "XL", "S"],
    stock: 2,
  },

  // محصول شماره ۲.
  {
    id: 2,
    name: "Aphex Twin chain",
    category: "accessories",
    band: "Aphex Twin",
    type: "necklace",
    price: null,
    image: "Images/products/aphex_twin_chain.jpg",
    description:
      "aphex twin chain, made of high-quality stainless steel. Perfect for fans of the artist and those who love unique accessories.",
    sizes: ["One size"],
    stock: null,
  },

  // محصول شماره ۳.
  {
    id: 3,
    name: "Cross Chain",
    category: "accessories",
    band: null,
    type: "Chain",
    price: null,
    image: "Images/products/cross_chain.jpg",
    description:
      "Elegant cross chain necklace made of stainless steel. A timeless accessory for any outfit.",
    sizes: ["One Size"],
    stock: null,
  },
  {
    id: 3,
    name: "Cross Chain",
    category: "accessories",
    band: null,
    type: "Chain",
    price: null,
    image: "Images/products/cross_chain.jg",
    description:
      "Elegant cross chain necklace made of stainless steel. A timeless accessory for any outfit.",
    sizes: ["One Size"],
    stock: null,
  },
];

// پیدا کردن یک محصول با شناسه عددی آن.
function getProductById(id) {
  return products.find((product) => product.id === id);
}

// گرفتن محصولات بر اساس دسته‌بندی.
function getProductsByCategory(category) {
  if (category === "all") {
    return products;
  }

  return products.filter((product) => product.category === category);
}

// جستجو در نام، گروه و نوع محصول.
function searchProducts(query) {
  const lowerQuery = query.toLowerCase();

  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.band?.toLowerCase().includes(lowerQuery) ||
      product.type.toLowerCase().includes(lowerQuery),
  );
}

// قیمت‌های قابل نمایش را به تومان تبدیل می‌کند و تنظیمات سبد خرید را اعمال می‌کند.
(function setupCurrencyAndCartDisplay() {
  // قیمت را با جداکننده فارسی و واحد تومان نمایش می‌دهد.
  function formatToman(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return value;
    return `${new Intl.NumberFormat("fa-IR").format(Math.round(number))} تومان`;
  }

  // متن‌های قیمت را در صفحه پیدا می‌کند و دلار را به تومان تبدیل می‌کند.
  function formatCurrencyText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;

    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest("script, style, noscript")) continue;
      if (/\$\d+(?:\.\d{1,2})?/.test(node.nodeValue)) nodes.push(node);
    }

    nodes.forEach((textNode) => {
      textNode.nodeValue = textNode.nodeValue.replace(
        /\$(\d+(?:\.\d{1,2})?)/g,
        (_, value) => formatToman(value),
      );
    });
  }

  // بخش مالیات، تخفیف و کد تخفیف را از رابط کاربری سبد حذف می‌کند.
  function removeUnwantedCartSections() {
    document.querySelectorAll("#taxAmount, #discountRow, #discountAmount, #promoInput, #promoCode, #promoBtn, #applyPromoBtn").forEach((element) => {
      const row = element.closest(".summary-row, .promo-section");
      (row || element).remove();
    });

    document.querySelectorAll(".promo-section").forEach((element) => element.remove());

    const taxLabel = [...document.querySelectorAll(".summary-label")].find((element) => /tax/i.test(element.textContent));
    if (taxLabel) taxLabel.closest(".summary-row")?.remove();
  }

  // هزینه ارسال را روی ۲۰۰ هزار تومان قرار می‌دهد و مبلغ نهایی را با آن محاسبه می‌کند.
  function updateCartAmounts() {
    const shippingAmount = document.getElementById("shippingAmount");
    const subtotalAmount = document.getElementById("subtotalAmount");
    const totalAmount = document.getElementById("totalAmount");

    if (!shippingAmount) return;

    const shipping = 200000;
    const shippingText = formatToman(shipping);

    if (shippingAmount.textContent !== shippingText) {
      shippingAmount.textContent = shippingText;
    }

    if (subtotalAmount && totalAmount) {
      const subtotalText = subtotalAmount.textContent.replace(/[^0-9۰-۹]/g, "");
      const digits = subtotalText.replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit));
      const subtotal = Number(digits) || 0;
      const totalText = formatToman(subtotal + shipping);

      if (totalAmount.textContent !== totalText) {
        totalAmount.textContent = totalText;
      }
    }
  }

  // تغییرات بعدی رندر سبد را هم زیر نظر می‌گیرد.
  const observer = new MutationObserver((mutations) => {
    let shouldRefresh = false;

    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && /\$\d+(?:\.\d{1,2})?/.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue.replace(
            /\$(\d+(?:\.\d{1,2})?)/g,
            (_, value) => formatToman(value),
          );
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          formatCurrencyText(node);
        }
        shouldRefresh = true;
      });
    });

    if (shouldRefresh) {
      removeUnwantedCartSections();
      updateCartAmounts();
    }
  });

  // تبدیل اولیه قیمت‌ها و تنظیم سبد بعد از آماده شدن DOM.
  function startFormatting() {
    if (!document.body) return;
    formatCurrencyText(document.body);
    removeUnwantedCartSections();
    updateCartAmounts();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startFormatting, { once: true });
  } else {
    startFormatting();
  }
})();
