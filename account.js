import { supabase } from "./js/supabase.js";


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;


/* =========================================================
   DOM
   ========================================================= */

const accountLoading =
    document.getElementById(
        "accountLoading"
    );

const accountError =
    document.getElementById(
        "accountError"
    );

const accountErrorText =
    document.getElementById(
        "accountErrorText"
    );

const accountContent =
    document.getElementById(
        "accountContent"
    );

const accountRetryBtn =
    document.getElementById(
        "accountRetryBtn"
    );

const accountEmail =
    document.getElementById(
        "accountEmail"
    );

const profileForm =
    document.getElementById(
        "profileForm"
    );

const fullName =
    document.getElementById(
        "fullName"
    );

const phone =
    document.getElementById(
        "phone"
    );

const address =
    document.getElementById(
        "address"
    );

const saveProfileBtn =
    document.getElementById(
        "saveProfileBtn"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

const accountCartCount =
    document.getElementById(
        "accountCartCount"
    );

const successModal =
    document.getElementById(
        "successModal"
    );

const successModalOk =
    document.getElementById(
        "successModalOk"
    );

const profileErrorModal =
    document.getElementById(
        "profileErrorModal"
    );

const profileErrorText =
    document.getElementById(
        "profileErrorText"
    );

const closeProfileErrorModal =
    document.getElementById(
        "closeProfileErrorModal"
    );

const profileErrorOk =
    document.getElementById(
        "profileErrorOk"
    );


/* =========================================================
   UI
   ========================================================= */

function showLoading() {

    if (accountLoading) {
        accountLoading.hidden =
            false;
    }

    if (accountContent) {
        accountContent.hidden =
            true;
    }

    if (accountError) {
        accountError.hidden =
            true;
    }
}


function showContent() {

    if (accountLoading) {
        accountLoading.hidden =
            true;
    }

    if (accountError) {
        accountError.hidden =
            true;
    }

    if (accountContent) {
        accountContent.hidden =
            false;
    }
}


function showPageError(
    message
) {

    if (accountLoading) {
        accountLoading.hidden =
            true;
    }

    if (accountContent) {
        accountContent.hidden =
            true;
    }

    if (accountError) {
        accountError.hidden =
            false;
    }

    if (accountErrorText) {
        accountErrorText.textContent =
            message;
    }
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
   PROFILE
   ========================================================= */

async function loadProfile() {

    if (!currentUser) {
        return;
    }

    /*
        Load email directly from Supabase Auth.
    */

    if (accountEmail) {
        accountEmail.value =
            currentUser.email || "";
    }


    /*
        Load profile.
    */

    const {
        data,
        error
    } =
        await supabase
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


    if (error) {

        console.error(
            "Failed to load profile:",
            error
        );

        throw error;
    }


    /*
        Profile might not exist.
        The signup trigger should normally
        create it, but we handle this case too.
    */

    if (!data) {
        return;
    }


    if (
        fullName &&
        data.full_name
    ) {
        fullName.value =
            data.full_name;
    }


    if (
        phone &&
        data.phone
    ) {
        phone.value =
            data.phone;
    }


    if (
        address &&
        data.address
    ) {
        address.value =
            data.address;
    }
}


/* =========================================================
   SAVE PROFILE
   ========================================================= */

async function saveProfile() {
    if (!currentUser) {
        return;
    }

    const name =
        fullName.value.trim();

    const userPhone =
        phone.value.trim();

    const userAddress =
        address.value.trim();


    saveProfileBtn.disabled = true;

    const saveText =
        saveProfileBtn.querySelector(
            ".save-text"
        );

    if (saveText) {
        saveText.textContent =
            "SAVING...";
    }


    try {
        const {
            data,
            error
        } = await supabase
            .from("profiles")
            .update({
                full_name:
                    name || null,

                phone:
                    userPhone || null,

                address:
                    userAddress || null,

                updated_at:
                    new Date().toISOString()
            })
            .eq(
                "id",
                currentUser.id
            )
            .select()
            .single();


        if (error) {
            throw error;
        }


        console.log(
            "Profile updated successfully:",
            data
        );

        showSuccess();

    } catch (error) {

        console.error(
            "Failed to save profile:",
            error
        );

        showProfileError(
            translateProfileError(
                error
            )
        );

    } finally {

        saveProfileBtn.disabled = false;

        if (saveText) {
            saveText.textContent =
                "SAVE CHANGES";
        }
    }
}
/* =========================================================
   PROFILE ERROR
   ========================================================= */

function translateProfileError(
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
            "profiles"
        ) &&
        lower.includes(
            "permission"
        )
    ) {
        return (
            "دسترسی برای تغییر پروفایل وجود ندارد."
        );
    }


    if (
        lower.includes(
            "row-level security"
        )
    ) {
        return (
            "قوانین امنیتی پروفایل اجازه این عملیات را نمی‌دهند."
        );
    }


    if (message) {
        return message;
    }


    return (
        "ذخیره اطلاعات انجام نشد."
    );
}


/* =========================================================
   SUCCESS
   ========================================================= */

function showSuccess() {

    if (!successModal) {
        return;
    }

    successModal.hidden =
        false;
}


function hideSuccess() {

    if (!successModal) {
        return;
    }

    successModal.hidden =
        true;
}


/* =========================================================
   ERROR MODAL
   ========================================================= */

function showProfileError(
    message
) {

    if (
        profileErrorText
    ) {
        profileErrorText.textContent =
            message;
    }

    if (
        profileErrorModal
    ) {
        profileErrorModal.hidden =
            false;
    }
}


function hideProfileError() {

    if (
        profileErrorModal
    ) {
        profileErrorModal.hidden =
            true;
    }
}


/* =========================================================
   CART COUNT
   ========================================================= */

async function updateCartCount() {

    if (!currentUser) {
        return;
    }

    const {
        data,
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


    if (!data) {

        accountCartCount.textContent =
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
                data.id
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


    accountCartCount.textContent =
        `(${count})`;
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function handleLogout() {

    logoutBtn.disabled =
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

        logoutBtn.disabled =
            false;

        showProfileError(
            "خروج از حساب انجام نشد."
        );
    }
}


/* =========================================================
   EVENTS
   ========================================================= */

function setupEvents() {

    if (profileForm) {
        profileForm.addEventListener(
            "submit",
            event => {
                event.preventDefault();
                saveProfile();
            }
        );
    }


    if (logoutBtn) {
        logoutBtn.addEventListener(
            "click",
            handleLogout
        );
    }


    if (accountRetryBtn) {
        accountRetryBtn.addEventListener(
            "click",
            initAccount
        );
    }


    if (successModalOk) {
        successModalOk.addEventListener(
            "click",
            hideSuccess
        );
    }


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


    if (
        closeProfileErrorModal
    ) {
        closeProfileErrorModal.addEventListener(
            "click",
            hideProfileError
        );
    }


    if (profileErrorOk) {
        profileErrorOk.addEventListener(
            "click",
            hideProfileError
        );
    }


    document
        .querySelectorAll(
            "[data-close-profile-error]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    hideProfileError
                );

            }
        );
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
                "login.html?redirect=account.html";
        }
    }
);


/* =========================================================
   INIT
   ========================================================= */

async function initAccount() {

    showLoading();

    try {

        currentUser =
            await getCurrentUser();


        if (!currentUser) {

            window.location.href =
                "login.html?redirect=account.html";

            return;
        }


        await loadProfile();

        await updateCartCount();


        showContent();

    } catch (error) {

        console.error(
            "Account initialization failed:",
            error
        );

        showPageError(
            "خطا در بارگذاری اطلاعات حساب."
        );
    }
}


/* =========================================================
   START
   ========================================================= */

setupEvents();

initAccount();