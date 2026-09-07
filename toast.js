if (!document.querySelector(".toast-container")) {
  const container = document.createElement("div");
  container.className = "toast-container";
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-atomic", "true");
  document.body.appendChild(container);
}

function showToast(message, type = "info", duration = 3000, title = null) {
  const container = document.querySelector(".toast-container");
  const safeType = ["success", "error", "warning", "info", "loading"].includes(type)
    ? type
    : "info";

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ⓘ",
    loading: "⟳",
  };

  const toast = document.createElement("div");
  toast.className = `toast ${safeType}`;
  toast.setAttribute("role", safeType === "error" ? "alert" : "status");

  const icon = document.createElement("div");
  icon.className = "toast-icon";
  icon.textContent = icons[safeType];

  const messageWrap = document.createElement("div");
  messageWrap.className = "toast-message";

  const titleText = title || getDefaultTitle(safeType);
  if (titleText) {
    const titleElement = document.createElement("p");
    titleElement.className = "toast-title";
    titleElement.textContent = titleText;
    messageWrap.appendChild(titleElement);
  }

  const textElement = document.createElement("p");
  textElement.className = "toast-text";
  textElement.textContent = String(message ?? "");
  messageWrap.appendChild(textElement);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "toast-close";
  closeBtn.setAttribute("aria-label", "Close notification");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => removeToast(toast));

  toast.append(icon, messageWrap, closeBtn);
  container.appendChild(toast);

  if (duration > 0) {
    window.setTimeout(() => removeToast(toast), duration);
  }

  return toast;
}

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

function removeToast(toast) {
  if (!toast || toast.dataset.removing === "true") return;
  toast.dataset.removing = "true";
  toast.style.animation = "slideOutRight 0.3s ease forwards";
  window.setTimeout(() => toast.remove(), 300);
}

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

function replaceLoading(loadingToast, message, type = "success", title = null) {
  removeToast(loadingToast);
  return showToast(message, type, 3000, title);
}
