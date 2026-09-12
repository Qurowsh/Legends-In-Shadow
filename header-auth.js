import { supabase } from "./js/supabase.js";

const shellStyle = document.createElement("style");
shellStyle.textContent = `
  .shop-header-inner { display:flex !important; align-items:center !important; justify-content:space-between !important; width:min(94%,90em) !important; position:relative !important; }
  .shop-header .brand-wrap { order:1 !important; margin-right:auto !important; margin-left:0 !important; justify-self:start !important; }
  .shop-header .header-nav { order:2 !important; flex:1 1 auto !important; justify-content:center !important; }
  .shop-header .header-actions { order:3 !important; margin-left:auto !important; margin-right:0 !important; justify-self:end !important; }
  .shop-header .header-nav > a,
  .shop-header .brand-name,
  .shop-header .brand-copy small,
  .shop-header .cart-pill { font-family:"Metal Mania",cursive !important; }
  .shop-header .auth-action { border:1px solid #fff !important; padding:.45em .7em !important; }
  .shop-header .header-nav > a::before,
  .shop-header .auth-nav a::before { display:none !important; content:none !important; }

  /* Restore the interactive header motion used by the original design. */
  .shop-header .header-nav > a,
  .shop-header .cart-pill,
  .shop-header .brand-wrap { position:relative !important; transition:color .25s ease, transform .25s ease, text-shadow .25s ease, border-color .25s ease, box-shadow .25s ease !important; }
  .shop-header .header-nav > a::after {
    content:"" !important;
    display:block !important;
    position:absolute !important;
    left:50% !important;
    bottom:-.35em !important;
    width:0 !important;
    height:1px !important;
    background:#e1bd2b !important;
    transform:translateX(-50%) !important;
    transition:width .25s ease !important;
  }
  .shop-header .header-nav > a:hover,
  .shop-header .cart-pill:hover,
  .shop-header .brand-wrap:hover { color:#e1bd2b !important; transform:translateY(-2px) !important; text-shadow:0 0 12px rgba(225,189,43,.42) !important; }
  .shop-header .header-nav > a:hover::after { width:75% !important; }
  .shop-header .cart-pill:hover { border-color:#e1bd2b !important; box-shadow:0 0 18px rgba(225,189,43,.2) !important; }
  .shop-header .brand-wrap:hover .brand-name { color:#e1bd2b !important; }

  .shop-header-inner > .container {
    position:absolute !important;
    left:50% !important;
    top:50% !important;
    transform:translate(-50%,-50%) !important;
    z-index:20 !important;
    display:flex !important;
  }

  .shop-header .brand-mark,
  .shop-header .cart-pill {
    position:relative !important;
    overflow:hidden !important;
    isolation:isolate !important;
  }
  .shop-header .brand-mark::after,
  .shop-header .cart-pill::before {
    content:"" !important;
    position:absolute !important;
    inset:-35% -70% !important;
    pointer-events:none !important;
    z-index:10 !important;
    background:linear-gradient(120deg,transparent 34%,rgba(255,255,255,.18) 45%,rgba(255,255,255,.95) 50%,rgba(255,255,255,.18) 55%,transparent 66%) !important;
    transform:translateX(-135%) rotate(14deg) !important;
    animation:nicherzHeaderShimmer 5.8s cubic-bezier(.45,0,.2,1) infinite !important;
    will-change:transform,opacity !important;
  }
  .shop-header .brand-mark img { position:relative !important; z-index:1 !important; }
  @keyframes nicherzHeaderShimmer {
    0%,48% { transform:translateX(-135%) rotate(14deg); opacity:0; }
    56% { opacity:.95; }
    72% { transform:translateX(135%) rotate(14deg); opacity:.95; }
    82%,100% { transform:translateX(135%) rotate(14deg); opacity:0; }
  }

  .shop-page .product-card { position:relative !important; overflow:hidden !important; isolation:isolate !important; }
  .shop-page .product-card::after {
    content:"" !important;
    position:absolute !important;
    inset:-45% !important;
    z-index:20 !important;
    pointer-events:none !important;
    background:linear-gradient(120deg,transparent 37%,rgba(255,255,255,.16) 46%,rgba(255,255,255,.88) 50%,rgba(255,255,255,.16) 54%,transparent 63%) !important;
    transform:translateX(-135%) rotate(14deg) !important;
    animation:nicherzProductShimmer 5.8s cubic-bezier(.45,0,.2,1) infinite !important;
    will-change:transform,opacity !important;
  }
  @keyframes nicherzProductShimmer {
    0%,48% { transform:translateX(-135%) rotate(14deg); opacity:0; }
    56% { opacity:.75; }
    72% { transform:translateX(135%) rotate(14deg); opacity:.75; }
    82%,100% { transform:translateX(135%) rotate(14deg); opacity:0; }
  }

  .cart-page { padding-top:1.6em !important; }
  .continue-shopping-link { display:inline-flex !important; align-items:center !important; justify-content:center !important; gap:.45em !important; margin-top:1.6em !important; padding:.7em 1.05em !important; border:1px solid rgba(225,189,43,.45) !important; border-radius:.55em !important; color:#e1bd2b !important; background:rgba(225,189,43,.045) !important; text-decoration:none !important; font-family:"Metal Mania",cursive !important; letter-spacing:.06em !important; transition:all .28s ease !important; }
  .continue-shopping-link:hover,
  .continue-shopping-link:focus-visible { color:#fff !important; background:rgba(225,189,43,.14) !important; border-color:#e1bd2b !important; transform:translateY(-2px) !important; box-shadow:0 0 18px rgba(225,189,43,.18) !important; }

  /* One shared Home-style footer layout and typography for every page. */
  .shop-footer { width:100% !important; margin-top:2em !important; background:rgba(5,5,5,.96) !important; border-top:1px solid rgba(255,255,255,.14) !important; box-shadow:0 -12px 35px rgba(0,0,0,.3) !important; }
  .shop-footer .footer-grid { width:min(94%,90em) !important; margin:0 auto !important; padding:3em 0 2.4em !important; display:grid !important; grid-template-columns:1.5fr 1fr 1fr !important; gap:2em !important; align-items:start !important; }
  .shop-footer .footer-brand { display:block !important; min-width:0 !important; }
  .shop-footer .footer-logo { display:none !important; }
  .shop-footer .footer-brand h3,
  .shop-footer .footer-links h4,
  .shop-footer .footer-links a,
  .shop-footer .footer-bottom,
  .shop-footer .footer-bottom span { font-family:"Metal Mania",cursive !important; }
  .shop-footer .footer-brand h3 { margin:0 0 .35em !important; color:#fff !important; font-size:1.35em !important; letter-spacing:.08em !important; }
  .shop-footer .footer-brand p { margin:0 !important; color:#e1bd2b !important; font-family:Arial,sans-serif !important; font-size:.72em !important; line-height:1.5 !important; }
  .shop-footer .footer-links { display:flex !important; flex-direction:column !important; gap:.45em !important; min-width:0 !important; }
  .shop-footer .footer-links h4 { margin:0 0 .35em !important; color:#fff !important; font-size:.78em !important; letter-spacing:.1em !important; }
  .shop-footer .footer-links a,
  .shop-footer .footer-links a:link,
  .shop-footer .footer-links a:visited { color:#fff !important; font-size:.72em !important; text-decoration:none !important; transition:color .2s ease, transform .2s ease !important; }
  .shop-footer .footer-links a:hover { color:#e1bd2b !important; transform:translateX(3px) !important; }
  .shop-footer .footer-bottom { width:min(94%,90em) !important; margin:0 auto !important; padding:1em 0 1.35em !important; display:flex !important; justify-content:space-between !important; gap:1em !important; color:rgba(255,255,255,.62) !important; font-size:.62em !important; letter-spacing:.06em !important; border-top:1px solid rgba(255,255,255,.08) !important; }

  @media (max-width:700px) {
    .shop-header-inner {
      width:94% !important;
      min-height:0 !important;
      display:grid !important;
      grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) !important;
      grid-template-rows:auto auto !important;
      align-items:center !important;
      column-gap:.45em !important;
      row-gap:.7em !important;
    }
    .shop-header .brand-wrap { grid-column:1 !important; grid-row:1 !important; justify-self:start !important; margin:0 !important; }
    .shop-header .header-actions { grid-column:3 !important; grid-row:1 !important; justify-self:end !important; margin:0 !important; }
    .shop-header .header-nav {
      grid-column:1 / -1 !important;
      grid-row:2 !important;
      width:100% !important;
      min-width:0 !important;
      display:flex !important;
      justify-content:center !important;
      flex-wrap:nowrap !important;
      overflow-x:auto !important;
      scrollbar-width:none !important;
      gap:.75em !important;
    }
    .shop-header .header-nav::-webkit-scrollbar { display:none !important; }
    .shop-header .header-nav > a { flex:0 0 auto !important; }
    .shop-header-inner > .container {
      position:static !important;
      grid-column:2 !important;
      grid-row:1 !important;
      justify-self:center !important;
      align-self:center !important;
      transform:none !important;
      width:min(100%,14em) !important;
      min-width:0 !important;
      margin:0 !important;
    }
    .shop-header-inner > .container input { width:100% !important; box-sizing:border-box !important; }
    .shop-footer .footer-grid {
      grid-template-columns:minmax(0,1.35fr) minmax(0,.825fr) minmax(0,.825fr) !important;
      gap:.55em !important;
      align-items:start !important;
      width:94% !important;
      padding:2.2em 0 1.6em !important;
    }
    .shop-footer .footer-brand,
    .shop-footer .footer-links { min-width:0 !important; }
    .shop-footer .footer-links h4 { white-space:nowrap !important; }
    .shop-footer .footer-bottom { width:94% !important; font-size:.58em !important; }
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

function placeHomeSearch() {
  const header = document.querySelector(".shop-header");
  const nav = header?.querySelector(".header-nav");
  const inner = header?.querySelector(".shop-header-inner");
  if (!nav || !inner || !isHomePage()) return;
  const search = inner.querySelector(".container") || nav.querySelector(".container");
  if (!search) return;
  if (search.parentElement !== inner) inner.appendChild(search);
  search.style.setProperty("display", "flex", "important");
}

async function rebuildHeader() {
  const header = document.querySelector(".shop-header");
  const nav = header?.querySelector(".header-nav");
  const inner = header?.querySelector(".shop-header-inner");
  if (!nav || !inner) return;

  const search = inner.querySelector(".container") || nav.querySelector(".container");
  const session = await getSession();
  const authLabel = session ? "LOGOUT" : "LOGIN";

  nav.innerHTML = `
    <a href="index.html">HOME</a>
    <a href="index-shop.html">PRODUCT</a>
    <a href="index.html#gallery">GALLERY</a>
    <a href="account.html">ACCOUNT</a>
    <a href="${session ? "#logout" : "login.html"}" class="auth-action" data-auth-action>${authLabel}</a>
  `;

  if (search) {
    inner.appendChild(search);
    search.style.setProperty("display", isHomePage() ? "flex" : "none", "important");
  }

  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  nav.querySelectorAll("a:not(.auth-action)").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPath || (currentPath === "" && href === "index.html")) {
      link.classList.add("active-nav");
      link.setAttribute("aria-current", "page");
    }
  });

  placeHomeSearch();
}

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
        <div><h3>NICHERZ</h3><p>Curated chaos for the loudest souls.</p></div>
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
    bottom.innerHTML = `<span>© 2026 NICHERZ</span><span>WEAR THE LEGEND</span>`;
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

function normalizeRelatedProductLinks(root = document) {
  root.querySelectorAll("a.Bio[href*='category=']").forEach((link) => {
    const url = new URL(link.href, window.location.href);
    const band = url.searchParams.get("category");
    if (!band) return;
    url.searchParams.delete("category");
    url.searchParams.set("band", band);
    link.href = url.toString();
  });
}

normalizeRelatedProductLinks();
const bandsContainer = document.getElementById("bands-container");
if (bandsContainer) {
  new MutationObserver(() => normalizeRelatedProductLinks(bandsContainer)).observe(bandsContainer, { childList: true, subtree: true });
}

function bootShell() {
  rebuildFooter();
  rebuildHeader();
  requestAnimationFrame(() => {
    placeHomeSearch();
    rebuildFooter();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootShell, { once: true });
} else {
  bootShell();
}

supabase.auth.onAuthStateChange(() => {
  rebuildHeader();
  rebuildFooter();
});
