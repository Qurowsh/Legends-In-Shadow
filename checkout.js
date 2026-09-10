import { supabase } from "./js/supabase.js";


let currentUser = null;
let currentCart = null;
let cartItems = [];
let cartProducts = [];
let appliedPromo = null;


/* ========================================
   HELPERS
======================================== */

function formatPrice(value) {

    const price =
        Number(value) || 0;

    return `${new Intl.NumberFormat("fa-IR").format(
        Math.round(price)
    )} تومان`;
}


function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ========================================
   IMAGE
======================================== */

function getProductImageUrl(storagePath) {

    if (!storagePath) {
        return "";
    }

    const rawPath =
        String(storagePath).trim();

    if (!rawPath) {
        return "";
    }

    if (/^https?:\/\//i.test(rawPath)) {
        return rawPath;
    }

    let path =
        rawPath.replace(/^\/+/, "");

    if (path.startsWith("product-images/")) {
        path =
            path.substring(
                "product-images/".length
            );
    }

    const { data } =
        supabase.storage
            .from("product-images")
            .getPublicUrl(path);

    return data?.publicUrl || "";
}


/* ========================================
   PROMO STORAGE
======================================== */

function getStoredPromo() {

    try {

        const raw =
            sessionStorage.getItem(
                "appliedPromo"
            );

        if (!raw) {
            return null;
        }

        const promo =
            JSON.parse(raw);

        if (
            !promo ||
            !promo.code
        ) {
            return null;
        }

        return promo;

    } catch (error) {

        console.error(
            "Failed to read promo:",
            error
        );

        return null;
    }
}


function clearStoredPromo() {

    sessionStorage.removeItem(
        "appliedPromo"
    );

    appliedPromo = null;
}


/* ========================================
   ERROR UI
======================================== */

function showPageError(message) {

    const errorSection =
        document.getElementById(
            "checkoutPageError"
        );

    const errorText =
        document.getElementById(
            "checkoutPageErrorText"
        );

    const content =
        document.getElementById(
            "checkoutContent"
        );

    if (errorText) {
        errorText.textContent =
            message;
    }

    if (errorSection) {
        errorSection.hidden = false;
    }

    if (content) {
        content.hidden = true;
    }
}


function hidePageError() {

    const errorSection =
        document.getElementById(
            "checkoutPageError"
        );

    if (errorSection) {
        errorSection.hidden = true;
    }
}


function showOrderError(message) {

    const modal =
        document.getElementById(
            "orderErrorModal"
        );

    const text =
        document.getElementById(
            "orderErrorText"
        );

    if (text) {
        text.textContent =
            message;
    }

    if (modal) {
        modal.hidden = false;
    }
}


function closeOrderError() {

    const modal =
        document.getElementById(
            "orderErrorModal"
        );

    if (modal) {
        modal.hidden = true;
    }
}


/* ========================================
   AUTH
======================================== */

async function getCurrentUser() {

    const {
        data: { session },
        error
    } =
        await supabase.auth.getSession();

    if (error) {

        console.error(
            "Auth error:",
            error
        );

        return null;
    }

    return session?.user || null;
}


/* ========================================
   LOAD CART
======================================== */

async function loadCart() {

    if (!currentUser) {

        window.location.href =
            "login.html?redirect=checkout.html";

        return false;
    }


    const {
        data: cart,
        error: cartError
    } =
        await supabase
            .from("carts")
            .select(`
                id,
                user_id,
                created_at,
                updated_at
            `)
            .eq(
                "user_id",
                currentUser.id
            )
            .maybeSingle();


    if (cartError) {

        console.error(
            "Cart error:",
            cartError
        );

        showPageError(
            "خطا در دریافت سبد خرید."
        );

        return false;
    }


    if (!cart) {

        showPageError(
            "سبد خرید شما خالی است."
        );

        return false;
    }


    currentCart =
        cart;


    const {
        data: items,
        error: itemsError
    } =
        await supabase
            .from("cart_items")
            .select(`
                id,
                cart_id,
                product_variant_id,
                quantity,
                created_at,
                updated_at
            `)
            .eq(
                "cart_id",
                cart.id
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (itemsError) {

        console.error(
            "Cart items error:",
            itemsError
        );

        showPageError(
            "خطا در دریافت محصولات سبد خرید."
        );

        return false;
    }


    cartItems =
        items || [];


    if (!cartItems.length) {

        showPageError(
            "سبد خرید شما خالی است."
        );

        return false;
    }


    return true;
}


/* ========================================
   LOAD PRODUCT VARIANTS
======================================== */

async function loadProducts() {

    if (!cartItems.length) {
        return;
    }


    const variantIds =
        cartItems.map(
            item =>
                item.product_variant_id
        );


    const {
        data,
        error
    } =
        await supabase
            .from("product_variants")
            .select(`
                id,
                product_id,
                size,
                sku,
                stock,
                price,

                products (
                    id,
                    name,
                    slug,
                    description,
                    material,
                    is_active,

                    product_images (
                        id,
                        storage_path,
                        alt_text,
                        is_primary,
                        sort_order
                    )
                )
            `)
            .in(
                "id",
                variantIds
            );


    if (error) {

        console.error(
            "Product variants error:",
            error
        );

        showPageError(
            "خطا در دریافت اطلاعات محصولات."
        );

        return;
    }


    cartProducts =
        (data || []).map(
            variant => {

                const product =
                    Array.isArray(
                        variant.products
                    )
                        ? variant.products[0]
                        : variant.products;


                const images =
                    [
                        ...(product?.product_images || [])
                    ].sort(
                        (a, b) => {

                            if (
                                a.is_primary &&
                                !b.is_primary
                            ) {
                                return -1;
                            }

                            if (
                                !a.is_primary &&
                                b.is_primary
                            ) {
                                return 1;
                            }

                            return (
                                Number(a.sort_order || 0) -
                                Number(b.sort_order || 0)
                            );
                        }
                    );


                const image =
                    images.length
                        ? getProductImageUrl(
                            images[0].storage_path
                        )
                        : "";


                return {

                    variantId:
                        variant.id,

                    productId:
                        variant.product_id,

                    name:
                        product?.name ||
                        "Product",

                    slug:
                        product?.slug ||
                        "",

                    material:
                        product?.material ||
                        "",

                    size:
                        variant.size ||
                        "One Size",

                    sku:
                        variant.sku ||
                        "",

                    stock:
                        Number(
                            variant.stock
                        ) || 0,

                    price:
                        Number(
                            variant.price
                        ) || 0,

                    image
                };
            }
        );
}


/* ========================================
   FIND PRODUCT
======================================== */

function getCartProduct(item) {

    return cartProducts.find(
        product =>
            Number(product.variantId) ===
            Number(item.product_variant_id)
    );
}


/* ========================================
   CALCULATE SUBTOTAL
======================================== */

function calculateSubtotal() {

    return cartItems.reduce(
        (total, item) => {

            const product =
                getCartProduct(item);

            if (!product) {
                return total;
            }

            const quantity =
                Number(item.quantity) || 0;

            return (
                total +
                product.price * quantity
            );
        },
        0
    );
}


/* ========================================
   VALIDATE PROMO
======================================== */

async function validatePromo(
    code,
    subtotal
) {

    if (!code) {
        return null;
    }


    const {
        data,
        error
    } =
        await supabase.rpc(
            "validate_promo_code",
            {
                p_code: code,
                p_order_subtotal: subtotal
            }
        );


    if (error) {

        console.error(
            "Promo validation error:",
            error
        );

        throw error;
    }


    if (
        !data ||
        data.valid !== true
    ) {

        return {
            valid: false,
            message:
                data?.message ||
                "کد تخفیف نامعتبر است."
        };
    }


    return {

        valid: true,

        code:
            String(
                data.code || code
            ).toUpperCase(),

        discount_type:
            data.discount_type,

        discount_value:
            Number(
                data.discount_value
            ) || 0,

        discount_amount:
            Number(
                data.discount_amount
            ) || 0,

        minimum_order:
            Number(
                data.minimum_order
            ) || 0
    };
}


/* ========================================
   REFRESH PROMO
======================================== */

async function refreshAppliedPromo() {

    appliedPromo =
        getStoredPromo();


    if (!appliedPromo?.code) {
        return;
    }


    const subtotal =
        calculateSubtotal();


    if (subtotal <= 0) {

        clearStoredPromo();

        return;
    }


    try {

        const promo =
            await validatePromo(
                appliedPromo.code,
                subtotal
            );


        if (
            !promo ||
            promo.valid !== true
        ) {

            clearStoredPromo();

            return;
        }


        appliedPromo =
            promo;


        sessionStorage.setItem(
            "appliedPromo",
            JSON.stringify(
                promo
            )
        );

    } catch (error) {

        console.error(
            "Failed to refresh promo:",
            error
        );

        clearStoredPromo();
    }
}


/* ========================================
   RENDER CART ITEMS
======================================== */

function renderItems() {

    const container =
        document.getElementById(
            "checkoutItems"
        );

    if (!container) {
        return;
    }


    container.innerHTML = "";


    cartItems.forEach(
        item => {

            const product =
                getCartProduct(item);

            if (!product) {
                return;
            }


            const quantity =
                Number(item.quantity) || 0;


            const total =
                product.price * quantity;


            const element =
                document.createElement(
                    "article"
                );


            element.className =
                "checkout-item";


            element.innerHTML = `

                <div class="checkout-item-image">

                    ${product.image
                    ? `
                            <img
                                src="${escapeHtml(product.image)}"
                                alt="${escapeHtml(product.name)}"
                            >
                          `
                    : `
                            <div class="checkout-item-no-image">
                                N
                            </div>
                          `
                }

                </div>


                <div class="checkout-item-info">

                    <h3>
                        ${escapeHtml(product.name)}
                    </h3>

                    <p>
                        SIZE:
                        ${escapeHtml(product.size)}
                    </p>

                    ${product.sku
                    ? `
                            <p>
                                SKU:
                                ${escapeHtml(product.sku)}
                            </p>
                          `
                    : ""
                }

                    <p>
                        QTY:
                        ${quantity}
                    </p>

                </div>


                <div class="checkout-item-price">

                    ${formatPrice(total)}

                </div>

            `;


            container.appendChild(
                element
            );
        }
    );
}


/* ========================================
   RENDER SUMMARY
======================================== */

function renderSummary() {

    const subtotal =
        calculateSubtotal();

    const shipping =
        0;

    const tax =
        0;

    const discount =
        Math.min(
            Number(
                appliedPromo?.discount_amount
            ) || 0,
            subtotal
        );

    const total =
        Math.max(
            0,
            subtotal +
            shipping +
            tax -
            discount
        );


    const subtotalElement =
        document.getElementById(
            "checkoutSubtotal"
        );

    const shippingElement =
        document.getElementById(
            "checkoutShipping"
        );

    const taxElement =
        document.getElementById(
            "checkoutTax"
        );

    const discountElement =
        document.getElementById(
            "checkoutDiscount"
        );

    const totalElement =
        document.getElementById(
            "checkoutTotal"
        );


    if (subtotalElement) {
        subtotalElement.textContent =
            formatPrice(subtotal);
    }


    if (shippingElement) {
        shippingElement.textContent =
            formatPrice(shipping);
    }


    if (taxElement) {
        taxElement.textContent =
            formatPrice(tax);
    }


    if (discountElement) {

        discountElement.textContent =
            discount > 0
                ? `-${formatPrice(discount)}`
                : formatPrice(0);
    }


    if (totalElement) {
        totalElement.textContent =
            formatPrice(total);
    }
}


/* ========================================
   CART COUNT
======================================== */

function updateCartCount() {

    const count =
        cartItems.reduce(
            (total, item) =>
                total +
                (
                    Number(item.quantity) || 0
                ),
            0
        );


    const element =
        document.getElementById(
            "checkoutCartCount"
        );


    if (element) {

        element.textContent =
            `(${new Intl.NumberFormat("fa-IR").format(count)})`;
    }
}


/* ========================================
   FORM VALIDATION
======================================== */

function getShippingData() {

    const nameInput =
        document.getElementById(
            "shippingName"
        );

    const phoneInput =
        document.getElementById(
            "shippingPhone"
        );

    const addressInput =
        document.getElementById(
            "shippingAddress"
        );


    const name =
        nameInput?.value.trim() || "";

    const phone =
        phoneInput?.value.trim() || "";

    const address =
        addressInput?.value.trim() || "";


    if (!name) {

        showOrderError(
            "لطفاً نام و نام خانوادگی گیرنده را وارد کنید."
        );

        nameInput?.focus();

        return null;
    }


    if (!phone) {

        showOrderError(
            "لطفاً شماره تماس را وارد کنید."
        );

        phoneInput?.focus();

        return null;
    }


    if (!address) {

        showOrderError(
            "لطفاً آدرس کامل خود را وارد کنید."
        );

        addressInput?.focus();

        return null;
    }


    return {
        name,
        phone,
        address
    };
}


/* ========================================
   RPC ERROR TRANSLATION
======================================== */

function translateRpcError(message) {

    const text =
        String(
            message || ""
        ).toLowerCase();


    if (text.includes("cart is empty")) {
        return "سبد خرید شما خالی است.";
    }


    if (text.includes("insufficient stock")) {
        return "موجودی یکی از محصولات کافی نیست.";
    }


    if (text.includes("shipping name")) {
        return "نام و نام خانوادگی الزامی است.";
    }


    if (text.includes("shipping phone")) {
        return "شماره تماس الزامی است.";
    }


    if (text.includes("shipping address")) {
        return "آدرس ارسال الزامی است.";
    }


    if (text.includes("must be logged in")) {
        return "لطفاً ابتدا وارد حساب کاربری شوید.";
    }


    if (text.includes("cart not found")) {
        return "سبد خرید پیدا نشد.";
    }


    if (text.includes("promo")) {
        return "کد تخفیف معتبر نیست یا شرایط استفاده از آن برقرار نیست.";
    }


    if (text.includes("order not found")) {
        return "سفارش موردنظر پیدا نشد.";
    }


    if (text.includes("already paid")) {
        return "این سفارش قبلاً پرداخت شده است.";
    }


    if (text.includes("active payment already exists")) {
        return "برای این سفارش یک تراکنش فعال وجود دارد.";
    }


    if (text.includes("order is cancelled")) {
        return "این سفارش لغو شده است.";
    }


    return (
        message ||
        "خطایی هنگام انجام عملیات رخ داد."
    );
}


/* ========================================
   CREATE PAYMENT
======================================== */

async function createPayment(orderId) {

    if (!orderId) {
        throw new Error(
            "Order ID is required."
        );
    }


    /*
     * The amount is NOT sent from the browser.
     *
     * create_payment() reads orders.total
     * directly from PostgreSQL.
     */


    const {
        data: paymentId,
        error
    } =
        await supabase.rpc(
            "create_payment",
            {
                p_order_id:
                    Number(orderId),

                p_gateway:
                    "unknown"
            }
        );


    if (error) {

        console.error(
            "Create payment error:",
            error
        );

        throw error;
    }


    if (!paymentId) {

        throw new Error(
            "Payment ID was not returned."
        );
    }


    return paymentId;
}


/* ========================================
   PLACE ORDER + CREATE PAYMENT
======================================== */

async function placeOrder() {

    if (!currentUser) {

        window.location.href =
            "login.html?redirect=checkout.html";

        return;
    }


    if (
        !currentCart ||
        !cartItems.length
    ) {

        showOrderError(
            "سبد خرید شما خالی است."
        );

        return;
    }


    const shipping =
        getShippingData();


    if (!shipping) {
        return;
    }


    const button =
        document.getElementById(
            "placeOrderBtn"
        );


    const buttonText =
        button?.querySelector(
            ".checkout-submit-text"
        );


    const originalText =
        buttonText?.textContent ||
        "ثبت سفارش";


    try {

        if (button) {
            button.disabled = true;
        }


        if (buttonText) {
            buttonText.textContent =
                "در حال ثبت سفارش...";
        }


        /*
         * Revalidate promo immediately
         * before creating the order.
         */

        await refreshAppliedPromo();


        const promoCode =
            appliedPromo?.code ||
            null;


        /* ====================================
           STEP 1
           Create Order
        ==================================== */

        const {
            data: orderId,
            error: orderError
        } =
            await supabase.rpc(
                "create_order_from_cart",
                {

                    p_shipping_name:
                        shipping.name,

                    p_shipping_phone:
                        shipping.phone,

                    p_shipping_address:
                        shipping.address,

                    p_promo_code:
                        promoCode,

                    p_shipping:
                        0,

                    p_tax:
                        0
                }
            );


        if (orderError) {

            console.error(
                "Create order error:",
                orderError
            );

            showOrderError(
                translateRpcError(
                    orderError.message
                )
            );

            return;
        }


        if (!orderId) {

            showOrderError(
                "سفارش ایجاد شد اما شناسه سفارش دریافت نشد."
            );

            return;
        }


        /*
         * Save order ID temporarily.
         */

        sessionStorage.setItem(
            "lastOrderId",
            String(orderId)
        );


        /* ====================================
           STEP 2
           Create Payment
        ==================================== */

        if (buttonText) {
            buttonText.textContent =
                "در حال آماده‌سازی پرداخت...";
        }


        let paymentId;


        try {

            paymentId =
                await createPayment(
                    orderId
                );

        } catch (paymentError) {

            console.error(
                "Payment creation failed:",
                paymentError
            );


            /*
             * Important:
             *
             * The order has already been created.
             * We do NOT silently pretend the order
             * was successfully paid.
             *
             * The order remains unpaid/pending
             * and can be handled later.
             */

            showOrderError(
                `سفارش #${orderId} ثبت شد، اما آماده‌سازی پرداخت انجام نشد.`
            );

            return;
        }


        /*
         * Save payment ID so the next payment
         * step can use it.
         */

        sessionStorage.setItem(
            "lastPaymentId",
            String(paymentId)
        );


        /*
         * Promo is now attached to the order
         * and no longer needs to remain
         * in checkout session storage.
         */

        clearStoredPromo();


        /*
         * IMPORTANT:
         *
         * We do NOT show the final success modal
         * yet.
         *
         * Payment has only been CREATED.
         * It has NOT been VERIFIED.
         *
         * The next step will redirect the user
         * to the real payment gateway.
         */


        console.log(
            "Order created:",
            orderId
        );

        console.log(
            "Payment created:",
            paymentId
        );


        showOrderError(
            `سفارش #${orderId} ایجاد شد و آماده پرداخت است. اتصال درگاه در مرحله بعد انجام می‌شود.`
        );


    } catch (error) {

        console.error(
            "Checkout error:",
            error
        );


        showOrderError(
            translateRpcError(
                error?.message
            )
        );

    } finally {

        if (button) {
            button.disabled = false;
        }


        if (buttonText) {
            buttonText.textContent =
                originalText;
        }
    }
}


/* ========================================
   EVENT LISTENERS
======================================== */

function setupEventListeners() {

    const form =
        document.getElementById(
            "checkoutForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                await placeOrder();
            }
        );
    }


    const closeErrorButton =
        document.getElementById(
            "closeErrorModal"
        );


    if (closeErrorButton) {

        closeErrorButton.addEventListener(
            "click",
            closeOrderError
        );
    }


    const errorOkButton =
        document.getElementById(
            "errorModalOk"
        );


    if (errorOkButton) {

        errorOkButton.addEventListener(
            "click",
            closeOrderError
        );
    }


    const errorBackdrop =
        document.querySelector(
            "[data-close-error]"
        );


    if (errorBackdrop) {

        errorBackdrop.addEventListener(
            "click",
            closeOrderError
        );
    }
}


/* ========================================
   INIT
======================================== */

async function initCheckout() {

    try {

        hidePageError();


        /*
         * Get authenticated user.
         */

        currentUser =
            await getCurrentUser();


        if (!currentUser) {

            window.location.href =
                "login.html?redirect=checkout.html";

            return;
        }


        /*
         * Load cart.
         */

        const hasCart =
            await loadCart();


        if (!hasCart) {
            return;
        }


        /*
         * Load products.
         */

        await loadProducts();


        if (!cartProducts.length) {

            showPageError(
                "محصولات سبد خرید پیدا نشدند."
            );

            return;
        }


        /*
         * Load and revalidate promo.
         */

        await refreshAppliedPromo();


        /*
         * Render.
         */

        renderItems();

        renderSummary();

        updateCartCount();


        /*
         * Events.
         */

        setupEventListeners();


        /*
         * Show content.
         */

        const content =
            document.getElementById(
                "checkoutContent"
            );


        if (content) {
            content.hidden = false;
        }

    } catch (error) {

        console.error(
            "Checkout initialization error:",
            error
        );


        showPageError(
            "خطایی هنگام بارگذاری صفحه پرداخت رخ داد."
        );
    }
}


initCheckout();