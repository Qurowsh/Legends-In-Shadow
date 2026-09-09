import { supabase } from "./js/supabase.js";


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;
let orders = [];
let orderItems = [];


/* =========================================================
   DOM
   ========================================================= */

const ordersLoading =
    document.getElementById(
        "ordersLoading"
    );

const ordersError =
    document.getElementById(
        "ordersError"
    );

const ordersErrorText =
    document.getElementById(
        "ordersErrorText"
    );

const ordersRetryBtn =
    document.getElementById(
        "ordersRetryBtn"
    );

const ordersContent =
    document.getElementById(
        "ordersContent"
    );

const ordersList =
    document.getElementById(
        "ordersList"
    );

const ordersEmpty =
    document.getElementById(
        "ordersEmpty"
    );

const ordersCartCount =
    document.getElementById(
        "ordersCartCount"
    );


/* Modal */

const orderDetailModal =
    document.getElementById(
        "orderDetailModal"
    );

const closeOrderModal =
    document.getElementById(
        "closeOrderModal"
    );

const modalOrderTitle =
    document.getElementById(
        "modalOrderTitle"
    );

const modalOrderStatus =
    document.getElementById(
        "modalOrderStatus"
    );

const modalOrderItems =
    document.getElementById(
        "modalOrderItems"
    );

const modalSubtotal =
    document.getElementById(
        "modalSubtotal"
    );

const modalShipping =
    document.getElementById(
        "modalShipping"
    );

const modalTax =
    document.getElementById(
        "modalTax"
    );

const modalDiscount =
    document.getElementById(
        "modalDiscount"
    );

const modalTotal =
    document.getElementById(
        "modalTotal"
    );

const modalShippingName =
    document.getElementById(
        "modalShippingName"
    );

const modalShippingPhone =
    document.getElementById(
        "modalShippingPhone"
    );

const modalShippingAddress =
    document.getElementById(
        "modalShippingAddress"
    );

const modalCreatedAt =
    document.getElementById(
        "modalCreatedAt"
    );


/* =========================================================
   FORMATTERS
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
   IMAGE
   ========================================================= */

function getProductImageUrl(
    storagePath
) {

    if (!storagePath) {
        return "";
    }

    const rawPath =
        String(
            storagePath
        ).trim();

    if (!rawPath) {
        return "";
    }

    if (
        /^https?:\/\//i.test(
            rawPath
        )
    ) {
        return rawPath;
    }

    let path =
        rawPath.replace(
            /^\/+/,
            ""
        );

    if (
        path.startsWith(
            "product-images/"
        )
    ) {
        path =
            path.substring(
                "product-images/".length
            );
    }

    const { data } =
        supabase.storage
            .from(
                "product-images"
            )
            .getPublicUrl(
                path
            );

    return data?.publicUrl || "";
}


/* =========================================================
   UI
   ========================================================= */

function showLoading() {

    ordersLoading.hidden =
        false;

    ordersContent.hidden =
        true;

    ordersError.hidden =
        true;
}


function showContent() {

    ordersLoading.hidden =
        true;

    ordersError.hidden =
        true;

    ordersContent.hidden =
        false;
}


function showError(
    message
) {

    ordersLoading.hidden =
        true;

    ordersContent.hidden =
        true;

    ordersError.hidden =
        false;

    ordersErrorText.textContent =
        message;
}


/* =========================================================
   USER
   ========================================================= */

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
            .eq(
                "user_id",
                currentUser.id
            )
            .order(
                "created_at",
                {
                    ascending: false
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
            order => order.id
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
                    ascending: true
                }
            );

    if (error) {
        throw error;
    }

    orderItems =
        data || [];
}


/* =========================================================
   CART COUNT
   ========================================================= */

async function updateCartCount() {

    const {
        data: cart,
        error
    } =
        await supabase
            .from("carts")
            .select("id")
            .eq(
                "user_id",
                currentUser.id
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            )
            .limit(1)
            .maybeSingle();

    if (error) {

        console.error(
            "Failed to load cart:",
            error
        );

        return;
    }

    if (!cart) {

        ordersCartCount.textContent =
            "(0)";

        return;
    }

    const {
        data: items,
        error: itemsError
    } =
        await supabase
            .from("cart_items")
            .select("quantity")
            .eq(
                "cart_id",
                cart.id
            );

    if (itemsError) {

        console.error(
            "Failed to load cart items:",
            itemsError
        );

        return;
    }

    const count =
        (items || []).reduce(
            (
                total,
                item
            ) =>
                total +
                (
                    Number(
                        item.quantity
                    ) || 0
                ),
            0
        );

    ordersCartCount.textContent =
        `(${count})`;
}


/* =========================================================
   ORDER STATUS
   ========================================================= */

function getStatusLabel(
    status
) {

    const value =
        String(
            status || "pending"
        ).toLowerCase();

    const labels = {
        pending: "PENDING",
        confirmed: "CONFIRMED",
        processing: "PROCESSING",
        shipped: "SHIPPED",
        delivered: "DELIVERED",
        cancelled: "CANCELLED"
    };

    return (
        labels[value] ||
        value.toUpperCase()
    );
}


/* =========================================================
   RENDER ORDER LIST
   ========================================================= */

function renderOrders() {

    ordersList.innerHTML =
        "";

    if (
        orders.length === 0
    ) {

        ordersEmpty.hidden =
            false;

        return;
    }

    ordersEmpty.hidden =
        true;

    orders.forEach(
        order => {

            const item =
                document.createElement(
                    "article"
                );

            item.className =
                "order-item";

            const status =
                String(
                    order.status ||
                    "pending"
                ).toLowerCase();

            item.innerHTML = `
                <div class="order-info">

                    <h3 class="order-number">
                        ORDER #${escapeHtml(
                order.id
            )}
                    </h3>

                    <div class="order-date">
                        ${formatDate(
                order.created_at
            )}
                    </div>

                </div>


                <div class="order-side">

                    <strong class="order-total">
                        ${formatPrice(
                order.total
            )}
                    </strong>

                    <span
                        class="order-status ${escapeHtml(
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
                        class="order-view-button"
                        data-order-id="${escapeHtml(
                order.id
            )}"
                    >
                        VIEW
                    </button>

                </div>
            `;

            ordersList.appendChild(
                item
            );
        }
    );
}


/* =========================================================
   SHOW ORDER DETAIL
   ========================================================= */

function showOrderDetail(
    orderId
) {

    const order =
        orders.find(
            item =>
                Number(item.id) ===
                Number(orderId)
        );

    if (!order) {
        return;
    }

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


    /* Header */

    modalOrderTitle.textContent =
        `ORDER #${order.id}`;


    const status =
        String(
            order.status ||
            "pending"
        ).toLowerCase();

    modalOrderStatus.className =
        `order-status ${status}`;

    modalOrderStatus.textContent =
        getStatusLabel(status);


    /* Items */

    modalOrderItems.innerHTML =
        "";

    if (
        items.length === 0
    ) {

        modalOrderItems.innerHTML = `
            <div
                style="
                    padding: 1.5em 0;
                    color: rgba(255,255,255,.35);
                    text-align: center;
                    font-size: .7em;
                "
            >
                NO ORDER ITEMS
            </div>
        `;

    } else {

        items.forEach(
            item => {

                const itemElement =
                    document.createElement(
                        "div"
                    );

                itemElement.className =
                    "modal-order-item";


                const imagePath =
                    item.storage_path ||
                    item.image ||
                    "";


                const imageUrl =
                    getProductImageUrl(
                        imagePath
                    );


                /*
                    order_items currently does not
                    store storage_path, so image is
                    optional. The item still displays
                    correctly without it.
                */

                const imageHtml =
                    imageUrl
                        ? `
                            <div class="modal-item-image">

                                <img
                                    src="${imageUrl}"
                                    alt="${escapeHtml(
                            item.product_name
                        )}"
                                    loading="lazy"
                                >

                            </div>
                        `
                        : `
                            <div class="modal-item-image">

                                <div class="modal-item-no-image">
                                    N
                                </div>

                            </div>
                        `;


                itemElement.innerHTML = `
                    ${imageHtml}

                    <div>

                        <div class="modal-item-name">
                            ${escapeHtml(
                    item.product_name
                )}
                        </div>

                        <div class="modal-item-meta">
                            ${item.sku
                        ? `SKU: ${escapeHtml(
                            item.sku
                        )}`
                        : ""
                    }

                            &nbsp; · &nbsp;

                            ×${new Intl.NumberFormat(
                        "fa-IR"
                    ).format(
                        item.quantity
                    )}

                            &nbsp; · &nbsp;

                            ${formatPrice(
                        item.unit_price
                    )}
                        </div>

                    </div>

                    <strong class="modal-item-total">
                        ${formatPrice(
                        item.total_price
                    )}
                    </strong>
                `;


                modalOrderItems.appendChild(
                    itemElement
                );
            }
        );
    }


    /* Summary */

    modalSubtotal.textContent =
        formatPrice(
            order.subtotal
        );

    modalShipping.textContent =
        formatPrice(
            order.shipping
        );

    modalTax.textContent =
        formatPrice(
            order.tax
        );

    modalDiscount.textContent =
        order.discount > 0
            ? `-${formatPrice(
                order.discount
            )}`
            : formatPrice(0);

    modalTotal.textContent =
        formatPrice(
            order.total
        );


    /* Shipping */

    modalShippingName.textContent =
        order.shipping_name ||
        "—";

    modalShippingPhone.textContent =
        order.shipping_phone ||
        "—";

    modalShippingAddress.textContent =
        order.shipping_address ||
        "—";


    /* Date */

    modalCreatedAt.textContent =
        formatDateTime(
            order.created_at
        );


    /* Show */

    orderDetailModal.hidden =
        false;

    document.body.style.overflow =
        "hidden";
}


/* =========================================================
   HIDE MODAL
   ========================================================= */

function hideOrderDetail() {

    orderDetailModal.hidden =
        true;

    document.body.style.overflow =
        "";
}


/* =========================================================
   EVENTS
   ========================================================= */

function setupEvents() {

    ordersList.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".order-view-button"
                );

            if (!button) {
                return;
            }

            showOrderDetail(
                button.dataset.orderId
            );
        }
    );


    closeOrderModal.addEventListener(
        "click",
        hideOrderDetail
    );


    document
        .querySelectorAll(
            "[data-close-order-modal]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    hideOrderDetail
                );

            }
        );


    if (ordersRetryBtn) {

        ordersRetryBtn.addEventListener(
            "click",
            initOrders
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !orderDetailModal.hidden
            ) {

                hideOrderDetail();
            }

        }
    );
}


/* =========================================================
   INIT
   ========================================================= */

async function initOrders() {

    showLoading();

    try {

        currentUser =
            await getCurrentUser();


        if (!currentUser) {

            window.location.href =
                "login.html?redirect=orders.html";

            return;
        }


        await loadOrders();

        await loadOrderItems();

        await updateCartCount();


        renderOrders();


        setupEventsOnce();


        showContent();

    } catch (error) {

        console.error(
            "Orders initialization failed:",
            error
        );

        showError(
            "خطا در بارگذاری سفارش‌ها."
        );
    }
}


/* =========================================================
   EVENTS ONCE
   ========================================================= */

let eventsSetup = false;

function setupEventsOnce() {

    if (eventsSetup) {
        return;
    }

    eventsSetup = true;

    setupEvents();
}


/* =========================================================
   AUTH LISTENER
   ========================================================= */

supabase.auth.onAuthStateChange(
    (
        event,
        session
    ) => {

        if (
            event === "SIGNED_OUT" ||
            !session
        ) {

            window.location.href =
                "login.html?redirect=orders.html";
        }

    }
);


/* =========================================================
   START
   ========================================================= */

initOrders();