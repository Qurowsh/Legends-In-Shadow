import { supabase } from "./js/supabase.js";

/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;
let categories = [];
let products = [];
let editingProductId = null;
let editingVariantId = null;
let editingImagePath = null;

let productSection = null;
let productList = null;
let productEmpty = null;
let productSearch = null;
let productFormModal = null;
let productForm = null;
let productFormTitle = null;
let productSubmitButton = null;
let productFileInput = null;
let productImagePreview = null;
let productImagePreviewText = null;
let productCategorySelect = null;
let productActiveInput = null;

const STATUS_ACTIVE = true;

/* =========================================================
   HELPERS
   ========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(value) {
  const price = Number(value) || 0;
  return `${new Intl.NumberFormat("fa-IR").format(Math.round(price))} تومان`;
}

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getPublicImageUrl(storagePath) {
  if (!storagePath) return "";

  const raw = String(storagePath).trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  let path = raw.replace(/^\/+/, "");

  if (path.startsWith("product-images/")) {
    path = path.slice("product-images/".length);
  }

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(path);

  return data?.publicUrl || "";
}

function showProductMessage(message, type = "success") {
  if (type === "error" && typeof window.showError === "function") {
    window.showError(message, "Product Error");
    return;
  }

  if (type === "success" && typeof window.showSuccess === "function") {
    window.showSuccess(message, "✓ Product");
    return;
  }

  console[type === "error" ? "error" : "log"](message);
}

/* =========================================================
   ADMIN ACCESS
   ========================================================= */

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Product admin auth check failed:", error);
    return null;
  }

  return user || null;
}

async function isCurrentUserAdmin() {
  if (!currentUser) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error("Product admin role check failed:", error);
    return false;
  }

  return data?.role === "admin";
}

/* =========================================================
   LOAD DATA
   ========================================================= */

async function loadCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (error) throw error;

  categories = data || [];
}

async function loadProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      slug,
      description,
      type,
      price,
      stock,
      material,
      is_active,
      category_id,
      created_at,
      updated_at,
      categories (
        id,
        name,
        slug
      ),
      product_variants (
        id,
        size,
        sku,
        stock,
        price
      ),
      product_images (
        id,
        storage_path,
        alt_text,
        is_primary,
        sort_order
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  products = (data || []).map((product) => ({
    ...product,
    product_variants: product.product_variants || [],
    product_images: (product.product_images || []).sort((a, b) => {
      if (Boolean(b.is_primary) !== Boolean(a.is_primary)) {
        return Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary));
      }
      return (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
    }),
  }));
}

/* =========================================================
   UI CREATION
   ========================================================= */

function buildProductSection() {
  if (!document.getElementById("adminContent")) return;

  const host = document.getElementById("adminContent");
  if (document.getElementById("adminProductsSection")) return;

  const wrapper = document.createElement("section");
  wrapper.id = "adminProductsSection";
  wrapper.className = "admin-card admin-products-section";

  wrapper.innerHTML = `
    <div class="admin-card-header">
      <div class="admin-section-number">02</div>
      <div>
        <h2>PRODUCT MANAGEMENT</h2>
        <p>MANAGE CATALOG, STOCK AND IMAGES</p>
      </div>
      <div class="admin-products-actions">
        <input
          id="adminProductSearch"
          class="admin-products-search"
          type="search"
          placeholder="SEARCH PRODUCTS..."
          autocomplete="off"
        >
        <button
          id="adminAddProductBtn"
          class="admin-product-add-button"
          type="button"
        >+ ADD PRODUCT</button>
      </div>
    </div>

    <div id="adminProductsGrid" class="admin-products-grid"></div>

    <div id="adminProductsEmpty" class="admin-products-empty" hidden>
      NO PRODUCTS FOUND
    </div>
  `;

  host.appendChild(wrapper);

  productSection = wrapper;
  productList = wrapper.querySelector("#adminProductsGrid");
  productEmpty = wrapper.querySelector("#adminProductsEmpty");
  productSearch = wrapper.querySelector("#adminProductSearch");

  wrapper
    .querySelector("#adminAddProductBtn")
    .addEventListener("click", () => openProductEditor());

  productSearch.addEventListener("input", renderProducts);

  buildEditorModal();
}

function buildEditorModal() {
  if (document.getElementById("adminProductEditor")) return;

  const modal = document.createElement("div");
  modal.id = "adminProductEditor";
  modal.className = "admin-product-editor";
  modal.hidden = true;

  modal.innerHTML = `
    <div class="admin-product-editor-backdrop" data-close-product-editor></div>

    <div class="admin-product-editor-box">
      <button
        type="button"
        class="admin-product-editor-close"
        id="adminProductEditorClose"
        aria-label="Close"
      >×</button>

      <div class="admin-product-editor-header">
        <div class="admin-product-editor-kicker">PRODUCT MANAGEMENT</div>
        <h2 id="adminProductFormTitle">ADD PRODUCT</h2>
      </div>

      <form id="adminProductForm" class="admin-product-form">

        <div class="admin-product-form-field">
          <label for="adminProductName">PRODUCT NAME</label>
          <input id="adminProductName" name="name" required maxlength="160">
        </div>

        <div class="admin-product-form-field">
          <label for="adminProductSlug">SLUG</label>
          <input id="adminProductSlug" name="slug" maxlength="180">
        </div>

        <div class="admin-product-form-field full">
          <label for="adminProductDescription">DESCRIPTION</label>
          <textarea id="adminProductDescription" name="description" maxlength="2000"></textarea>
        </div>

        <div class="admin-product-form-row">
          <div class="admin-product-form-field">
            <label for="adminProductPrice">PRICE</label>
            <input id="adminProductPrice" name="price" type="number" min="0" step="1" required>
          </div>

          <div class="admin-product-form-field">
            <label for="adminProductStock">STOCK</label>
            <input id="adminProductStock" name="stock" type="number" min="0" step="1" required>
          </div>
        </div>

        <div class="admin-product-form-field">
          <label for="adminProductCategory">CATEGORY</label>
          <select id="adminProductCategory" name="category_id">
            <option value="">NO CATEGORY</option>
          </select>
        </div>

        <div class="admin-product-form-field">
          <label for="adminProductType">TYPE</label>
          <input id="adminProductType" name="type" maxlength="80" placeholder="necklace / pendant / ring">
        </div>

        <div class="admin-product-form-field">
          <label for="adminProductMaterial">MATERIAL</label>
          <input id="adminProductMaterial" name="material" maxlength="120" placeholder="Stainless Steel">
        </div>

        <div class="admin-product-form-field">
          <label for="adminProductSize">DEFAULT SIZE</label>
          <input id="adminProductSize" name="size" maxlength="60" value="One Size">
        </div>

        <div class="admin-product-form-field full">
          <label for="adminProductSku">SKU</label>
          <input id="adminProductSku" name="sku" maxlength="120" placeholder="PRODUCT-001">
        </div>

        <div class="admin-product-image-preview" id="adminProductImagePreview">
          <span id="adminProductImagePreviewText">NO IMAGE SELECTED</span>
        </div>

        <div class="admin-product-form-field full">
          <label for="adminProductImage">PRODUCT IMAGE</label>
          <input id="adminProductImage" name="image" type="file" accept="image/*">
        </div>

        <div class="admin-product-form-switch">
          <span>PRODUCT ACTIVE / VISIBLE IN SHOP</span>
          <label class="admin-product-toggle">
            <input id="adminProductActive" name="is_active" type="checkbox" checked>
            <span class="admin-product-toggle-track"></span>
          </label>
        </div>

        <div class="admin-product-form-footer">
          <button id="adminProductCancelBtn" type="button" class="admin-product-form-cancel">CANCEL</button>
          <button id="adminProductSubmitBtn" type="submit" class="admin-product-form-submit">SAVE PRODUCT</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  productFormModal = modal;
  productForm = modal.querySelector("#adminProductForm");
  productFormTitle = modal.querySelector("#adminProductFormTitle");
  productSubmitButton = modal.querySelector("#adminProductSubmitBtn");
  productFileInput = modal.querySelector("#adminProductImage");
  productImagePreview = modal.querySelector("#adminProductImagePreview");
  productImagePreviewText = modal.querySelector("#adminProductImagePreviewText");
  productCategorySelect = modal.querySelector("#adminProductCategory");
  productActiveInput = modal.querySelector("#adminProductActive");

  modal.querySelector("#adminProductEditorClose").addEventListener("click", closeProductEditor);
  modal.querySelector("#adminProductCancelBtn").addEventListener("click", closeProductEditor);
  modal.querySelectorAll("[data-close-product-editor]").forEach((el) => {
    el.addEventListener("click", closeProductEditor);
  });

  productFileInput.addEventListener("change", handleImagePreview);
  productForm.addEventListener("submit", handleProductSubmit);

  modal.addEventListener("click", (event) => event.stopPropagation());
}

function renderCategoryOptions(selectedId = "") {
  if (!productCategorySelect) return;

  productCategorySelect.innerHTML = `
    <option value="">NO CATEGORY</option>
  `;

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = String(category.id);
    option.textContent = category.name || category.slug || `Category ${category.id}`;
    if (String(category.id) === String(selectedId ?? "")) {
      option.selected = true;
    }
    productCategorySelect.appendChild(option);
  });
}

/* =========================================================
   PRODUCT RENDERING
   ========================================================= */

function getFilteredProducts() {
  const query = String(productSearch?.value || "").trim().toLowerCase();
  if (!query) return products;

  return products.filter((product) => {
    const categoryName = product.categories?.name || "";
    return [
      product.name,
      product.slug,
      product.type,
      product.material,
      categoryName,
      ...product.product_variants.map((variant) => variant.sku),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });
}

function renderProducts() {
  if (!productList || !productEmpty) return;

  const visible = getFilteredProducts();
  productList.innerHTML = "";

  productEmpty.hidden = visible.length !== 0;

  visible.forEach((product) => {
    const card = document.createElement("article");
    card.className = "admin-product-card";

    const primaryImage = product.product_images?.[0];
    const imageUrl = getPublicImageUrl(primaryImage?.storage_path);
    const active = product.is_active === true;

    const variant = product.product_variants?.[0];
    const stock = Number(product.stock ?? variant?.stock ?? 0);
    const price = product.price ?? variant?.price ?? 0;
    const categoryName = product.categories?.name || "NO CATEGORY";

    card.innerHTML = `
      <div class="admin-product-image">
        ${imageUrl
          ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy">`
          : `<div class="admin-product-image-placeholder">N</div>`}
        <span class="admin-product-active-badge ${active ? "" : "inactive"}">
          ${active ? "ACTIVE" : "HIDDEN"}
        </span>
      </div>

      <div class="admin-product-body">
        <p class="admin-product-category">${escapeHtml(categoryName)}</p>
        <h3 class="admin-product-name">${escapeHtml(product.name)}</h3>

        <div class="admin-product-meta">
          <div>
            <span>PRICE</span>
            <strong>${formatPrice(price)}</strong>
          </div>
          <div>
            <span>STOCK</span>
            <strong>${new Intl.NumberFormat("fa-IR").format(stock)}</strong>
          </div>
        </div>

        <div class="admin-product-actions">
          <button
            type="button"
            class="admin-product-edit-button"
            data-edit-product="${escapeHtml(product.id)}"
          >EDIT</button>
          <button
            type="button"
            class="admin-product-archive-button"
            data-archive-product="${escapeHtml(product.id)}"
          >${active ? "HIDE" : "RESTORE"}</button>
        </div>
      </div>
    `;

    productList.appendChild(card);
  });
}

/* =========================================================
   EDITOR
   ========================================================= */

function resetEditor() {
  editingProductId = null;
  editingVariantId = null;
  editingImagePath = null;
  productForm.reset();
  productActiveInput.checked = STATUS_ACTIVE;
  renderCategoryOptions("");
  productImagePreview.innerHTML = "";
  productImagePreviewText = null;
  const text = document.createElement("span");
  text.textContent = "NO IMAGE SELECTED";
  productImagePreview.appendChild(text);
  productSubmitButton.textContent = "SAVE PRODUCT";
}

function openProductEditor(productId = null) {
  resetEditor();

  if (productId === null) {
    productFormTitle.textContent = "ADD PRODUCT";
    productFormModal.hidden = false;
    document.body.style.overflow = "hidden";
    return;
  }

  const product = products.find(
    (item) => Number(item.id) === Number(productId)
  );

  if (!product) return;

  const variant = product.product_variants?.[0] || null;
  const image = product.product_images?.[0] || null;

  editingProductId = product.id;
  editingVariantId = variant?.id ?? null;
  editingImagePath = image?.storage_path ?? null;

  productFormTitle.textContent = "EDIT PRODUCT";

  productForm.elements.name.value = product.name || "";
  productForm.elements.slug.value = product.slug || "";
  productForm.elements.description.value = product.description || "";
  productForm.elements.price.value = product.price ?? variant?.price ?? 0;
  productForm.elements.stock.value = product.stock ?? variant?.stock ?? 0;
  productForm.elements.type.value = product.type || "";
  productForm.elements.material.value = product.material || "";
  productForm.elements.size.value = variant?.size || "One Size";
  productForm.elements.sku.value = variant?.sku || "";
  productActiveInput.checked = product.is_active !== false;

  renderCategoryOptions(product.category_id ?? product.categories?.id ?? "");

  const imageUrl = getPublicImageUrl(image?.storage_path);
  if (imageUrl) showImagePreview(imageUrl);

  productFormModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeProductEditor() {
  if (!productFormModal) return;
  productFormModal.hidden = true;
  document.body.style.overflow = "";
}

function showImagePreview(src) {
  productImagePreview.innerHTML = "";
  const img = document.createElement("img");
  img.src = src;
  img.alt = "Product preview";
  productImagePreview.appendChild(img);
}

function handleImagePreview() {
  const file = productFileInput.files?.[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  showImagePreview(url);
}

/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

function getFileExtension(file) {
  const name = String(file?.name || "");
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "jpg";
}

async function uploadProductImage(slug, file) {
  const extension = getFileExtension(file);
  const safeSlug = slugify(slug) || `product-${Date.now()}`;
  const storagePath = `${safeSlug}/main-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) throw uploadError;

  const publicUrl = getPublicImageUrl(storagePath);

  return {
    storagePath,
    publicUrl,
  };
}

async function saveImageRecord(productId, storagePath, altText) {
  const { data: existingPrimary } = await supabase
    .from("product_images")
    .select("id, storage_path, is_primary, sort_order")
    .eq("product_id", productId)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingPrimary?.id) {
    const { error } = await supabase
      .from("product_images")
      .update({
        storage_path: storagePath,
        alt_text: altText || null,
        is_primary: true,
        sort_order: 0,
      })
      .eq("id", existingPrimary.id);

    if (error) throw error;
    return existingPrimary.storage_path || null;
  }

  const { error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      storage_path: storagePath,
      alt_text: altText || null,
      is_primary: true,
      sort_order: 0,
    });

  if (error) throw error;
  return null;
}

async function removeStorageFile(storagePath) {
  if (!storagePath) return;

  const path = String(storagePath)
    .replace(/^\/+/, "")
    .replace(/^product-images\//, "");

  const { error } = await supabase.storage
    .from("product-images")
    .remove([path]);

  if (error) {
    console.warn("Old product image could not be removed:", error);
  }
}

/* =========================================================
   SAVE PRODUCT
   ========================================================= */

async function handleProductSubmit(event) {
  event.preventDefault();

  const formData = new FormData(productForm);

  const name = String(formData.get("name") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const slug = slugify(slugInput || name);
  const description = String(formData.get("description") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const material = String(formData.get("material") || "").trim();
  const categoryValue = String(formData.get("category_id") || "").trim();
  const size = String(formData.get("size") || "One Size").trim() || "One Size";
  const sku = String(formData.get("sku") || "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const isActive = productActiveInput.checked;
  const imageFile = productFileInput.files?.[0] || null;

  if (!name) {
    showProductMessage("Product name is required.", "error");
    return;
  }

  if (!slug) {
    showProductMessage("A valid English slug is required.", "error");
    return;
  }

  if (!Number.isFinite(price) || price < 0) {
    showProductMessage("Enter a valid price.", "error");
    return;
  }

  if (!Number.isInteger(stock) || stock < 0) {
    showProductMessage("Enter a valid stock value.", "error");
    return;
  }

  productSubmitButton.disabled = true;
  productSubmitButton.textContent = "SAVING...";

  try {
    const categoryId = categoryValue ? Number(categoryValue) : null;

    let productId = editingProductId;

    const productPayload = {
      name,
      slug,
      description: description || null,
      type: type || null,
      price,
      stock,
      material: material || null,
      category_id: Number.isInteger(categoryId) ? categoryId : null,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    if (productId === null) {
      const { data, error } = await supabase
        .from("products")
        .insert(productPayload)
        .select("id")
        .single();

      if (error) throw error;
      productId = data.id;
    } else {
      const { error } = await supabase
        .from("products")
        .update(productPayload)
        .eq("id", productId);

      if (error) throw error;
    }

    let variantId = editingVariantId;

    const variantPayload = {
      product_id: productId,
      size,
      sku: sku || null,
      stock,
      price,
    };

    if (variantId === null) {
      const { data, error } = await supabase
        .from("product_variants")
        .insert(variantPayload)
        .select("id")
        .single();

      if (error) throw error;
      variantId = data.id;
    } else {
      const { error } = await supabase
        .from("product_variants")
        .update(variantPayload)
        .eq("id", variantId);

      if (error) throw error;
    }

    if (imageFile) {
      const uploaded = await uploadProductImage(slug, imageFile);
      const oldPath = await saveImageRecord(productId, uploaded.storagePath, name);

      if (oldPath && oldPath !== uploaded.storagePath) {
        await removeStorageFile(oldPath);
      }
    }

    await loadProducts();
    renderProducts();
    closeProductEditor();

    showProductMessage(
      editingProductId === null
        ? "Product created successfully."
        : "Product updated successfully.",
      "success"
    );
  } catch (error) {
    console.error("Product save failed:", error);
    showProductMessage(error?.message || "Product could not be saved.", "error");
  } finally {
    productSubmitButton.disabled = false;
    productSubmitButton.textContent = editingProductId === null
      ? "SAVE PRODUCT"
      : "SAVE CHANGES";
  }
}

/* =========================================================
   ARCHIVE / RESTORE
   ========================================================= */

async function toggleProductActive(productId) {
  const product = products.find(
    (item) => Number(item.id) === Number(productId)
  );

  if (!product) return;

  const nextActive = product.is_active !== true;

  const actionText = nextActive ? "restore" : "hide";
  const confirmed = window.confirm(
    nextActive
      ? `Restore ${product.name} to the shop?`
      : `Hide ${product.name} from the shop?`
  );

  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from("products")
      .update({
        is_active: nextActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (error) throw error;

    product.is_active = nextActive;
    renderProducts();

    showProductMessage(
      nextActive
        ? "Product restored to the shop."
        : "Product hidden from the shop.",
      "success"
    );
  } catch (error) {
    console.error(`Product ${actionText} failed:`, error);
    showProductMessage(error?.message || `Could not ${actionText} product.`, "error");
  }
}

/* =========================================================
   EVENTS
   ========================================================= */

function setupProductEvents() {
  productList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-product]");
    if (editButton) {
      openProductEditor(editButton.dataset.editProduct);
      return;
    }

    const archiveButton = event.target.closest("[data-archive-product]");
    if (archiveButton) {
      toggleProductActive(archiveButton.dataset.archiveProduct);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && productFormModal && !productFormModal.hidden) {
      closeProductEditor();
    }
  });
}

/* =========================================================
   INIT
   ========================================================= */

async function initProductManagement() {
  try {
    currentUser = await getCurrentUser();

    if (!currentUser) return;

    const admin = await isCurrentUserAdmin();
    if (!admin) return;

    buildProductSection();
    renderCategoryOptions("");

    await Promise.all([
      loadCategories(),
      loadProducts(),
    ]);

    renderCategoryOptions("");
    renderProducts();
    setupProductEvents();
  } catch (error) {
    console.error("Product management initialization failed:", error);
  }
}

initProductManagement();
