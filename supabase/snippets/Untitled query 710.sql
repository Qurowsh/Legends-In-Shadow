-- =========================================================
-- SECURE RPC EXECUTION
-- =========================================================

REVOKE ALL
ON FUNCTION public.confirm_order_payment(bigint)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.confirm_order_payment(bigint)
TO postgres, service_role;


REVOKE ALL
ON FUNCTION public.fail_order_payment(bigint)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.fail_order_payment(bigint)
TO postgres, service_role;


REVOKE ALL
ON FUNCTION public.create_order_from_cart(
    text,
    text,
    text,
    text,
    numeric,
    numeric
)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.create_order_from_cart(
    text,
    text,
    text,
    text,
    numeric,
    numeric
)
TO authenticated, postgres, service_role;


REVOKE ALL
ON FUNCTION public.create_payment(bigint, text)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.create_payment(bigint, text)
TO authenticated, postgres, service_role;


REVOKE ALL
ON FUNCTION public.admin_update_order_status(bigint, text)
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.admin_update_order_status(bigint, text)
TO authenticated, postgres, service_role;


REVOKE ALL
ON FUNCTION public.create_order(text, text, text)
FROM PUBLIC, anon, authenticated;


-- =========================================================
-- PAYMENTS TABLE
-- =========================================================

REVOKE ALL
ON TABLE public.payments
FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE
ON TABLE public.payments
FROM authenticated;


-- =========================================================
-- STOCK RESERVATIONS
-- =========================================================

REVOKE ALL
ON TABLE public.order_stock_reservations
FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE
ON TABLE public.order_stock_reservations
FROM authenticated;


-- =========================================================
-- PROFILE ROLE
-- =========================================================

ALTER TABLE public.profiles
ALTER COLUMN role SET DEFAULT 'customer';

UPDATE public.profiles
SET role = 'customer'
WHERE role IS NULL
   OR role = 'user';