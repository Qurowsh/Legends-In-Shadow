import { supabase } from "./js/supabase.js";

// Shared header/footer rules for all customer-facing pages.
const shellStyle = document.createElement("style");
shellStyle.textContent = `
  .shop-header-inner {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
  }
  .brand-wrap { order: 1 !important; margin-right: auto !important; }
  .header-actions { order: 3 !important; margin-left: auto !important; }
  .header-nav { order: 2 !important; }
  .shop-header .header-nav > a,
  .shop-header .brand-name,
  .shop-header .brand-copy small,
  .shop-header .cart-pill {
    font-family: "Metal Mania", cursive !important;
  }
  .shop-header .header-nav > a::before,
  .shop-header .header-nav > a::after,
  .shop-header .auth-nav a::before,
  .shop-header .auth-nav a::after { display: none !important; }
  .shop-footer .footer-links a,
  .shop-footer .footer-links h4,
  .shop-footer .footer-brand,
  .shop-footer .footer-brand h3,
  .shop-footer .footer-brand p,
  .shop-footer .footer-bottom { color: #fff !important; }
  .shop-footer .footer-links a:visited,
  .shop-footer .footer-links a:link { color: #fff !important; }
  @media (max-width: 700px) {
    .shop-header-inner {
      width: 94% !important;
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto !important;
      grid-template-rows: auto auto !important;
      column-gap: .8em !important;
      row-gap: .7em !important;
    }
    .brand-wrap { grid-column: 1 !important; grid-row: 1 !important; justify-self: start !important; }
    .header-actions { grid-column: 2 !important; grid-row: 1 !important; justify-self: end !important; }
    .header-nav { grid-column: 1 / -1 !important; grid-row: 2 !important; width: 100% !important; justify-content: center !important; flex-wrap: nowrap !important; overflow-x: auto !important; }
  }
`;
document.head.appendChild(shellStyle);

function isHomePage() {
  const path = window.location.pathname.split("/").pop() || "index.html";
  return path === "index.html" || path === "";
}

function rebuildHeader() {
  const nav = document.querySelector(".shop-header .header-nav");
  if (!nav) return;

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

function cleanFooter() {
  document.querySelectorAll(".shop-footer .footer-links").forEach((section) => {
    const title = section.querySelector("h4")?.textContent.trim().toUpperCase();
    if (title === "SHOP") {
      section.remove();
      return;
    }
    if (title === "INFO") {
      section.querySelectorAll("a").forEach((link) => {
        if (link.textContent.trim().toLowerCase() === "shipping") link.remove();
      });
    }
  });

  document.querySelectorAll(".shop-footer a").forEach((link) => {
    link.style.color = "#fff";
  });
}

rebuildHeader();
cleanFooter();

supabase.auth.onAuthStateChange(() => {
  rebuildHeader();
  cleanFooter();
});