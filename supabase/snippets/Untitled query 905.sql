CREATE OR REPLACE FUNCTION public.validate_promo_code(
    p_code text,
    p_order_subtotal numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_promo public.promo_codes%ROWTYPE;
    v_discount numeric := 0;
    v_code text;
BEGIN
    v_code := upper(trim(coalesce(p_code, '')));

    IF v_code = '' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'کد تخفیف را وارد کنید'
        );
    END IF;

    IF p_order_subtotal IS NULL OR p_order_subtotal < 0 THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'مبلغ سفارش نامعتبر است'
        );
    END IF;

    SELECT *
    INTO v_promo
    FROM public.promo_codes
    WHERE upper(trim(code)) = v_code
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'کد تخفیف نامعتبر است'
        );
    END IF;

    IF NOT v_promo.is_active THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'این کد تخفیف فعال نیست'
        );
    END IF;

    IF v_promo.starts_at IS NOT NULL
       AND now() < v_promo.starts_at THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'اعتبار این کد تخفیف هنوز شروع نشده است'
        );
    END IF;

    IF v_promo.expires_at IS NOT NULL
       AND now() > v_promo.expires_at THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'این کد تخفیف منقضی شده است'
        );
    END IF;

    IF v_promo.max_uses IS NOT NULL
       AND v_promo.used_count >= v_promo.max_uses THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message', 'ظرفیت استفاده از این کد تخفیف تکمیل شده است'
        );
    END IF;

    IF p_order_subtotal < v_promo.minimum_order THEN
        RETURN jsonb_build_object(
            'valid', false,
            'message',
            'حداقل مبلغ سفارش برای استفاده از این کد ' ||
            v_promo.minimum_order::text || ' تومان است'
        );
    END IF;

    -- Percentage discount
    IF lower(v_promo.discount_type) = 'percentage' THEN

        IF v_promo.discount_value < 0
           OR v_promo.discount_value > 100 THEN
            RETURN jsonb_build_object(
                'valid', false,
                'message', 'مقدار درصد تخفیف نامعتبر است'
            );
        END IF;

        v_discount :=
            round(
                p_order_subtotal * v_promo.discount_value / 100
            );

    -- Fixed discount
    ELSIF lower(v_promo.discount_type) = 'fixed' THEN

        IF v_promo.discount_value < 0 THEN
            RETURN jsonb_build_object(
                'valid', false,
                'message', 'مقدار تخفیف نامعتبر است'
            );
        END IF;

        v_discount := v_promo.discount_value;

    ELSE

        RETURN jsonb_build_object(
            'valid', false,
            'message', 'نوع تخفیف نامعتبر است'
        );

    END IF;

    -- Never allow discount to exceed subtotal
    v_discount := LEAST(v_discount, p_order_subtotal);

    RETURN jsonb_build_object(
        'valid', true,
        'code', v_promo.code,
        'discount_type', v_promo.discount_type,
        'discount_value', v_promo.discount_value,
        'discount_amount', v_discount,
        'minimum_order', v_promo.minimum_order
    );
END;
$$;