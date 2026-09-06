const productsContainer = document.getElementById("products-container");

const categoryButtons = document.querySelectorAll(".category-btn");
/* querySelectorAll() یک مجموعه از تمام عناصر مطابق selector برمی‌گردونه، پس اینجا همه‌ی .category-btnها رو یکجا داریم */
const products = [
  {
    name: "Master Of Puppets",
    category: "band-merch",
    band: "Metallica",
    type: "T-Shirt",
    price: 35,
    image: "Images/1.jpeg",
  },

  {
    name: "Vintage Flame",
    category: "y2k",
    band: null,
    type: "T-Shirt",
    price: 32,
    image: "Images/2.jpg",
  },

  {
    name: "Shadow Chain",
    category: "accessories",
    band: null,
    type: "Chain",
    price: 18,
    image: "Images/3.jpg",
  },

  {
    name: "Blackout Jacket",
    category: "streetwear",
    band: null,
    type: "Jacket",
    price: 75,
    image: "Images/4.jpg",
  },

  {
    name: "Master Of Puppets Vinyl",
    category: "music",
    band: "Metallica",
    type: "Vinyl",
    price: 42,
    image: "Images/5.jpg",
  },

  {
    name: "Demon Skull Figure",
    category: "collectibles",
    band: null,
    type: "Figure",
    price: 55,
    image: "Images/6.jpeg",
  },
];
/* تابع نمایش محصولات داخل container */
function renderProducts(productsToRender) {
  productsContainer.innerHTML = "";

  productsToRender.forEach((product) => {
    const card = document.createElement("article");

    card.classList.add("product-card");

    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}">
      </div>

      <div class="product-info">

        <p class="product-band">
          ${product.band ?? ""}
        </p>

        <h2 class="product-name">
          ${product.name}
        </h2>

        <p class="product-type">
          ${product.type}
        </p>

        <div class="product-bottom">

          <span class="product-price">
            $${product.price}
          </span>

          <button class="add-cart">
            ADD TO CART
          </button>

        </div>

      </div>
    `;

    productsContainer.appendChild(card);
  });
}
renderProducts(products);
/* 
وقتی تابع رو صدا بزنیم:

Container رو خالی می‌کنه.
تک‌تک Objectها رو می‌خونه.
برای هر محصول یک article می‌سازه.
اطلاعات محصول رو داخلش می‌گذاره.
کارت رو به DOM اضافه می‌کنه.

یعنی دیگه Product Card دستی داخل HTML نمی‌خوایم.
 */

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedCategory = button.dataset.category;

    categoryButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");

    if (selectedCategory === "all") {
      renderProducts(products);

      return;
    }

    const filteredProducts = products.filter((product) => {
      return product.category === selectedCategory;
    });

    renderProducts(filteredProducts);
  });
});
