import { supabase } from "./js/supabase.js";

// این استایل مشترک ظاهر هدر و فوتر را در همه صفحه‌ها یکسان نگه می‌دارد.
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

  /* هدر فقط همین پنج گزینه را نشان می‌دهد و هیچ خط زیر لینک‌ها ندارد. */
  .shop-header .header-nav > a::before,
  .shop-header .header-nav > a::after,
  .shop-header .auth-nav a::before,
  .shop-header .auth-nav a::after {
    display: none !important;
    content: none !important;
  }

  /* رنگ تمام متن‌های فوتر سفید می‌ماند. */
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
  }
`;
document.head.appendChild(shellStyle);

function isHomePage() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  return path === "index.html" || path === "";
}

// هدر همه صفحه‌ها را از یک منوی مشترک می‌سازیم.
function rebuildHeader() {
  const header = document.querySelector(".shop-header");
  const nav = header?.querySelector(".header-nav");
  if (!nav) return;

  // سرچ فقط در Home نگه داشته می‌شود.
  const search = nav.querySelector(".container");

  nav.innerHTML = `
    <a href="index.html">HOME</a>
    <a href="index-shop.html">SHOP</a>
    <a href="index.html#gallery">GALLERY</a>
    <a href="account.html">ACCOUNT</a>
    <a href="login.html">LOGIN</a>
  `;

  if (isHomePage() && search) {
    nav.appendChild(search);
    search.style.setProperty("display", "flex", "important");
  }

  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  nav.querySelectorAll("a").forEach((link) => {
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

rebuildHeader();
rebuildFooter();

supabase.auth.onAuthStateChange(() => {
  rebuildHeader();
  rebuildFooter();
});
