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
