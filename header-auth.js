import { supabase } from "./js/supabase.js";

// این فایل پوسته مشترک هدر و فوتر را روی همه صفحه‌ها یکسان نگه می‌دارد.
const shellStyle = document.createElement("style");
shellStyle.textContent = `
  .shop-header-inner {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: min(94%, 90em) !important;
  }

  .shop-header .brand-wrap {
    order: 1 !important;
    margin-right: auto !important;
    margin-left: 0 !important;
    justify-self: start !important;
  }

  .shop-header .header-nav {
    order: 2 !important;
    flex: 1 1 auto !important;
    justify-content: center !important;
  }

  .shop-header .header-actions {
    order: 3 !important;
    margin-left: auto !important;
    margin-right: 0 !important;
    justify-self: end !important;
  }

  .shop-header .header-nav > a,
  .shop-header .brand-name,
  .shop-header .brand-copy small,
  .shop-header .cart-pill {
    font-family: "Metal Mania", cursive !important;
  }

  /* فقط دکمه Login/Logout کادر سفید دارد. */
  .shop-header .auth-action {
    border: 1px solid #fff !important;
    padding: .45em .7em !important;
  }

  /* زیر هیچ لینک هدر خط یا pseudo-element اضافی باقی نمی‌ماند. */
  .shop-header .header-nav > a::before,
  .shop-header .header-nav > a::after,
  .shop-header .auth-nav a::before,
  .shop-header .auth-nav a::after {
    display: none !important;
    content: none !important;
  }

  /* Shimmer مشترک لوگو و Cart؛ آرام‌تر و نرم‌تر از قبل. */
  .shop-header .brand-mark,
  .shop-header .cart-pill {
    overflow: hidden !important;
  }

  .shop-header .brand-mark::after,
  .shop-header .cart-pill::before {
    content: "" !important;
    position: absolute !important;
    inset: -35% -60% !important;
    pointer-events: none !important;
    z-index: 5 !important;
    background: linear-gradient(120deg, transparent 35%, rgba(255,255,255,.48) 50%, transparent 65%) !important;
    transform: translateX(-120%) rotate(14deg) !important;
    animation: nicherzHeaderShimmer 6.5s cubic-bezier(.4,0,.2,1) infinite !important;
  }

  .shop-header .brand-mark img {
    position: relative;
    z-index: 1;
  }

  @keyframes nicherzHeaderShimmer {
    0%, 52% { transform: translateX(-120%) rotate(14deg); opacity: 0; }
    62% { opacity: .9; }
    80%, 100% { transform: translateX(120%) rotate(14deg); opacity: 0; }
  }

  /* همان shimmer فقط روی کارت‌های محصول صفحه Product. */
  .shop-page .product-card::after {
    content: "";
    position: absolute;
    inset: -35%;
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(120deg, transparent 42%, rgba(255,255,255,.22) 50%, transparent 58%);
    transform: translateX(-120%) rotate(14deg);
    opacity: 0;
    animation: nicherzProductShimmer 6.5s cubic-bezier(.4,0,.2,1) infinite;
  }

  @keyframes nicherzProductShimmer {
    0%, 55% { transform: translateX(-120%) rotate(14deg); opacity: 0; }
    65% { opacity: .8; }
    82%, 100% { transform: translateX(120%) rotate(14deg); opacity: 0; }
  }

  /* فاصله کوچک بین Header و عنوان سبد خرید. */
  .cart-page { padding-top: 4em !important; }

  /* فوتر فقط برند، INFO و FOLLOW دارد و همه رنگ‌ها سفید هستند. */
  .shop-footer .footer-grid {
    grid-template-columns: 1.5fr 1fr 1fr !important;
  }

  .shop-footer,
  .shop-footer .footer-links a,
  .shop-footer .footer-links h4,
  .shop-footer .footer-brand,
  .shop-footer .footer-brand h3,
  .shop-footer .footer-brand p,
  .shop-footer .footer-bottom,
  .shop-footer .footer-bottom span {
    color: #fff !important;
  }

  .shop-footer .footer-links a:visited,
  .shop-footer .footer-links a:link,
  .shop-footer .footer-links a:hover,
  .shop-footer .footer-links a:focus {
    color: #fff !important;
  }

  @media (max-width: 700px) {
    .shop-header-inner {
      width: 94% !important;
      min-height: 0 !important;
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      grid-template-rows: auto auto !important;
      align-items: center !important;
      column-gap: .8em !important;
      row-gap: .7em !important;
    }

    .shop-header .brand-wrap {
      grid-column: 1 !important;
      grid-row: 1 !important;
      justify-self: start !important;
      margin: 0 !important;
    }

    .shop-header .header-actions {
      grid-column: 2 !important;
      grid-row: 1 !important;
      justify-self: end !important;
      margin: 0 !important;
    }

    .shop-header .header-nav {
      grid-column: 1 / -1 !important;
      grid-row: 2 !important;
      width: 100% !important;
      min-width: 0 !important;
      justify-content: center !important;
      flex-wrap: nowrap !important;
      overflow-x: auto !important;
      scrollbar-width: none !important;
    }

    .shop-header .header-nav::-webkit-scrollbar {
      display: none !important;
    }

    /* سه بلوک فوتر در یک ردیف؛ اندازه فونت دست‌نخورده می‌ماند. */
    .shop-footer .footer-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      gap: 1em !important;
      align-items: start !important;
    }

    .shop-footer .footer-brand,
    .shop-footer .footer-links {
      min-width: 0 !important;
    }

    /* چیدمان قدیمی کارت‌های Home حفظ می‌شود. */
    .bands-page .gallery {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(shellStyle);

function isHomePage() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  return path === "index.html" || path === "";
}

async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Could not read auth session:", error);
    return null;
  }

  return data?.session || null;
}

// هدر همه صفحه‌ها را با پنج گزینه ثابت می‌سازیم.
async function rebuildHeader() {
  const header = document.querySelector(".shop-header");
  const nav = header?.querySelector(".header-nav");
  if (!nav) return;

  // سرچ فقط در Home نگه داشته می‌شود.
  const search = nav.querySelector(".container");
  const session = await getSession();
  const authLabel = session ? "LOGOUT" : "LOGIN";

  nav.innerHTML = `
    <a href="index.html">HOME</a>
    <a href="index-shop.html">PRODUCT</a>
    <a href="index.html#gallery">GALLERY</a>
    <a href="account.html">ACCOUNT</a>
    <a href="${session ? "#logout" : "login.html"}" class="auth-action" data-auth-action>${authLabel}</a>
  `;

  if (isHomePage() && search) {
    nav.appendChild(search);
    search.style.setProperty("display", "flex", "important");
  }

  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  nav.querySelectorAll("a:not(.auth-action)").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "" && href === "index.html")) {
      link.classList.add("active-nav");
      link.setAttribute("aria-current", "page");
    }
  });
}

// فوتر همه صفحه‌ها فقط برند، INFO و FOLLOW را نگه می‌دارد.
function rebuildFooter() {
  document.querySelectorAll(".shop-footer").forEach((footer) => {
    let grid = footer.querySelector(".footer-grid");

    if (!grid) {
      grid = document.createElement("div");
      grid.className = "footer-grid";
      const bottom = footer.querySelector(".footer-bottom");
      if (bottom) footer.insertBefore(grid, bottom);
      else footer.appendChild(grid);
    }

    grid.innerHTML = `
      <div class="footer-brand">
        <span class="footer-logo">N</span>
        <div>
          <h3>NICHERZ</h3>
          <p>Curated chaos for the loudest souls.</p>
        </div>
      </div>

      <div class="footer-links">
        <h4>INFO</h4>
        <a href="contact.html">Contact</a>
        <a href="#">Support</a>
      </div>

      <div class="footer-links">
        <h4>FOLLOW</h4>
        <a href="https://instagram.com/nicherzz" target="_blank" rel="noopener noreferrer">Instagram</a>
        <a href="https://t.me/nicherz" target="_blank" rel="noopener noreferrer">Telegram</a>
      </div>
    `;

    let bottom = footer.querySelector(".footer-bottom");
    if (!bottom) {
      bottom = document.createElement("div");
      bottom.className = "footer-bottom";
      footer.appendChild(bottom);
    }

    bottom.innerHTML = `
      <span>© 2026 NICHERZ</span>
      <span>WEAR THE LEGEND</span>
    `;
  });
}

async function handleAuthAction(event) {
  const link = event.target.closest("[data-auth-action]");
  if (!link) return;

  const session = await getSession();
  if (!session) return;

  event.preventDefault();

  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Logout failed:", error);
    return;
  }

  await rebuildHeader();
}

document.addEventListener("click", handleAuthAction);

// دکمه Related Products روی کارت هر بند باید فقط محصولات همان بند را باز کند.
document.addEventListener("click", (event) => {
  const link = event.target.closest("a.Bio[href*='category=']");
  if (!link) return;

  const url = new URL(link.href, window.location.href);
  const band = url.searchParams.get("category");
  if (!band) return;

  url.searchParams.delete("category");
  url.searchParams.set("band", band);
  link.href = url.toString();
});

rebuildFooter();
rebuildHeader();

supabase.auth.onAuthStateChange(() => {
  rebuildHeader();
  rebuildFooter();
});
