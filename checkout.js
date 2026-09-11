import { supabase } from "./js/supabase.js";

const SHIPPING_COST = 150000;
let currentUser = null;
let cart = null;
let cartItems = [];
let products = [];
let promo = null;

const $ = (id) => document.getElementById(id);

function money(value) {
    return `${new Intl.NumberFormat("fa-IR").format(Math.round(Number(value) || 0))} تومان`;
}

function esc(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function errorMessage(message) {
    const text = String(message || "").toLowerCase();
    const map = [
        ["cart is empty", "سبد خرید شما خالی است."], ["cart not found", "سبد خرید پیدا نشد."],
        ["insufficient stock", "موجودی یکی از محصولات کافی نیست."], ["shipping name", "نام و نام خانوادگی الزامی است."],
        ["shipping phone", "شماره تماس الزامی است."], ["shipping address", "آدرس ارسال الزامی است."],
        ["must be logged in", "لطفاً ابتدا وارد حساب کاربری شوید."], ["active payment already exists", "برای این سفارش یک پرداخت فعال وجود دارد."]
    ];
    const found = map.find(([needle]) => text.includes(needle));
    return found ? found[1] : (message || "خطایی هنگام انجام عملیات رخ داد.");
}

function showError(message) {
    const modal = $("orderErrorModal");
    const text = $("orderErrorText");
    if (text) text.textContent = message;
    if (modal) modal.hidden = false;
}
function closeError() { if ($("orderErrorModal")) $("orderErrorModal").hidden = true; }

function getShipping() {
    const name = $("shippingName")?.value.trim() || "";
    const phone = $("shippingPhone")?.value.trim() || "";
    const address = $("shippingAddress")?.value.trim() || "";
    if (!name) { showError("لطفاً نام و نام خانوادگی گیرنده را وارد کنید."); $("shippingName")?.focus(); return null; }
    if (!phone) { showError("لطفاً شماره تماس را وارد کنید."); $("shippingPhone")?.focus(); return null; }
    if (!address) { showError("لطفاً آدرس کامل خود را وارد کنید."); $("shippingAddress")?.focus(); return null; }
    return { name, phone, address };
}

function getImage(path) {
    if (!path) return "";
    const raw = String(path).trim();
    if (/^https?:\/\//i.test(raw)) return raw;
    const clean = raw.replace(/^\/+/, "").replace(/^product-images\//i, "").replace(/^product_image\//i, "");
    return supabase.storage.from("product_image").getPublicUrl(clean).data?.publicUrl || "";
}

async function loadCart() {
    const { data: c, error: ce } = await supabase.from("carts").select("id,user_id").eq("user_id", currentUser.id).maybeSingle();
    if (ce) throw ce;
    if (!c) throw new Error("Cart not found");
    cart = c;
    const { data: items, error: ie } = await supabase.from("cart_items").select("id,cart_id,product_variant_id,quantity").eq("cart_id", c.id).order("created_at");
    if (ie) throw ie;
    cartItems = items || [];
    if (!cartItems.length) throw new Error("Cart is empty");
}

async function loadProducts() {
    const ids = cartItems.map(i => i.product_variant_id);
    const { data, error } = await supabase.from("product_variants").select(`id,product_id,size,sku,stock,price,products(id,name,is_active,product_images(id,storage_path,alt_text,is_primary,sort_order))`).in("id", ids);
    if (error) throw error;
    products = (data || []).map(v => {
        const p = Array.isArray(v.products) ? v.products[0] : v.products;
        const imgs = [...(p?.product_images || [])].sort((a,b) => Number(b.is_primary)-Number(a.is_primary) || Number(a.sort_order||0)-Number(b.sort_order||0));
        return { variantId:v.id, name:p?.name || "Product", size:v.size || "One Size", sku:v.sku || "", price:Number(v.price)||0, stock:Number(v.stock)||0, image:getImage(imgs[0]?.storage_path) };
    });
    if (!products.length) throw new Error("Products not found");
}
function productFor(item) { return products.find(p => Number(p.variantId) === Number(item.product_variant_id)); }
function subtotal() { return cartItems.reduce((s,i) => s + (productFor(i)?.price || 0) * (Number(i.quantity)||0), 0); }

async function refreshPromo() {
    try {
        const raw = sessionStorage.getItem("appliedPromo");
        if (!raw) { promo = null; return; }
        const stored = JSON.parse(raw);
        if (!stored?.code) { promo = null; return; }
        const { data, error } = await supabase.rpc("validate_promo_code", { p_code:stored.code, p_order_subtotal:subtotal() });
        if (error || !data?.valid) { sessionStorage.removeItem("appliedPromo"); promo = null; return; }
        promo = data;
        sessionStorage.setItem("appliedPromo", JSON.stringify(data));
    } catch { promo = null; }
}

function renderItems() {
    const box = $("checkoutItems");
    if (!box) return;
    box.innerHTML = cartItems.map(item => {
        const p = productFor(item); if (!p) return "";
        const qty = Number(item.quantity)||0;
        return `<article class="checkout-item"><div class="checkout-item-image">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}">` : `<div class="checkout-no-image">N</div>`}</div><div class="checkout-item-info"><h3>${esc(p.name)}</h3><p>SIZE: ${esc(p.size)}</p>${p.sku ? `<p>SKU: ${esc(p.sku)}</p>` : ""}<p>QTY: ${qty}</p></div><div class="checkout-item-price">${money(p.price*qty)}</div></article>`;
    }).join("");
}
function renderSummary() {
    const sub = subtotal();
    const discount = Math.min(Number(promo?.discount_amount)||0, sub);
    const total = Math.max(0, sub + SHIPPING_COST - discount);
    if ($("checkoutSubtotal")) $("checkoutSubtotal").textContent = money(sub);
    if ($("checkoutShipping")) $("checkoutShipping").textContent = money(SHIPPING_COST);
    if ($("checkoutTax")) $("checkoutTax").textContent = money(0);
    if ($("checkoutDiscount")) $("checkoutDiscount").textContent = discount ? `-${money(discount)}` : money(0);
    if ($("checkoutTotal")) $("checkoutTotal").textContent = money(total);
    if ($("checkoutCartCount")) $("checkoutCartCount").textContent = `(${new Intl.NumberFormat("fa-IR").format(cartItems.reduce((s,i)=>s+(Number(i.quantity)||0),0))})`;
}

async function placeOrder(event) {
    event?.preventDefault();
    if (!currentUser) { location.href = "login.html?redirect=checkout.html"; return; }
    const shipping = getShipping(); if (!shipping) return;
    const btn = $("placeOrderBtn"); const text = btn?.querySelector(".checkout-submit-text");
    const original = text?.textContent || "ثبت سفارش و ادامه پرداخت";
    try {
        if (btn) btn.disabled = true;
        if (text) text.textContent = "در حال ثبت سفارش...";
        await refreshPromo();
        const { data: orderId, error } = await supabase.rpc("create_order_from_cart", {
            p_shipping_name:shipping.name, p_shipping_phone:shipping.phone, p_shipping_address:shipping.address,
            p_promo_code:promo?.code || null, p_shipping:SHIPPING_COST, p_tax:0
        });
        if (error) throw error;
        if (!orderId) throw new Error("Order ID was not returned");
        sessionStorage.setItem("lastOrderId", String(orderId));
        if (text) text.textContent = "در حال آماده‌سازی پرداخت...";
        const { data: paymentId, error: paymentError } = await supabase.rpc("create_payment", { p_order_id:Number(orderId), p_gateway:"card_to_card" });
        if (paymentError) throw paymentError;
        if (!paymentId) throw new Error("Payment ID was not returned");
        sessionStorage.setItem("lastPaymentId", String(paymentId));
        sessionStorage.removeItem("appliedPromo");
        location.href = "payment.html";
    } catch (e) {
        console.error(e);
        showError(errorMessage(e?.message));
        if (btn) btn.disabled = false;
        if (text) text.textContent = original;
    }
}

async function init() {
    try {
        const { data:{session}, error } = await supabase.auth.getSession();
        if (error) throw error;
        currentUser = session?.user || null;
        if (!currentUser) { location.href = "login.html?redirect=checkout.html"; return; }
        await loadCart(); await loadProducts(); await refreshPromo();
        renderItems(); renderSummary();
        $("checkoutForm")?.addEventListener("submit", placeOrder);
        $("closeErrorModal")?.addEventListener("click", closeError);
        $("errorModalOk")?.addEventListener("click", closeError);
        document.querySelector("[data-close-error]")?.addEventListener("click", closeError);
        const content = $("checkoutContent"); if (content) content.hidden = false;
    } catch (e) {
        console.error(e);
        const section = $("checkoutPageError"); const text = $("checkoutPageErrorText");
        if (text) text.textContent = errorMessage(e?.message);
        if (section) section.hidden = false;
        if ($("checkoutContent")) $("checkoutContent").hidden = true;
    }
}

init();
