/**
 * 🔔 TOAST NOTIFICATIONS — LOGIC
 * سیستم پیغام‌های زیبا
 */

/* Create container if it doesn't exist */
if (!document.querySelector(".toast-container")) {
  const container = document.createElement("div");
  container.className = "toast-container";
  document.body.appendChild(container);
}

/**
 * Toast notification system
 *
 * استفاده:
 * showToast("پیغام", "success")
 * showToast("خرابی!", "error")
 * showToast("احتیاط", "warning")
 * showToast("معلومات", "info")
 */

function showToast(message, type = "info", duration = 3000, title = null) {
  const container = document.querySelector(".toast-container");

  /* Toast element بنائیں */
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  /* Icon selection */
  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ⓘ",
    loading: "⟳",
  };

  const icon = icons[type] || "•";

  /* Toast content */
  const titleText = title || getDefaultTitle(type);

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">
      ${titleText ? `<p class="toast-title">${titleText}</p>` : ""}
      <p class="toast-text">${message}</p>
    </div>
    <button class="toast-close" aria-label="Close notification">×</button>
  `;

  /* Add to container */
  container.appendChild(toast);

  /* Close button listener */
  const closeBtn = toast.querySelector(".toast-close");
  closeBtn.addEventListener("click", () => {
    removeToast(toast);
  });

  /* Auto remove after duration */
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }

  return toast;
}

/**
 * Get default title based on type
 */
function getDefaultTitle(type) {
  const titles = {
    success: "✓ Success",
    error: "✕ Error",
    warning: "⚠ Warning",
    info: "ⓘ Info",
    loading: "Loading...",
  };
  return titles[type] || "Notification";
}

/**
 * Remove toast smoothly
 */
function removeToast(toast) {
  toast.style.animation = "slideOutRight 0.3s ease forwards";
  setTimeout(() => {
    toast.remove();
  }, 300);
}

/**
 * Specific toast functions
 */

function showSuccess(message, title = "✓ Success") {
  return showToast(message, "success", 3000, title);
}

function showError(message, title = "✕ Error") {
  return showToast(message, "error", 4000, title);
}

function showWarning(message, title = "⚠ Warning") {
  return showToast(message, "warning", 3500, title);
}

function showInfo(message, title = "ⓘ Info") {
  return showToast(message, "info", 3000, title);
}

function showLoading(message, title = "Loading...") {
  return showToast(message, "loading", 0, title);
}

/**
 * Replace loading toast with result
 */
function replaceLoading(loadingToast, message, type = "success", title = null) {
  removeToast(loadingToast);
  return showToast(message, type, 3000, title);
}
