// لیست کامل محصولاتی که فروشگاه و صفحه جزئیات از آن استفاده می‌کنند.
const products = [
  // محصول شماره ۱ و اطلاعات مربوط به آن.
  {
    // شناسه یکتای محصول.
    id: 1,
    // نام محصول.
    name: "Dean Blunt chain",
    // دسته‌بندی محصول.
    category: "accessories",
    // نام گروه مرتبط با محصول.
    band: "Dean Blunt",
    // نوع محصول.
    type: "necklace",
    // قیمت محصول.
    price: null,
    // مسیر تصویر محصول.
    image: "Images/products/dean_blunt_chain.jpg",
    // توضیحی که در صفحه محصول نمایش داده می‌شود.
    description:
      "dean blunt chain, made of high-quality stainless steel. Perfect for fans of the artist and those who love unique accessories.",
    // سایزهای قابل انتخاب.
    sizes: ["X", "XL", "S"],
    // تعداد موجود در انبار.
    stock: 2,
  },

  // محصول شماره ۲.
  {
    id: 2,
    name: "Aphex Twin chain",
    category: "accessories",
    // این محصول به گروه خاصی وابسته نیست.
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
    // برای این محصول فقط یک سایز وجود دارد.
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
    // برای این محصول فقط یک سایز وجود دارد.
    sizes: ["One Size"],
    stock: null,
  },
];

// پیدا کردن یک محصول با شناسه عددی آن.
function getProductById(id) {
  // اولین محصولی را برمی‌گرداند که ID آن با مقدار ورودی برابر باشد.
  return products.find((product) => product.id === id);
}

// گرفتن محصولات بر اساس دسته‌بندی.
function getProductsByCategory(category) {
  // اگر دسته all باشد، همه محصولات برگردانده می‌شوند.
  if (category === "all") {
    return products;
  }

  // فقط محصولاتی را برمی‌گرداند که دسته‌بندی یکسانی دارند.
  return products.filter((product) => product.category === category);
}

// جستجو در نام، گروه و نوع محصول.
function searchProducts(query) {
  // متن جستجو را برای مقایسه یکدست به حروف کوچک تبدیل می‌کند.
  const lowerQuery = query.toLowerCase();

  // محصولاتی را نگه می‌دارد که حداقل یکی از فیلدهای قابل جستجو شامل عبارت ورودی باشد.
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.band?.toLowerCase().includes(lowerQuery) ||
      product.type.toLowerCase().includes(lowerQuery),
  );
}

// فونت فارسی و استایل متن‌های معمول سایت را اضافه می‌کند.
(function setupPersianTheme() {
  // یک استایل داخلی می‌سازد تا به فایل‌های HTML جدید نیاز نباشد.
  const style = document.createElement("style");
  style.textContent = `
    @import url("https://fonts.cdnfonts.com/css/estedad");

    body,
    body button,
    body input,
    body textarea,
    body select,
    body p,
    body a,
    body li,
    body label,
    body span,
    body small {
      font-family: "Estedad", Arial, sans-serif;
    }

    h1,
    h2,
    h3,
    .hero-title,
    .shop-title,
    .brand-name,
    .footer-brand h3,
    .quote {
      font-family: "Death Crow", "Metal Mania", cursive;
    }

    .product-price,
    .related-price,
    .item-price,
    .item-total,
    #subtotalAmount,
    #shippingAmount,
    #taxAmount,
    #discountAmount,
    #totalAmount {
      font-family: "Estedad", Arial, sans-serif;
      direction: rtl;
      unicode-bidi: plaintext;
    }
  `;
  document.head.appendChild(style);
})();

// قیمت‌های قابل نمایش را به واحد فان چوق تبدیل می‌کند.
(function setupChoghCurrency() {
  // یک عدد را با ظاهر مناسب برای قیمت سایت نمایش می‌دهد.
  function formatChogh(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return value;
    const formatted = Number.isInteger(number) ? String(number) : number.toFixed(2);
    return `${formatted} چوق (تومان)`;
  }

  // متن‌های صفحه را پیدا می‌کند و دلار را با واحد جدید جایگزین می‌کند.
  function formatCurrencyText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;

    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest("script, style, noscript")) continue;
      if (/\$\d+(?:\.\d{1,2})?/.test(node.nodeValue)) nodes.push(node);
    }

    nodes.forEach((textNode) => {
      textNode.nodeValue = textNode.nodeValue.replace(/\$(\d+(?:\.\d{1,2})?)/g, (_, value) => formatChogh(value));
    });
  }

  // تغییرات بعدی مثل رندر کارت‌ها و محاسبه سبد را هم زیر نظر می‌گیرد.
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && /\$\d+(?:\.\d{1,2})?/.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue.replace(/\$(\d+(?:\.\d{1,2})?)/g, (_, value) => formatChogh(value));
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          formatCurrencyText(node);
        }
      });
    });
  });

  // تبدیل اولیه قیمت‌ها را بعد از آماده شدن DOM انجام می‌دهد.
  function startCurrencyFormatting() {
    if (!document.body) return;
    formatCurrencyText(document.body);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // اگر این فایل زود اجرا شود، منتظر آماده شدن DOM می‌ماند.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startCurrencyFormatting, { once: true });
  } else {
    startCurrencyFormatting();
  }
})();
