import { supabase } from "./js/supabase.js";


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;
let currentCart = null;

let cartItems = [];
let products = [];

let eventsInitialized = false;


/* =========================================================
   DOM
   ========================================================= */

const checkoutLoading =
    document.getElementById("checkoutLoading");

const checkoutPageError =
    document.getElementById("checkoutPageError");

const checkoutPageErrorText =
    document.getElementById("checkoutPageErrorText");

const checkoutContent =
    document.getElementById("checkoutContent");

const checkoutForm =
    document.getElementById("checkoutForm");

const shippingName =
    document.getElementById("shippingName");

const shippingPhone =
    document.getElementById("shippingPhone");

const shippingAddress =
    document.getElementById("shippingAddress");

const placeOrderBtn =
    document.getElementById("placeOrderBtn");

const checkoutItems =
    document.getElementById("checkoutItems");

const checkoutSubtotal =
    document.getElementById("checkoutSubtotal");

const checkoutShipping =
    document.getElementById("checkoutShipping");

const checkoutTax =
    document.getElementById("checkoutTax");

const checkoutDiscount =
    document.getElementById("checkoutDiscount");

const checkoutTotal =
    document.getElementById("checkoutTotal");

const checkoutCartCount =
    document.getElementById("checkoutCartCount");

const successModal =
    document.getElementById("successModal");

const successOrderId =
    document.getElementById("successOrderId");

const orderErrorModal =
    document.getElementById("orderErrorModal");

const orderErrorText =
    document.getElementById("orderErrorText");

const closeErrorModal =
    document.getElementById("closeErrorModal");

const errorModalOk =
    document.getElementById("errorModalOk");


/* =========================================================
   HELPERS
   ========================================================= */

function formatPrice(value) {
    const price =
        Number(value) || 0;

    return `${new Intl.NumberFormat("fa-IR").format(
        Math.round(price)
    )} تومان`;
}


function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


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
        path = path.substring(
            "product-images/".length
        );
    }

    const { data } =
        supabase.storage
            .from("product-images")
            .getPublicUrl(path);

    return data?.publicUrl || "";
}


/* =========================================================
   UI STATE
   ========================================================= */

function showLoading() {
    if (checkoutLoading) {
        checkoutLoading.hidden = false;
    }

    if (checkoutContent) {
        checkoutContent.hidden = true;
    }

    if (checkoutPageError) {
        checkoutPageError.hidden = true;
    }
}


function showContent() {
    if (checkoutLoading) {
        checkoutLoading.hidden = true;
    }

    if (checkoutPageError) {
        checkoutPageError.hidden = true;
    }

    if (checkoutContent) {
        checkoutContent.hidden = false;
    }
}


function showPageError(message) {
    if (checkoutLoading) {
        checkoutLoading.hidden = true;
    }

    if (checkoutContent) {
        checkoutContent.hidden = true;
    }

    if (checkoutPageError) {
        checkoutPageError.hidden = false;
    }

    if (checkoutPageErrorText) {
        checkoutPageErrorText.textContent =
            message;
    }
}


/* =========================================================
   AUTH
   ========================================================= */

async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await supabase.auth.getUser();

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
   CART
   ========================================================= */

async function getUserCart() {
    if (!currentUser) {
        return null;
    }

    const {
        data,
        error
    } = await supabase
        .from("carts")
        .select("*")
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

        return null;
    }

    return data || null;
}


async function loadCartItems() {
    cartItems = [];

    if (!currentCart) {
        return;
    }

    const {
        data,
        error
    } = await supabase
        .from("cart_items")
        .select(`
            id,
            cart_id,
            product_variant_id,
            quantity
        `)
        .eq(
            "cart_id",
            currentCart.id
        )
        .order(
            "id",
            {
                ascending: true
            }
        );

    if (error) {
        console.error(
            "Failed to load cart items:",
            error
        );

        return;
    }

    cartItems =
        data || [];
}


/* =========================================================
   PRODUCTS
   ========================================================= */

async function loadProducts() {
    const {
        data,
        error
    } = await supabase
        .from("products")
        .select(`
            id,
            name,
            price,
            is_active,
            product_variants (
                id,
                size,
                stock,
                price,
                sku
            ),
            product_images (
                id,
                storage_path,
                alt_text,
                is_primary,
                sort_order
            )
        `)
        .eq(
            "is_active",
            true
        );

    if (error) {
        console.error(
            "Failed to load products:",
            error
        );

        products = [];

        return;
    }

    products =
        (data || []).map(product => {
            const variants =
                Array.isArray(
                    product.product_variants
                )
                    ? product.product_variants
                    : [];

            const images =
                Array.isArray(
                    product.product_images
                )
                    ? product.product_images
                    : [];

            const primaryImage =
                images.find(
                    image => image.is_primary
                ) ||
                [...images].sort(
                    (a, b) =>
                        Number(
                            a.sort_order || 0
                        ) -
                        Number(
                            b.sort_order || 0
                        )
                )[0];

            return {
                id: product.id,
                name: product.name,
                price:
                    Number(product.price) || 0,
                image:
                    getProductImageUrl(
                        primaryImage?.storage_path
                    ),
                variants
            };
        });
}


/* =========================================================
   PRODUCT HELPERS
   ========================================================= */

function findProductByVariantId(
    variantId
) {
    return products.find(
        product =>
            Array.isArray(
                product.variants
            ) &&
            product.variants.some(
                variant =>
                    Number(variant.id) ===
                    Number(variantId)
            )
    );
}


function findVariant(
    product,
    variantId
) {
    if (
        !product ||
        !Array.isArray(
            product.variants
        )
    ) {
        return null;
    }

    return product.variants.find(
        variant =>
            Number(variant.id) ===
            Number(variantId)
    );
}


function getVariantPrice(
    product,
    variant
) {
    if (
        variant &&
        variant.price !== null &&
        variant.price !== undefined
    ) {
        return (
            Number(variant.price) || 0
        );
    }

    return (
        Number(product?.price) || 0
    );
}


/* =========================================================
   DISPLAY ITEMS
   ========================================================= */

function getDisplayItems() {
    return cartItems
        .map(item => {
            const product =
                findProductByVariantId(
                    item.product_variant_id
                );

            if (!product) {
                return null;
            }

            const variant =
                findVariant(
                    product,
                    item.product_variant_id
                );

            const quantity =
                Number(item.quantity) || 0;

            const price =
                getVariantPrice(
                    product,
                    variant
                );

            return {
                id: item.id,
                variantId:
                    item.product_variant_id,
                quantity,
                product,
                variant,
                price,
                total:
                    price * quantity
            };
        })
        .filter(Boolean);
}


/* =========================================================
   RENDER ITEMS
   ========================================================= */

function renderItems() {
    if (!checkoutItems) {
        return;
    }

    const items =
        getDisplayItems();

    checkoutItems.innerHTML = "";

    if (items.length === 0) {
        checkoutItems.innerHTML = `
            <div class="checkout-empty">
                YOUR CART IS EMPTY
            </div>
        `;

        return;
    }

    items.forEach(item => {
        const element =
            document.createElement("article");

        element.className =
            "checkout-item";

        const size =
            item.variant?.size ||
            "One Size";

        const image =
            item.product.image;

        element.innerHTML = `
            <div class="checkout-item-image">

                ${image
                ? `
                            <img
                                src="${image}"
                                alt="${escapeHtml(
                    item.product.name
                )}"
                                loading="lazy"
                                onerror="
                                    this.style.display='none';
                                "
                            >
                        `
                : `
                            <div class="checkout-no-image">
                                NO IMAGE
                            </div>
                        `
            }

            </div>

            <div class="checkout-item-details">

                <h3 class="checkout-item-name">
                    ${escapeHtml(
                item.product.name
            )}
                </h3>

                <div class="checkout-item-meta">
                    SIZE:
                    ${escapeHtml(
                String(size)
            )}
                </div>

                <div class="checkout-item-bottom">

                    <span class="checkout-item-price">
                        ${formatPrice(
                item.price
            )}
                    </span>

                    <span class="checkout-item-quantity">
                        ×
                        ${new Intl.NumberFormat(
                "fa-IR"
            ).format(
                item.quantity
            )}
                    </span>

                </div>

            </div>
        `;

        checkoutItems.appendChild(
            element
        );
    });
}


/* =========================================================
   SUMMARY
   ========================================================= */

function renderSummary() {
    const items =
        getDisplayItems();

    const subtotal =
        items.reduce(
            (
                total,
                item
            ) =>
                total +
                item.total,
            0
        );

    const shipping = 0;
    const tax = 0;
    const discount = 0;

    const total =
        subtotal +
        shipping +
        tax -
        discount;

    if (checkoutSubtotal) {
        checkoutSubtotal.textContent =
            formatPrice(subtotal);
    }

    if (checkoutShipping) {
        checkoutShipping.textContent =
            formatPrice(shipping);
    }

    if (checkoutTax) {
        checkoutTax.textContent =
            formatPrice(tax);
    }

    if (checkoutDiscount) {
        checkoutDiscount.textContent =
            formatPrice(discount);
    }

    if (checkoutTotal) {
        checkoutTotal.textContent =
            formatPrice(
                Math.max(0, total)
            );
    }
}


/* =========================================================
   CART COUNT
   ========================================================= */

function updateCartCount() {
    if (!checkoutCartCount) {
        return;
    }

    const count =
        cartItems.reduce(
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

    checkoutCartCount.textContent =
        `(${count})`;
}


/* =========================================================
   PROFILE
   ========================================================= */

async function loadProfile() {
    if (!currentUser) {
        return;
    }

    const {
        data,
        error
    } = await supabase
        .from("profiles")
        .select(`
            full_name,
            phone,
            address
        `)
        .eq(
            "id",
            currentUser.id
        )
        .maybeSingle();

    /*
        Profile خراب نباشد باعث خراب شدن Checkout شود.
        اگر خطایی باشد فقط اطلاعات Profile پر نمی‌شود.
    */
    if (error) {
        console.error(
            "Failed to load profile:",
            error
        );

        return;
    }

    if (!data) {
        return;
    }

    if (
        shippingName &&
        data.full_name
    ) {
        shippingName.value =
            data.full_name;
    }

    if (
        shippingPhone &&
        data.phone
    ) {
        shippingPhone.value =
            data.phone;
    }

    if (
        shippingAddress &&
        data.address
    ) {
        shippingAddress.value =
            data.address;
    }
}


/* =========================================================
   VALIDATION
   ========================================================= */

function validateForm() {
    const name =
        shippingName?.value.trim() || "";

    const phone =
        shippingPhone?.value.trim() || "";

    const address =
        shippingAddress?.value.trim() || "";

    if (!name) {
        showOrderError(
            "لطفاً نام و نام خانوادگی را وارد کنید."
        );

        shippingName?.focus();

        return false;
    }

    if (!phone) {
        showOrderError(
            "لطفاً شماره تلفن را وارد کنید."
        );

        shippingPhone?.focus();

        return false;
    }

    if (phone.length < 8) {
        showOrderError(
            "شماره تلفن واردشده معتبر نیست."
        );

        shippingPhone?.focus();

        return false;
    }

    if (!address) {
        showOrderError(
            "لطفاً آدرس کامل را وارد کنید."
        );

        shippingAddress?.focus();

        return false;
    }

    if (address.length < 10) {
        showOrderError(
            "لطفاً آدرس کامل‌تری وارد کنید."
        );

        shippingAddress?.focus();

        return false;
    }

    return true;
}


/* =========================================================
   ORDER ERROR MODAL
   ========================================================= */

function showOrderError(message) {
    if (!orderErrorModal) {
        return;
    }

    if (orderErrorText) {
        orderErrorText.textContent =
            message;
    }

    orderErrorModal.hidden =
        false;
}


function hideOrderError() {
    if (!orderErrorModal) {
        return;
    }

    orderErrorModal.hidden =
        true;
}


function translateError(error) {
    const message =
        String(
            error?.message || ""
        ).trim();

    const lower =
        message.toLowerCase();

    if (
        lower.includes(
            "cart is empty"
        )
    ) {
        return "سبد خرید شما خالی است.";
    }

    if (
        lower.includes(
            "cart not found"
        )
    ) {
        return "سبد خرید پیدا نشد.";
    }

    if (
        lower.includes(
            "must be logged in"
        )
    ) {
        return "برای ثبت سفارش باید وارد حساب خود شوید.";
    }

    if (
        lower.includes(
            "not enough stock"
        )
    ) {
        return (
            "موجودی یکی از محصولات برای تعداد درخواستی کافی نیست. "
            +
            "لطفاً سبد خرید را بررسی کنید."
        );
    }

    if (
        lower.includes(
            "shipping name"
        )
    ) {
        return "نام گیرنده را وارد کنید.";
    }

    if (
        lower.includes(
            "shipping phone"
        )
    ) {
        return "شماره تلفن را وارد کنید.";
    }

    if (
        lower.includes(
            "shipping address"
        )
    ) {
        return "آدرس را وارد کنید.";
    }

    return (
        message ||
        "ثبت سفارش انجام نشد. دوباره تلاش کنید."
    );
}


/* =========================================================
   SUCCESS
   ========================================================= */

function showSuccess(orderId) {
    if (
        successOrderId
    ) {
        successOrderId.textContent =
            `#${orderId}`;
    }

    if (successModal) {
        successModal.hidden =
            false;
    }
}


/* =========================================================
   CREATE ORDER
   ========================================================= */

async function createOrder() {
    const {
        data,
        error
    } =
        await supabase.rpc(
            "create_order",
            {
                p_shipping_name:
                    shippingName.value.trim(),

                p_shipping_phone:
                    shippingPhone.value.trim(),

                p_shipping_address:
                    shippingAddress.value.trim()
            }
        );

    if (error) {
        throw error;
    }

    return data;
}


/* =========================================================
   SUBMIT
   ========================================================= */

async function handleSubmit(event) {
    event.preventDefault();

    if (!currentUser) {
        window.location.href =
            "login.html?redirect=checkout.html";

        return;
    }

    if (!validateForm()) {
        return;
    }

    if (
        !cartItems ||
        cartItems.length === 0
    ) {
        showOrderError(
            "سبد خرید شما خالی است."
        );

        return;
    }

    if (!placeOrderBtn) {
        return;
    }

    placeOrderBtn.disabled =
        true;

    const buttonText =
        placeOrderBtn.querySelector(
            ".checkout-submit-text"
        );

    if (buttonText) {
        buttonText.textContent =
            "PROCESSING...";
    }

    try {

        const orderId =
            await createOrder();

        if (
            orderId === null ||
            orderId === undefined
        ) {
            throw new Error(
                "Order ID was not returned."
            );
        }

        /*
            RPC در صورت موفقیت cart_items را پاک کرده.
            برای هماهنگ شدن UI هم state را پاک می‌کنیم.
        */
        cartItems = [];

        renderItems();
        renderSummary();
        updateCartCount();

        showSuccess(
            orderId
        );

    } catch (error) {

        console.error(
            "Order creation failed:",
            error
        );

        showOrderError(
            translateError(error)
        );

    } finally {

        placeOrderBtn.disabled =
            false;

        if (buttonText) {
            buttonText.textContent =
                "PLACE ORDER";
        }
    }
}


/* =========================================================
   EVENTS
   ========================================================= */

function setupEvents() {

    if (eventsInitialized) {
        return;
    }

    eventsInitialized = true;

    if (checkoutForm) {
        checkoutForm.addEventListener(
            "submit",
            handleSubmit
        );
    }

    if (closeErrorModal) {
        closeErrorModal.addEventListener(
            "click",
            hideOrderError
        );
    }

    if (errorModalOk) {
        errorModalOk.addEventListener(
            "click",
            hideOrderError
        );
    }

    document
        .querySelectorAll(
            "[data-close-error]"
        )
        .forEach(element => {
            element.addEventListener(
                "click",
                hideOrderError
            );
        });
}


/* =========================================================
   AUTH STATE
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
                "login.html?redirect=checkout.html";
        }
    }
);


/* =========================================================
   INIT
   ========================================================= */

async function initCheckout() {

    showLoading();

    try {

        /*
            1. User
        */
        currentUser =
            await getCurrentUser();

        if (!currentUser) {

            window.location.href =
                "login.html?redirect=checkout.html";

            return;
        }


        /*
            2. Cart
        */
        currentCart =
            await getUserCart();

        if (!currentCart) {

            showPageError(
                "سبد خرید شما پیدا نشد."
            );

            return;
        }


        /*
            3. Load cart + products
        */
        await Promise.all([
            loadCartItems(),
            loadProducts()
        ]);


        /*
            4. Check cart
        */
        if (
            cartItems.length === 0
        ) {

            window.location.href =
                "cart.html";

            return;
        }


        /*
            5. Check products
        */
        if (
            products.length === 0
        ) {

            showPageError(
                "محصولات سفارش قابل بارگذاری نیستند."
            );

            return;
        }


        /*
            6. Profile
            Profile should never block checkout.
        */
        await loadProfile();


        /*
            7. Render
        */
        renderItems();

        renderSummary();

        updateCartCount();


        /*
            8. Events
        */
        setupEvents();


        /*
            9. Finally show checkout
        */
        showContent();

    } catch (error) {

        console.error(
            "Checkout initialization failed:",
            error
        );

        showPageError(
            "خطا در بارگذاری Checkout."
        );
    }
}


/* =========================================================
   START
   ========================================================= */

initCheckout();