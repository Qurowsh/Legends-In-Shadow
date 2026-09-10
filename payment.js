import { supabase } from "./js/supabase.js";

const $ = (id) => document.getElementById(id);
const money = (v) => `${new Intl.NumberFormat("fa-IR").format(Math.round(Number(v) || 0))} تومان`;
const esc = (v) => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");

let user = null;
let payment = null;
let order = null;

function setStatus(text, type = "info") {
    const el = $("paymentStatus");
    if (!el) return;
    el.textContent = text;
    el.className = `payment-status ${type}`;
}

function showError(message) {
    $("paymentLoading").hidden = true;
    $("paymentContent").hidden = true;
    $("paymentError").hidden = false;
    $("paymentErrorText").textContent = message;
}

async function loadPayment() {
    const paymentId = Number(sessionStorage.getItem("lastPaymentId"));
    const orderId = Number(sessionStorage.getItem("lastOrderId"));
    if (!paymentId || !orderId) throw new Error("شناسه سفارش یا پرداخت پیدا نشد. از صفحه سفارش‌ها وارد شوید.");

    const [{ data: p, error: pe }, { data: o, error: oe }] = await Promise.all([
        supabase.from("payments").select("id,order_id,amount,gateway,status,receipt_path,admin_note").eq("id", paymentId).single(),
        supabase.from("orders").select("id,total,payment_status,status").eq("id", orderId).single()
    ]);
    if (pe) throw pe;
    if (oe) throw oe;
    if (!p || Number(p.order_id) !== orderId) throw new Error("اطلاعات پرداخت معتبر نیست.");
    payment = p;
    order = o;
}

async function loadSettings() {
    const { data, error } = await supabase.rpc("get_payment_settings");
    if (error) throw error;
    const settings = data || {};
    const rows = [["بانک",settings.bank_name],["شماره کارت",settings.card_number],["به نام",settings.card_holder],["شماره شبا",settings.iban]].filter(([,v]) => v);
    $("paymentDetails").innerHTML = rows.length ? rows.map(([label,value]) => `<div class="payment-detail-row"><span>${label}</span><strong>${esc(value)}</strong></div>`).join("") : `<div class="payment-empty">اطلاعات کارت توسط مدیریت تنظیم نشده است.</div>`;
}

function render() {
    $("paymentOrderId").textContent = order.id;
    $("summaryOrderId").textContent = `#${order.id}`;
    $("summaryTotal").textContent = money(order.total);
    $("paymentAmount").textContent = money(order.total);
    const pending = payment.status === "pending" && !payment.receipt_path;
    const submitted = Boolean(payment.receipt_path) || payment.status !== "pending";
    if (payment.status === "paid") {
        $("summaryStatus").textContent = "پرداخت تأیید شد";
        setStatus("پرداخت شما تأیید شده و سفارش در حال پردازش است.", "success");
    } else if (payment.status === "failed") {
        $("summaryStatus").textContent = "پرداخت رد شد";
        setStatus(payment.admin_note ? `رسید رد شد: ${payment.admin_note}` : "رسید پرداخت تأیید نشد.", "error");
    } else if (submitted) {
        $("summaryStatus").textContent = "در انتظار بررسی";
        setStatus("رسید شما ارسال شده و منتظر تأیید مدیریت است.", "success");
    } else {
        $("summaryStatus").textContent = "در انتظار پرداخت";
        setStatus("بعد از واریز، تصویر رسید را بارگذاری کنید.", "info");
    }
    $("paymentReceiptInput").disabled = !pending;
    $("submitReceiptBtn").disabled = true;
    if (!pending) $("submitReceiptBtn").textContent = payment.status === "paid" ? "پرداخت تأیید شد" : "رسید ارسال شده";
}

function previewFile(file) {
    const box = $("receiptPreview");
    if (!file) { box.hidden = true; box.innerHTML = ""; return; }
    const url = URL.createObjectURL(file);
    box.hidden = false;
    box.innerHTML = `<img src="${url}" alt="پیش‌نمایش رسید"><span>${esc(file.name)}</span>`;
}

async function submitReceipt() {
    const input = $("paymentReceiptInput");
    const file = input.files?.[0];
    if (!file || !payment || payment.status !== "pending") return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setStatus("فقط JPG، PNG یا WEBP مجاز است.", "error"); return; }
    if (file.size > 5 * 1024 * 1024) { setStatus("حجم رسید نباید بیشتر از ۵ مگابایت باشد.", "error"); return; }
    const btn = $("submitReceiptBtn");
    btn.disabled = true;
    setStatus("در حال ارسال رسید...", "info");
    try {
        const path = `${user.id}/${payment.id}/receipt.webp`;
        const { error: uploadError } = await supabase.storage.from("payment_receipts").upload(path, file, { contentType:file.type, upsert:true });
        if (uploadError) throw uploadError;
        const { error: rpcError } = await supabase.rpc("submit_payment_receipt", { p_payment_id:payment.id, p_receipt_path:path });
        if (rpcError) throw rpcError;
        payment.receipt_path = path;
        setStatus("رسید با موفقیت ارسال شد. منتظر تأیید مدیریت باشید.", "success");
        $("summaryStatus").textContent = "در انتظار بررسی";
        input.disabled = true;
        btn.textContent = "رسید ارسال شد ✓";
    } catch (e) {
        console.error(e);
        btn.disabled = false;
        setStatus(e?.message || "ارسال رسید ناموفق بود.", "error");
    }
}

async function init() {
    try {
        const { data:{session}, error } = await supabase.auth.getSession();
        if (error) throw error;
        user = session?.user;
        if (!user) { location.href = "login.html?redirect=payment.html"; return; }
        await loadPayment();
        if (payment.gateway !== "card_to_card") throw new Error("این پرداخت از نوع کارت‌به‌کارت نیست.");
        await loadSettings();
        render();
        $("paymentReceiptInput").addEventListener("change", (e) => {
            const file = e.target.files?.[0];
            previewFile(file);
            $("submitReceiptBtn").disabled = !file || payment.status !== "pending";
        });
        $("submitReceiptBtn").addEventListener("click", submitReceipt);
        $("paymentLoading").hidden = true;
        $("paymentContent").hidden = false;
    } catch (e) {
        console.error(e);
        showError(e?.message || "خطایی در بارگذاری صفحه پرداخت رخ داد.");
    }
}

init();
