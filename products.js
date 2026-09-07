// لیست کامل محصولاتی که فروشگاه و صفحه جزئیات از آن استفاده می‌کنند.
const products = [
  // محصول شماره ۱ و اطلاعات مربوط به آن.
  {
    // شناسه یکتای محصول.
    id: 1,
    // نام محصول.
    name: "Master Of Puppets",
    // دسته‌بندی محصول.
    category: "band-merch",
    // نام گروه مرتبط با محصول.
    band: "Metallica",
    // نوع محصول.
    type: "T-Shirt",
    // قیمت محصول.
    price: 35,
    // مسیر تصویر محصول.
    image: "Images/1.jpeg",
    // توضیحی که در صفحه محصول نمایش داده می‌شود.
    description:
      "Classic Metallica 'Master Of Puppets' t-shirt in premium quality. Featuring the iconic album artwork.",
    // سایزهای قابل انتخاب.
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    // تعداد موجود در انبار.
    stock: 15,
  },

  // محصول شماره ۲.
  {
    id: 2,
    name: "Vintage Flame",
    category: "y2k",
    // این محصول به گروه خاصی وابسته نیست.
    band: null,
    type: "T-Shirt",
    price: 32,
    image: "Images/2.jpg",
    description:
      "Y2K inspired vintage flame graphic tee. Perfect for that early 2000s aesthetic.",
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: 8,
  },

  // محصول شماره ۳.
  {
    id: 3,
    name: "Shadow Chain",
    category: "accessories",
    band: null,
    type: "Chain",
    price: 18,
    image: "Images/3.jpg",
    description:
      "Heavy-duty stainless steel chain accessory. Classic metal aesthetic for any outfit.",
    // برای این محصول فقط یک سایز وجود دارد.
    sizes: ["One Size"],
    stock: 25,
  },

  // محصول شماره ۴.
  {
    id: 4,
    name: "Blackout Jacket",
    category: "streetwear",
    band: null,
    type: "Jacket",
    price: 75,
    image: "Images/4.jpg",
    description:
      "Premium black streetwear jacket with metal accents. Comfortable and stylish.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    stock: 5,
  },

  // محصول شماره ۵ و محصول موسیقی مرتبط با Metallica.
  {
    id: 5,
    name: "Master Of Puppets Vinyl",
    category: "music",
    band: "Metallica",
    type: "Vinyl",
    price: 42,
    image: "Images/5.jpg",
    description:
      "Original 'Master Of Puppets' vinyl record. Mint condition collectible.",
    sizes: ["One Size"],
    stock: 3,
  },

  // محصول شماره ۶ از نوع کلکسیونی.
  {
    id: 6,
    name: "Demon Skull Figure",
    category: "collectibles",
    band: null,
    type: "Figure",
    price: 55,
    image: "Images/6.jpeg",
    description:
      "Detailed demon skull collectible figure. Perfect for any dark collection.",
    sizes: ["One Size"],
    stock: 12,
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
