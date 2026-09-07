/**
 * 🛍️ PRODUCTS DATABASE
 *
 * این فایل شامل تمام محصولات Shop هست.
 * هردو صفحه (shop.html و product-detail.html) از این استفاده می‌کنند.
 */

const products = [
  {
    id: 1,
    name: "Master Of Puppets",
    category: "band-merch",
    band: "Metallica",
    type: "T-Shirt",
    price: 35,
    image: "Images/1.jpeg",
    description:
      "Classic Metallica 'Master Of Puppets' t-shirt in premium quality. Featuring the iconic album artwork.",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    stock: 15,
  },

  {
    id: 2,
    name: "Vintage Flame",
    category: "y2k",
    band: null,
    type: "T-Shirt",
    price: 32,
    image: "Images/2.jpg",
    description:
      "Y2K inspired vintage flame graphic tee. Perfect for that early 2000s aesthetic.",
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: 8,
  },

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
    sizes: ["One Size"],
    stock: 25,
  },

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

/**
 * 🔍 تابع برای پیدا کردن محصول با ID
 * مثلاً: getProductById(1) → Master Of Puppets object
 */
function getProductById(id) {
  return products.find((product) => product.id === id);
}

/**
 * 🔍 تابع برای فیلتر کردن محصولات با category
 * مثلاً: getProductsByCategory("band-merch")
 */
function getProductsByCategory(category) {
  if (category === "all") {
    return products;
  }
  return products.filter((product) => product.category === category);
}

/**
 * 🔍 تابع برای جستجو در محصولات
 * مثلاً: searchProducts("metallica") → تمام محصولات Metallica
 */
function searchProducts(query) {
  const lowerQuery = query.toLowerCase();
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.band?.toLowerCase().includes(lowerQuery) ||
      product.type.toLowerCase().includes(lowerQuery),
  );
}
