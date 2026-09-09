import { supabase } from "./js/supabase.js";


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;
let orders = [];
let orderItems = [];

let selectedOrderId = null;


/* =========================================================
   DOM
   ========================================================= */

let adminError;
let adminErrorText;
let adminContent;
const adminLogoutBtn =
    document.getElementById("adminLogoutBtn");

const totalOrders =
    document.getElementById("totalOrders");

const pendingOrders =
    document.getElementById("pendingOrders");

const processingOrders =
    document.getElementById("processingOrders");

const deliveredOrders =
    document.getElementById("deliveredOrders");

const adminOrdersList =
    document.getElementById("adminOrdersList");

const adminOrdersEmpty =
    document.getElementById("adminOrdersEmpty");

const statusFilter =
    document.getElementById("statusFilter");

const visibleOrderCount =
    document.getElementById("visibleOrderCount");

const refreshOrdersBtn =
    document.getElementById("refreshOrdersBtn");


/* Modal */

const adminOrderModal =
    document.getElementById("adminOrderModal");

const closeAdminModal =
    document.getElementById("closeAdminModal");

const adminModalOrderTitle =
    document.getElementById(
        "adminModalOrderTitle"
    );

const adminModalStatus =
    document.getElementById(
        "adminModalStatus"
    );

const adminCustomerName =
    document.getElementById(
        "adminCustomerName"
    );

const adminCustomerPhone =
    document.getElementById(
        "adminCustomerPhone"
    );

const adminCustomerAddress =
    document.getElementById(
        "adminCustomerAddress"
    );

const adminModalItems =
    document.getElementById(
        "adminModalItems"
    );

const adminModalSubtotal =
    document.getElementById(
        "adminModalSubtotal"
    );

const adminModalShipping =
    document.getElementById(
        "adminModalShipping"
    );

const adminModalTax =
    document.getElementById(
        "adminModalTax"
    );

const adminModalDiscount =
    document.getElementById(
        "adminModalDiscount"
    );

const adminModalTotal =
    document.getElementById(
        "adminModalTotal"
    );

const adminStatusSelect =
    document.getElementById(
        "adminStatusSelect"
    );

const updateStatusBtn =
    document.getElementById(
        "updateStatusBtn"
    );

const adminModalCreatedAt =
    document.getElementById(
        "adminModalCreatedAt"
    );


/* Success modal */

const adminSuccessModal =
    document.getElementById(
        "adminSuccessModal"
    );

const adminSuccessOk =
    document.getElementById(
        "adminSuccessOk"
    );


/* Error modal */

const adminErrorModal =
    document.getElementById(
        "adminErrorModal"
    );

const adminErrorModalText =
    document.getElementById(
        "adminErrorModalText"
    );

const closeAdminError =
    document.getElementById(
        "closeAdminError"
    );

const adminErrorOk =
    document.getElementById(
        "adminErrorOk"
    );


/* =========================================================
   HELPERS
   ========================================================= */

function formatPrice(value) {

    const price =
        Number(value) || 0;

    return `${new Intl.NumberFormat(
        "fa-IR"
    ).format(
        Math.round(price)
    )} تومان`;
}


function formatDate(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "fa-IR",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    ).format(date);
}


function formatDateTime(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "fa-IR",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);
}


function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   UI
   ========================================================= */

function showContent() {

    adminError.hidden =
        true;

    adminContent.hidden =
        false;
}


function showPageError(message) {

    adminContent.hidden =
        true;

    adminError.hidden =
        false;

    adminErrorText.textContent =
        message;
}

async function getCurrentUser() {

    const {
        data: {
            user
        },
        error
    } =
        await supabase.auth.getUser();

    if (error) {

        console.error(
            "Failed to get current user:",
            error
        );

        return null;
    }

    return user || null;
}


/* =========================================================
   ADMIN CHECK
   ========================================================= */

async function checkAdminAccess() {

    if (!currentUser) {
        return false;
    }

    const {
        data,
        error
    } =
        await supabase
            .from("profiles")
            .select("role")
            .eq(
                "id",
                currentUser.id
            )
            .maybeSingle();

    if (error) {

        console.error(
            "Failed to check admin role:",
            error
        );

        return false;
    }

    return (
        data?.role === "admin"
    );
}


/* =========================================================
   LOAD ORDERS
   ========================================================= */

async function loadOrders() {

    const {
        data,
        error
    } =
        await supabase
            .from("orders")
            .select(`
                id,
                user_id,
                status,
                subtotal,
                shipping,
                tax,
                discount,
                total,
                currency,
                shipping_name,
                shipping_phone,
                shipping_address,
                created_at,
                updated_at
            `)
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );

    if (error) {
        throw error;
    }

    orders =
        data || [];
}


/* =========================================================
   LOAD ORDER ITEMS
   ========================================================= */

async function loadOrderItems() {

    orderItems = [];

    if (
        orders.length === 0
    ) {
        return;
    }

    const orderIds =
        orders.map(
            order =>
                order.id
        );

    const {
        data,
        error
    } =
        await supabase
            .from("order_items")
            .select(`
                id,
                order_id,
                product_variant_id,
                product_name,
                sku,
                quantity,
                unit_price,
                total_price,
                created_at
            `)
            .in(
                "order_id",
                orderIds
            )
            .order(
                "id",
                {
                    ascending:
                        true
                }
            );

    if (error) {
        throw error;
    }

    orderItems =
        data || [];
}


/* =========================================================
   STATS
   ========================================================= */

function renderStats() {

    const countStatus = (
        status
    ) =>
        orders.filter(
            order =>
                String(
                    order.status ||
                    "pending"
                ).toLowerCase() ===
                status
        ).length;

    totalOrders.textContent =
        new Intl.NumberFormat(
            "fa-IR"
        ).format(
            orders.length
        );

    pendingOrders.textContent =
        new Intl.NumberFormat(
            "fa-IR"
        ).format(
            countStatus(
                "pending"
            )
        );

    processingOrders.textContent =
        new Intl.NumberFormat(
            "fa-IR"
        ).format(
            countStatus(
                "processing"
            )
        );

    deliveredOrders.textContent =
        new Intl.NumberFormat(
            "fa-IR"
        ).format(
            countStatus(
                "delivered"
            )
        );
}


/* =========================================================
   STATUS LABEL
   ========================================================= */

function getStatusLabel(
    status
) {

    const labels = {

        pending:
            "PENDING",

        confirmed:
            "CONFIRMED",

        processing:
            "PROCESSING",

        shipped:
            "SHIPPED",

        delivered:
            "DELIVERED",

        cancelled:
            "CANCELLED"

    };

    return (
        labels[status] ||
        String(
            status || ""
        ).toUpperCase()
    );
}


/* =========================================================
   FILTERED ORDERS
   ========================================================= */

function getFilteredOrders() {

    const filter =
        statusFilter.value;

    if (
        filter === "all"
    ) {
        return orders;
    }

    return orders.filter(
        order =>
            String(
                order.status ||
                "pending"
            ).toLowerCase() ===
            filter
    );
}


/* =========================================================
   RENDER ORDERS
   ========================================================= */

function renderOrders() {

    const filteredOrders =
        getFilteredOrders();

    adminOrdersList.innerHTML =
        "";

    visibleOrderCount.textContent =
        new Intl.NumberFormat(
            "fa-IR"
        ).format(
            filteredOrders.length
        );


    if (
        filteredOrders.length === 0
    ) {

        adminOrdersEmpty.hidden =
            false;

        return;
    }


    adminOrdersEmpty.hidden =
        true;


    filteredOrders.forEach(
        order => {

            const element =
                document.createElement(
                    "article"
                );

            element.className =
                "admin-order-item";


            const status =
                String(
                    order.status ||
                    "pending"
                ).toLowerCase();


            element.innerHTML = `
                <div class="admin-order-main">

                    <strong class="admin-order-id">
                        ORDER #${escapeHtml(
                order.id
            )}
                    </strong>

                    <span class="admin-customer">
                        ${escapeHtml(
                order.shipping_name ||
                "Unknown customer"
            )}
                    </span>

                    <span class="admin-order-date">
                        ${formatDate(
                order.created_at
            )}
                    </span>

                </div>


                <div class="admin-order-right">

                    <strong class="admin-order-total">
                        ${formatPrice(
                order.total
            )}
                    </strong>

                    <span
                        class="admin-status ${escapeHtml(
                status
            )}"
                    >
                        ${escapeHtml(
                getStatusLabel(
                    status
                )
            )}
                    </span>

                    <button
                        type="button"
                        class="admin-view-button"
                        data-order-id="${escapeHtml(
                order.id
            )}"
                    >
                        VIEW
                    </button>

                </div>
            `;


            adminOrdersList.appendChild(
                element
            );
        }
    );
}


/* =========================================================
   SHOW ORDER
   ========================================================= */

function showOrder(
    orderId
) {

    const order =
        orders.find(
            item =>
                Number(
                    item.id
                ) ===
                Number(
                    orderId
                )
        );

    if (!order) {
        return;
    }

    selectedOrderId =
        order.id;


    /* Header */

    adminModalOrderTitle.textContent =
        `ORDER #${order.id}`;


    const status =
        String(
            order.status ||
            "pending"
        ).toLowerCase();


    adminModalStatus.className =
        `admin-status ${status}`;

    adminModalStatus.textContent =
        getStatusLabel(
            status
        );


    adminStatusSelect.value =
        status;


    /* Customer */

    adminCustomerName.textContent =
        order.shipping_name ||
        "—";

    adminCustomerPhone.textContent =
        order.shipping_phone ||
        "—";

    adminCustomerAddress.textContent =
        order.shipping_address ||
        "—";


    /* Items */

    const items =
        orderItems.filter(
            item =>
                Number(
                    item.order_id
                ) ===
                Number(
                    order.id
                )
        );


    adminModalItems.innerHTML =
        "";


    if (
        items.length === 0
    ) {

        adminModalItems.innerHTML = `
            <div
                style="
                    padding: 1.5em 0;
                    color: rgba(255,255,255,.3);
                    text-align: center;
                    font-size: .65em;
                "
            >
                NO ITEMS FOUND
            </div>
        `;

    } else {

        items.forEach(
            item => {

                const element =
                    document.createElement(
                        "div"
                    );

                element.className =
                    "admin-modal-item";


                element.innerHTML = `
                    <div>

                        <div class="admin-modal-item-name">
                            ${escapeHtml(
                    item.product_name
                )}
                        </div>

                        <div class="admin-modal-item-meta">
                            ${item.sku
                        ? `SKU: ${escapeHtml(
                            item.sku
                        )}`
                        : ""
                    }

                            &nbsp; · &nbsp;

                            ${formatPrice(
                        item.unit_price
                    )}
                        </div>

                    </div>


                    <span class="admin-modal-item-quantity">
                        ×${new Intl.NumberFormat(
                        "fa-IR"
                    ).format(
                        item.quantity
                    )}
                    </span>


                    <strong class="admin-modal-item-total">
                        ${formatPrice(
                        item.total_price
                    )}
                    </strong>
                `;


                adminModalItems.appendChild(
                    element
                );
            }
        );
    }


    /* Summary */

    adminModalSubtotal.textContent =
        formatPrice(
            order.subtotal
        );

    adminModalShipping.textContent =
        formatPrice(
            order.shipping
        );

    adminModalTax.textContent =
        formatPrice(
            order.tax
        );

    adminModalDiscount.textContent =
        order.discount > 0
            ? `-${formatPrice(
                order.discount
            )}`
            : formatPrice(0);

    adminModalTotal.textContent =
        formatPrice(
            order.total
        );


    /* Date */

    adminModalCreatedAt.textContent =
        formatDateTime(
            order.created_at
        );


    adminOrderModal.hidden =
        false;

    document.body.style.overflow =
        "hidden";
}


/* =========================================================
   HIDE ORDER
   ========================================================= */

function hideOrder() {

    adminOrderModal.hidden =
        true;

    selectedOrderId =
        null;

    document.body.style.overflow =
        "";
}


/* =========================================================
   UPDATE STATUS
   ========================================================= */

async function updateOrderStatus() {

    if (
        selectedOrderId ===
        null
    ) {
        return;
    }

    const newStatus =
        adminStatusSelect.value;


    updateStatusBtn.disabled =
        true;

    const originalText =
        updateStatusBtn.textContent;

    updateStatusBtn.textContent =
        "UPDATING...";


    try {

        const {
            data,
            error
        } =
            await supabase.rpc(
                "admin_update_order_status",
                {
                    p_order_id:
                        selectedOrderId,

                    p_status:
                        newStatus
                }
            );


        if (error) {
            throw error;
        }


        if (
            data !== true
        ) {
            throw new Error(
                "Status update failed."
            );
        }


        /*
            Update local order state.
        */

        const order =
            orders.find(
                item =>
                    Number(
                        item.id
                    ) ===
                    Number(
                        selectedOrderId
                    )
            );


        if (order) {
            order.status =
                newStatus;

            order.updated_at =
                new Date().toISOString();
        }


        renderStats();

        renderOrders();


        /*
            Update modal status.
        */

        adminModalStatus.className =
            `admin-status ${newStatus}`;

        adminModalStatus.textContent =
            getStatusLabel(
                newStatus
            );


        showSuccess();

    } catch (error) {

        console.error(
            "Failed to update order status:",
            error
        );

        console.error("FULL STATUS ERROR:", error);

        showAdminError(
            JSON.stringify(
                error,
                null,
                2
            )
        );
    } finally {

        updateStatusBtn.disabled =
            false;

        updateStatusBtn.textContent =
            originalText;
    }
}


/* =========================================================
   ERROR TRANSLATION
   ========================================================= */

function translateAdminError(
    error
) {

    const message =
        String(
            error?.message || ""
        ).trim();

    const lower =
        message.toLowerCase();


    if (
        lower.includes(
            "admin access required"
        )
    ) {
        return (
            "شما دسترسی Admin ندارید."
        );
    }


    if (
        lower.includes(
            "order not found"
        )
    ) {
        return (
            "سفارش موردنظر پیدا نشد."
        );
    }


    if (
        lower.includes(
            "invalid order status"
        )
    ) {
        return (
            "وضعیت انتخاب‌شده معتبر نیست."
        );
    }


    return (
        message ||
        "تغییر وضعیت سفارش انجام نشد."
    );
}


/* =========================================================
   SUCCESS
   ========================================================= */

function showSuccess() {

    adminSuccessModal.hidden =
        false;
}


function hideSuccess() {

    adminSuccessModal.hidden =
        true;
}


/* =========================================================
   ERROR MODAL
   ========================================================= */

function showAdminError(
    message
) {

    adminErrorModalText.textContent =
        message;

    adminErrorModal.hidden =
        false;
}


function hideAdminError() {

    adminErrorModal.hidden =
        true;
}


/* =========================================================
   REFRESH
   ========================================================= */

async function refreshOrders() {

    refreshOrdersBtn.disabled =
        true;

    const originalText =
        refreshOrdersBtn.textContent;

    refreshOrdersBtn.textContent =
        "↻ LOADING...";


    try {

        await loadOrders();

        await loadOrderItems();

        renderStats();

        renderOrders();

    } catch (error) {

        console.error(
            "Failed to refresh orders:",
            error
        );

        showAdminError(
            "بارگذاری سفارش‌ها انجام نشد."
        );

    } finally {

        refreshOrdersBtn.disabled =
            false;

        refreshOrdersBtn.textContent =
            originalText;
    }
}


/* =========================================================
   EVENTS
   ========================================================= */

function setupEvents() {

    /*
        Filter
    */

    statusFilter.addEventListener(
        "change",
        renderOrders
    );


    /*
        Refresh
    */

    refreshOrdersBtn.addEventListener(
        "click",
        refreshOrders
    );


    /*
        Order list delegation
    */

    adminOrdersList.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".admin-view-button"
                );

            if (!button) {
                return;
            }

            showOrder(
                button.dataset.orderId
            );
        }
    );


    /*
        Modal
    */

    closeAdminModal.addEventListener(
        "click",
        hideOrder
    );


    document
        .querySelectorAll(
            "[data-close-admin-modal]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    hideOrder
                );

            }
        );


    /*
        Status
    */

    updateStatusBtn.addEventListener(
        "click",
        updateOrderStatus
    );


    /*
        Success
    */

    adminSuccessOk.addEventListener(
        "click",
        hideSuccess
    );


    document
        .querySelectorAll(
            "[data-close-success]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    hideSuccess
                );

            }
        );


    /*
        Error
    */

    closeAdminError.addEventListener(
        "click",
        hideAdminError
    );


    adminErrorOk.addEventListener(
        "click",
        hideAdminError
    );


    document
        .querySelectorAll(
            "[data-close-admin-error]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    hideAdminError
                );

            }
        );


    /*
        Logout
    */

    adminLogoutBtn.addEventListener(
        "click",
        handleLogout
    );


    /*
        Escape
    */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                if (
                    !adminOrderModal.hidden
                ) {
                    hideOrder();
                }

                if (
                    !adminSuccessModal.hidden
                ) {
                    hideSuccess();
                }

                if (
                    !adminErrorModal.hidden
                ) {
                    hideAdminError();
                }

            }

        }
    );
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function handleLogout() {

    adminLogoutBtn.disabled =
        true;

    try {

        const {
            error
        } =
            await supabase.auth.signOut();

        if (error) {
            throw error;
        }

        window.location.href =
            "index-shop.html";

    } catch (error) {

        console.error(
            "Logout failed:",
            error
        );

        adminLogoutBtn.disabled =
            false;

        showAdminError(
            "خروج از حساب انجام نشد."
        );
    }
}


/* =========================================================
   INIT
   ========================================================= */

async function initAdmin() {

    adminError =
        document.getElementById("adminError");

    adminErrorText =
        document.getElementById("adminErrorText");

    adminContent =
        document.getElementById("adminContent");


    if (
        !adminError ||
        !adminErrorText ||
        !adminContent
    ) {

        console.error(
            "Admin HTML elements are missing:",
            {
                adminError,
                adminErrorText,
                adminContent
            }
        );

        return;
    }


    try {

        /* Check authentication */

        currentUser =
            await getCurrentUser();


        if (!currentUser) {

            window.location.href =
                "login.html?redirect=admin.html";

            return;
        }


        /* Check admin role */

        const isAdmin =
            await checkAdminAccess();


        if (!isAdmin) {

            showPageError(
                "این صفحه فقط برای Admin قابل دسترسی است."
            );

            return;
        }


        /* Load orders */

        await loadOrders();

        console.log(
            "Orders loaded:",
            orders
        );


        /* Load order items */

        await loadOrderItems();

        console.log(
            "Order items loaded:",
            orderItems
        );


        /* Render */

        renderStats();

        renderOrders();


        /* Events */

        setupEvents();


        /* Show page */

        showContent();

    } catch (error) {

        console.error(
            "Admin initialization failed:",
            error
        );

        showPageError(
            "خطا در بارگذاری پنل مدیریت."
        );
    }
}
/* =========================================================
   START
   ========================================================= */

initAdmin();