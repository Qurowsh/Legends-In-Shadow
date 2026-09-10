import { supabase } from "./js/supabase.js";

let currentUser = null;
let orders = [];
let orderItems = [];
let payments = [];
let selectedOrderId = null;

const $ = (id) => document.getElementById(id);

function money(value) { return `${new Intl.NumberFormat("fa-IR").format(Math.round(Number(value)||0))} تومان`; }
function date(value) { if (!value) return "—"; const d=new Date(value); return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat("fa-IR",{year:"numeric",month:"long",day:"numeric"}).format(d); }
function datetime(value) { if (!value) return "—"; const d=new Date(value); return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat("fa-IR",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(d); }
function esc(value){return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
function statusLabel(s){return ({pending:"PENDING",confirmed:"CONFIRMED",processing:"PROCESSING",shipped:"SHIPPED",delivered:"DELIVERED",cancelled:"CANCELLED"}[s]||String(s||"").toUpperCase());}
function paymentLabel(s){return ({pending:"در انتظار بررسی",paid:"تأیید شده",failed:"رد شده",cancelled:"لغو شده",refunded:"مرجوع شده"}[s]||s||"—");}
function adminError(message){const modal=$("adminErrorModal"); if($("adminErrorModalText")) $("adminErrorModalText").textContent=message||"خطایی رخ داد."; if(modal) modal.hidden=false;}
function closeAdminError(){if($("adminErrorModal")) $("adminErrorModal").hidden=true;}
function success(){if($("adminSuccessModal")) $("adminSuccessModal").hidden=false;}
function closeSuccess(){if($("adminSuccessModal")) $("adminSuccessModal").hidden=true;}

async function getUser(){const {data:{user},error}=await supabase.auth.getUser();if(error) throw error;return user||null;}
async function isAdmin(){if(!currentUser)return false;const {data,error}=await supabase.from("profiles").select("role").eq("id",currentUser.id).maybeSingle();if(error)throw error;return data?.role==="admin";}

async function loadOrders(){const {data,error}=await supabase.from("orders").select("id,user_id,status,payment_status,subtotal,shipping,tax,discount,total,currency,shipping_name,shipping_phone,shipping_address,created_at,updated_at").order("created_at",{ascending:false});if(error)throw error;orders=data||[];}
async function loadItems(){if(!orders.length){orderItems=[];return;}const ids=orders.map(o=>o.id);const {data,error}=await supabase.from("order_items").select("id,order_id,product_variant_id,product_name,sku,quantity,unit_price,total_price,created_at").in("order_id",ids).order("id",{ascending:true});if(error)throw error;orderItems=data||[];}
async function loadPayments(){if(!orders.length){payments=[];return;}const ids=orders.map(o=>o.id);const {data,error}=await supabase.from("payments").select("id,order_id,user_id,amount,gateway,authority,transaction_id,status,receipt_path,admin_note,created_at,paid_at").in("order_id",ids).order("created_at",{ascending:false});if(error)throw error;payments=data||[];}

function paymentFor(orderId){return payments.find(p=>Number(p.order_id)===Number(orderId));}

function renderStats(){const n=s=>orders.filter(o=>String(o.status||"pending").toLowerCase()===s).length;$("totalOrders").textContent=new Intl.NumberFormat("fa-IR").format(orders.length);$("pendingOrders").textContent=new Intl.NumberFormat("fa-IR").format(n("pending"));$("processingOrders").textContent=new Intl.NumberFormat("fa-IR").format(n("processing"));$("deliveredOrders").textContent=new Intl.NumberFormat("fa-IR").format(n("delivered"));}

function renderOrders(){const filter=$("statusFilter")?.value||"all";const list=orders.filter(o=>filter==="all"||String(o.status||"").toLowerCase()===filter);const box=$("adminOrdersList");if(!box)return;box.innerHTML="";$("visibleOrderCount").textContent=new Intl.NumberFormat("fa-IR").format(list.length);$("adminOrdersEmpty").hidden=!!list.length;list.forEach(o=>{const p=paymentFor(o.id);const el=document.createElement("article");el.className="admin-order-item";const s=String(o.status||"pending").toLowerCase();const ps=p?.status||o.payment_status||"unpaid";el.innerHTML=`<div class="admin-order-main"><strong class="admin-order-id">ORDER #${esc(o.id)}</strong><span class="admin-customer">${esc(o.shipping_name||"Unknown customer")}</span><span class="admin-order-date">${date(o.created_at)}</span></div><div class="admin-order-right"><strong class="admin-order-total">${money(o.total)}</strong><span class="admin-status ${esc(s)}">${esc(statusLabel(s))}</span>${p?.gateway==="card_to_card"&&p.status==="pending"?`<span class="admin-payment-pending">رسید در انتظار بررسی</span>`:`<span class="admin-payment-state">${esc(paymentLabel(ps))}</span>`}<button type="button" class="admin-view-button" data-order-id="${esc(o.id)}">VIEW</button></div>`;box.appendChild(el);});}

async function receiptUrl(path){if(!path)return "";const {data,error}=await supabase.storage.from("payment_receipts").createSignedUrl(path,600);if(error)throw error;return data?.signedUrl||"";}

async function renderPaymentSection(order){
    const old=$("adminPaymentSection"); if(old)old.remove();
    const section=document.createElement("section");section.id="adminPaymentSection";section.className="admin-detail-section";
    const payment=paymentFor(order.id);
    if(!payment){section.innerHTML=`<div class="admin-detail-title">PAYMENT</div><p>برای این سفارش هنوز پرداختی ثبت نشده است.</p>`;$("adminModalItems").closest("section")?.after(section);return;}
    section.innerHTML=`<div class="admin-detail-title">PAYMENT</div><div class="admin-payment-panel"><div class="admin-payment-grid"><div><span>METHOD</span><strong>${esc(payment.gateway||"unknown")}</strong></div><div><span>AMOUNT</span><strong>${money(payment.amount)}</strong></div><div><span>STATUS</span><strong>${esc(paymentLabel(payment.status))}</strong></div><div><span>CREATED</span><strong>${datetime(payment.created_at)}</strong></div></div><div id="adminReceiptArea" class="admin-receipt-area"></div></div>`;
    $("adminModalItems").closest("section")?.after(section);
    const area=$("adminReceiptArea");
    if(payment.gateway!=="card_to_card"){area.innerHTML=`<p>درگاه: ${esc(payment.gateway||"unknown")}</p>`;return;}
    if(payment.receipt_path){
        try{const url=await receiptUrl(payment.receipt_path);area.innerHTML=`<div class="admin-receipt-heading">رسید پرداخت</div><a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="admin-receipt-link">مشاهده رسید</a><img src="${esc(url)}" alt="Payment receipt" class="admin-receipt-image">${payment.admin_note?`<p class="admin-receipt-note">یادداشت: ${esc(payment.admin_note)}</p>`:""}`;}catch(e){area.innerHTML=`<p>امکان دریافت رسید وجود ندارد.</p>`;}
    }else{area.innerHTML=`<p>کاربر هنوز رسیدی ارسال نکرده است.</p>`;}
    if(payment.status==="pending"){
        const actions=document.createElement("div");actions.className="admin-payment-actions";actions.innerHTML=`<button type="button" id="approvePaymentBtn" class="admin-payment-approve">تأیید پرداخت</button><button type="button" id="rejectPaymentBtn" class="admin-payment-reject">رد پرداخت</button>`;area.appendChild(actions);
        $("approvePaymentBtn").addEventListener("click",()=>approvePayment(payment.id));
        $("rejectPaymentBtn").addEventListener("click",()=>rejectPayment(payment.id));
    }
}

async function showOrder(id){const order=orders.find(o=>Number(o.id)===Number(id));if(!order)return;selectedOrderId=order.id;$("adminModalOrderTitle").textContent=`ORDER #${order.id}`;const s=String(order.status||"pending").toLowerCase();$("adminModalStatus").className=`admin-status ${s}`;$("adminModalStatus").textContent=statusLabel(s);$("adminStatusSelect").value=s;$("adminCustomerName").textContent=order.shipping_name||"—";$("adminCustomerPhone").textContent=order.shipping_phone||"—";$("adminCustomerAddress").textContent=order.shipping_address||"—";const items=orderItems.filter(i=>Number(i.order_id)===Number(order.id));$("adminModalItems").innerHTML=items.length?items.map(i=>`<div class="admin-modal-item"><div><div class="admin-modal-item-name">${esc(i.product_name)}</div><div class="admin-modal-item-meta">${i.sku?`SKU: ${esc(i.sku)} · `:""}${money(i.unit_price)}</div></div><span class="admin-modal-item-quantity">×${new Intl.NumberFormat("fa-IR").format(i.quantity)}</span><strong class="admin-modal-item-total">${money(i.total_price)}</strong></div>`).join(""):"<p>NO ITEMS FOUND</p>";$("adminModalSubtotal").textContent=money(order.subtotal);$("adminModalShipping").textContent=money(order.shipping);$("adminModalTax").textContent=money(order.tax);$("adminModalDiscount").textContent=order.discount>0?`-${money(order.discount)}`:money(0);$("adminModalTotal").textContent=money(order.total);$("adminModalCreatedAt").textContent=datetime(order.created_at);$("adminOrderModal").hidden=false;document.body.style.overflow="hidden";await renderPaymentSection(order);}
function hideOrder(){if($("adminOrderModal"))$("adminOrderModal").hidden=true;selectedOrderId=null;document.body.style.overflow="";}

async function approvePayment(paymentId){const btn=$("approvePaymentBtn");if(btn)btn.disabled=true;try{const {data,error}=await supabase.rpc("admin_confirm_card_payment",{p_payment_id:paymentId});if(error)throw error;if(data!==true)throw new Error("Payment approval failed");await refresh();if(selectedOrderId)await showOrder(selectedOrderId);success();}catch(e){console.error(e);adminError(e?.message||"تأیید پرداخت انجام نشد.");}finally{if(btn)btn.disabled=false;}}
async function rejectPayment(paymentId){const note=window.prompt("دلیل رد پرداخت را وارد کنید (اختیاری):","");if(note===null)return;const btn=$("rejectPaymentBtn");if(btn)btn.disabled=true;try{const {data,error}=await supabase.rpc("admin_reject_card_payment",{p_payment_id:paymentId,p_admin_note:note||null});if(error)throw error;if(data!==true)throw new Error("Payment rejection failed");await refresh();if(selectedOrderId)await showOrder(selectedOrderId);success();}catch(e){console.error(e);adminError(e?.message||"رد پرداخت انجام نشد.");}finally{if(btn)btn.disabled=false;}}

async function updateStatus(){if(selectedOrderId==null)return;const btn=$("updateStatusBtn");const status=$("adminStatusSelect").value;btn.disabled=true;try{const {data,error}=await supabase.rpc("admin_update_order_status",{p_order_id:selectedOrderId,p_status:status});if(error)throw error;if(data!==true)throw new Error("Status update failed");await refresh();await showOrder(selectedOrderId);success();}catch(e){console.error(e);adminError(e?.message||"تغییر وضعیت انجام نشد.");}finally{btn.disabled=false;}}

function injectPaymentStyles(){if($("adminPaymentInlineStyles"))return;const s=document.createElement("style");s.id="adminPaymentInlineStyles";s.textContent=`.admin-payment-panel{margin-top:1em;padding:1em;border:1px solid rgba(255,255,255,.1);border-radius:.8em;background:rgba(255,255,255,.025)}.admin-payment-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8em}.admin-payment-grid div{display:flex;flex-direction:column;gap:.25em}.admin-payment-grid span{font-size:.6em;color:rgba(255,255,255,.35)}.admin-payment-grid strong{font-size:.72em;color:#fff}.admin-receipt-area{margin-top:1em}.admin-receipt-image{display:block;max-width:100%;max-height:28em;margin-top:.8em;border:1px solid rgba(255,255,255,.12);border-radius:.5em}.admin-receipt-link{display:inline-block;margin-top:.5em;color:#fff}.admin-payment-actions{display:flex;gap:.7em;margin-top:1em}.admin-payment-actions button{flex:1;min-height:3em;border:1px solid rgba(255,255,255,.2);border-radius:.5em;cursor:pointer}.admin-payment-approve{background:#fff;color:#000}.admin-payment-reject{background:transparent;color:#fff}.admin-payment-pending{color:#fff;font-size:.6em}.admin-payment-state{color:rgba(255,255,255,.35);font-size:.6em}@media(max-width:650px){.admin-payment-grid{grid-template-columns:1fr}.admin-payment-actions{flex-direction:column}}`;document.head.appendChild(s);}

async function refresh(){await loadOrders();await loadItems();await loadPayments();renderStats();renderOrders();}
function setup(){
    $("statusFilter")?.addEventListener("change",renderOrders);$("refreshOrdersBtn")?.addEventListener("click",refresh);
    $("adminOrdersList")?.addEventListener("click",e=>{const b=e.target.closest(".admin-view-button");if(b)showOrder(b.dataset.orderId);});
    $("closeAdminModal")?.addEventListener("click",hideOrder);document.querySelector("[data-close-admin-modal]")?.addEventListener("click",hideOrder);$("updateStatusBtn")?.addEventListener("click",updateStatus);
    $("adminSuccessOk")?.addEventListener("click",closeSuccess);document.querySelector("[data-close-success]")?.addEventListener("click",closeSuccess);$("closeAdminError")?.addEventListener("click",closeAdminError);$("adminErrorOk")?.addEventListener("click",closeAdminError);document.querySelector("[data-close-admin-error]")?.addEventListener("click",closeAdminError);
    $("adminLogoutBtn")?.addEventListener("click",async()=>{try{await supabase.auth.signOut();location.href="index-shop.html";}catch(e){adminError("خروج از حساب انجام نشد.");}});
    document.addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(!$("adminOrderModal")?.hidden)hideOrder();if(!$("adminSuccessModal")?.hidden)closeSuccess();if(!$("adminErrorModal")?.hidden)closeAdminError();});
}

async function init(){injectPaymentStyles();const err=$("adminError"),errText=$("adminErrorText"),content=$("adminContent");try{currentUser=await getUser();if(!currentUser){location.href="login.html?redirect=admin.html";return;}if(!(await isAdmin())){if(content)content.hidden=true;if(err){err.hidden=false;errText.textContent="این صفحه فقط برای Admin قابل دسترسی است."}return;}await refresh();setup();if(content)content.hidden=false;}catch(e){console.error(e);if(content)content.hidden=true;if(err){err.hidden=false;errText.textContent="خطا در بارگذاری پنل مدیریت.";}}}
init();
