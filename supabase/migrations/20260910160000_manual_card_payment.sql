-- =========================================================
-- Manual card-to-card payment
-- =========================================================

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS receipt_path text;

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS admin_note text;

ALTER TABLE public.settings
    ADD COLUMN IF NOT EXISTS payment_bank_name text;

ALTER TABLE public.settings
    ADD COLUMN IF NOT EXISTS payment_card_number text;

ALTER TABLE public.settings
    ADD COLUMN IF NOT EXISTS payment_card_holder text;

ALTER TABLE public.settings
    ADD COLUMN IF NOT EXISTS payment_iban text;

-- Keep the receipt bucket private. The bucket already exists in the Cloud project,
-- but this also makes local resets/replays deterministic.
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_receipts', 'payment_receipts', false)
ON CONFLICT (id) DO UPDATE
SET public = false;

-- Storage policies are recreated idempotently so this migration can be applied
-- to the current Cloud project after the policies were created manually.
DROP POLICY IF EXISTS "Users can upload own payment receipts" ON storage.objects;
CREATE POLICY "Users can upload own payment receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'payment_receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view own payment receipts" ON storage.objects;
CREATE POLICY "Users can view own payment receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'payment_receipts'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS "Users can update own payment receipts" ON storage.objects;
CREATE POLICY "Users can update own payment receipts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'payment_receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'payment_receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own payment receipts" ON storage.objects;
CREATE POLICY "Users can delete own payment receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'payment_receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public checkout data is exposed through a narrow RPC instead of exposing the
-- entire settings row.
CREATE OR REPLACE FUNCTION public.get_payment_settings()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'bank_name', payment_bank_name,
        'card_number', payment_card_number,
        'card_holder', payment_card_holder,
        'iban', payment_iban
    )
    FROM public.settings
    ORDER BY id ASC
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_payment_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_payment_settings() TO anon, authenticated;

-- Securely attach a user-uploaded receipt to the user's own pending payment.
CREATE OR REPLACE FUNCTION public.submit_payment_receipt(
    p_payment_id bigint,
    p_receipt_path text
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_payment public.payments%ROWTYPE;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_receipt_path IS NULL OR btrim(p_receipt_path) = '' THEN
        RAISE EXCEPTION 'Receipt path is required';
    END IF;

    IF split_part(p_receipt_path, '/', 1) <> v_user_id::text THEN
        RAISE EXCEPTION 'Invalid receipt path';
    END IF;

    IF split_part(p_receipt_path, '/', 2) <> p_payment_id::text THEN
        RAISE EXCEPTION 'Invalid receipt path';
    END IF;

    IF p_receipt_path LIKE '/%'
       OR position('..' in p_receipt_path) > 0 THEN
        RAISE EXCEPTION 'Invalid receipt path';
    END IF;

    SELECT *
    INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id
      AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;

    IF v_payment.status <> 'pending' THEN
        RAISE EXCEPTION 'Payment is not pending';
    END IF;

    IF lower(trim(coalesce(v_payment.gateway, ''))) <> 'card_to_card' THEN
        RAISE EXCEPTION 'Invalid payment gateway';
    END IF;

    UPDATE public.payments
    SET receipt_path = p_receipt_path
    WHERE id = p_payment_id
    RETURNING * INTO v_payment;

    RETURN v_payment;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_payment_receipt(bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_payment_receipt(bigint, text) TO authenticated;

-- Admin-only payment approval.
CREATE OR REPLACE FUNCTION public.admin_confirm_card_payment(
    p_payment_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payment public.payments%ROWTYPE;
    v_order public.orders%ROWTYPE;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    SELECT *
    INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;

    IF lower(trim(coalesce(v_payment.gateway, ''))) <> 'card_to_card' THEN
        RAISE EXCEPTION 'Invalid payment gateway';
    END IF;

    IF v_payment.status = 'paid' THEN
        RETURN true;
    END IF;

    IF v_payment.status <> 'pending' THEN
        RAISE EXCEPTION 'Payment is not pending';
    END IF;

    IF v_payment.receipt_path IS NULL OR btrim(v_payment.receipt_path) = '' THEN
        RAISE EXCEPTION 'Payment receipt is required';
    END IF;

    SELECT *
    INTO v_order
    FROM public.orders
    WHERE id = v_payment.order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.payment_status = 'paid' THEN
        RETURN true;
    END IF;

    UPDATE public.payments
    SET
        status = 'paid',
        paid_at = now()
    WHERE id = p_payment_id;

    UPDATE public.order_stock_reservations
    SET
        status = 'confirmed',
        confirmed_at = now()
    WHERE order_id = v_payment.order_id
      AND status = 'reserved';

    UPDATE public.orders
    SET
        payment_status = 'paid',
        status = 'processing',
        updated_at = now()
    WHERE id = v_payment.order_id;

    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_confirm_card_payment(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_confirm_card_payment(bigint) TO authenticated;

-- Admin-only payment rejection + stock release.
CREATE OR REPLACE FUNCTION public.admin_reject_card_payment(
    p_payment_id bigint,
    p_admin_note text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payment public.payments%ROWTYPE;
    v_order public.orders%ROWTYPE;
    v_reservation record;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    SELECT *
    INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found';
    END IF;

    IF lower(trim(coalesce(v_payment.gateway, ''))) <> 'card_to_card' THEN
        RAISE EXCEPTION 'Invalid payment gateway';
    END IF;

    IF v_payment.status = 'paid' THEN
        RAISE EXCEPTION 'Payment is already paid';
    END IF;

    IF v_payment.status IN ('failed', 'cancelled') THEN
        RETURN true;
    END IF;

    IF v_payment.status <> 'pending' THEN
        RAISE EXCEPTION 'Payment is not pending';
    END IF;

    SELECT *
    INTO v_order
    FROM public.orders
    WHERE id = v_payment.order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    UPDATE public.payments
    SET
        status = 'failed',
        admin_note = NULLIF(btrim(coalesce(p_admin_note, '')), '')
    WHERE id = p_payment_id;

    FOR v_reservation IN
        SELECT id, product_variant_id, quantity
        FROM public.order_stock_reservations
        WHERE order_id = v_payment.order_id
          AND status = 'reserved'
        FOR UPDATE
    LOOP
        UPDATE public.product_variants
        SET stock = stock + v_reservation.quantity
        WHERE id = v_reservation.product_variant_id;

        UPDATE public.order_stock_reservations
        SET
            status = 'released',
            released_at = now()
        WHERE id = v_reservation.id;
    END LOOP;

    UPDATE public.orders
    SET
        payment_status = 'failed',
        status = 'cancelled',
        updated_at = now()
    WHERE id = v_payment.order_id;

    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reject_card_payment(bigint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reject_card_payment(bigint, text) TO authenticated;

-- Admin-only payment settings editor.
CREATE OR REPLACE FUNCTION public.admin_update_payment_settings(
    p_bank_name text,
    p_card_number text,
    p_card_holder text,
    p_iban text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id bigint;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    SELECT id
    INTO v_id
    FROM public.settings
    ORDER BY id ASC
    LIMIT 1;

    IF v_id IS NULL THEN
        INSERT INTO public.settings (
            payment_bank_name,
            payment_card_number,
            payment_card_holder,
            payment_iban
        )
        VALUES (
            NULLIF(btrim(coalesce(p_bank_name, '')), ''),
            NULLIF(btrim(coalesce(p_card_number, '')), ''),
            NULLIF(btrim(coalesce(p_card_holder, '')), ''),
            NULLIF(btrim(coalesce(p_iban, '')), '')
        );
    ELSE
        UPDATE public.settings
        SET
            payment_bank_name = NULLIF(btrim(coalesce(p_bank_name, '')), ''),
            payment_card_number = NULLIF(btrim(coalesce(p_card_number, '')), ''),
            payment_card_holder = NULLIF(btrim(coalesce(p_card_holder, '')), ''),
            payment_iban = NULLIF(btrim(coalesce(p_iban, '')), ''),
            updated_at = now()
        WHERE id = v_id;
    END IF;

    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_payment_settings(text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_payment_settings(text, text, text, text) TO authenticated;
