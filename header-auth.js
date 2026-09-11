import { supabase } from "./js/supabase.js";

const authNav = document.getElementById("auth-nav");

function renderSharedFooter() {
  const footer = document.querySelector(".shop-footer");
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-grid footer-grid-shared">
      <div class="footer-brand">
        <span class="footer-logo">N</span>
        <div>
          <h3>NICHERZ</h3>
          <p class="footer-tagline">Curated chaos for the loudest souls.</p>
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
    </div>

    <div class="footer-bottom">
      <span>© 2026 NICHERZ</span>
      <span>WEAR THE LEGEND</span>
    </div>
  `;

  if (!document.getElementById("shared-footer-style")) {
    const style = document.createElement("style");
    style.id = "shared-footer-style";
    style.textContent = `
      .shop-footer .footer-grid-shared {
        grid-template-columns: minmax(0, 1.8fr) minmax(7em, 1fr) minmax(7em, 1fr);
        align-items: start;
      }

      .shop-footer .footer-tagline {
        color: rgba(255, 255, 255, 0.42) !important;
        text-shadow: none !important;
      }

      .shop-footer .footer-links a {
        color: rgba(255, 255, 255, 0.42);
      }

      .shop-footer .footer-links a:hover {
        color: #fff;
      }

      @media (max-width: 56em) {
        .shop-footer .footer-grid-shared {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (max-width: 40em) {
        .shop-footer .footer-grid-shared {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

async function updateAuthNav() {
  if (!authNav) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    authNav.innerHTML = `
      <a href="account.html" class="auth-link">ACCOUNT</a>
      <button type="button" id="logoutBtn" class="auth-link auth-button">
        LOGOUT
      </button>
    `;

    const logoutBtn = document.getElementById("logoutBtn");

    logoutBtn.addEventListener("click", async () => {
      logoutBtn.disabled = true;
      logoutBtn.textContent = "LOGGING OUT...";

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error(error);
        logoutBtn.disabled = false;
        logoutBtn.textContent = "LOGOUT";
        return;
      }

      window.location.href = "index-shop.html";
    });
  } else {
    authNav.innerHTML = `
      <a href="login.html" class="auth-link">LOGIN</a>
    `;
  }
}

renderSharedFooter();
updateAuthNav();

supabase.auth.onAuthStateChange(() => {
  updateAuthNav();
});