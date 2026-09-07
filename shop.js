const productsContainer = document.getElementById("products-container");

const categoryButtons = document.querySelectorAll(".category-btn");
/* querySelectorAll() یک مجموعه از تمام عناصر مطابق selector برمی‌گردونه، پس اینجا همه‌ی .category-btnها رو یکجا داریم */

/* ✅ Products array از products.js می‌یاد (بالا import شده) */
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

    /* ✅ کارت کلیکی‌شونده است و به صفحه‌ی detail می‌رود */
    card.addEventListener("click", (e) => {
      /* اگر روی دکمه‌ی ADD TO CART کلیک شد، صفحه رو redirect نکن */
      if (e.target.classList.contains("add-cart")) {
        return;
      }

      /* به صفحه‌ی product detail برو و product ID رو pass کن */
      window.location.href = `product-detail.html?id=${product.id}`;
    });

    /* ✅ ADD TO CART دکمہ پر event listener */
    const addCartBtn = card.querySelector(".add-cart");
    addCartBtn.addEventListener("click", (e) => {
      e.stopPropagation(); /* parent click event کو block کریں */

      /* 🛒 سادہ cart item بنائیں (بغیر size selection) */
      const cartItem = {
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.price,
        image: product.image,
      };

      /* localStorage میں add کریں */
      let cart = JSON.parse(localStorage.getItem("cart")) || [];

      /* چیک کریں کہ یہ item پہلے سے موجود ہے یا نہیں */
      const existingItem = cart.find((item) => item.productId === product.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push(cartItem);
      }

      localStorage.setItem("cart", JSON.stringify(cart));

      /* ✅ Success feedback */
      const originalText = addCartBtn.textContent;
      addCartBtn.textContent = "✓ ADDED";
      addCartBtn.style.color = "#90ee90";

      setTimeout(() => {
        addCartBtn.textContent = originalText;
        addCartBtn.style.color = "";
      }, 1500);

      /* ✅ Cart count update کریں */
      updateCartCount();
    });

    /* استایل cursor تغییر کن تا کاربر بدونه کارت کلیکی‌شونده است */
    card.style.cursor = "pointer";

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

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartPill = document.querySelector(".cart-pill");
  if (cartPill) {
    cartPill.textContent = `CART (${totalItems})`;
  }
}

/* Page load ہو تو cart count دکھائیں */
updateCartCount();
