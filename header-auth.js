import { supabase } from "./js/supabase.js";

// Load the shared visual patch once so all auth-enabled pages use the same layout rules.
if (!document.querySelector('link[data-ui-fixes]')) {
    const uiFixes = document.createElement("link");
    uiFixes.rel = "stylesheet";
    uiFixes.href = "ui-fixes.css";
    uiFixes.dataset.uiFixes = "true";
    document.head.appendChild(uiFixes);
}

const authNav = document.getElementById("auth-nav");

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

updateAuthNav();

supabase.auth.onAuthStateChange(() => {
    updateAuthNav();
});