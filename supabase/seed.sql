-- =========================================
-- SEED DATA
-- Legends In Shadow
-- =========================================


-- =========================================
-- 1. Categories
-- =========================================

insert into public.categories (name, slug)
values
    ('Necklaces', 'necklaces'),
    ('Pendants', 'pendants');


-- =========================================
-- 2. Products
-- =========================================

insert into public.products (
    name,
    slug,
    description,
    category_id,
    type,
    price,
    is_active,
    material
)
values
    (
        'Necklace',
        'necklace',
        'گردنبند استیل',
        (
            select id
            from public.categories
            where slug = 'necklaces'
        ),
        'necklace',
        200000,
        true,
        'Stainless Steel'
    ),

    (
        'Dean Blunt Pendant',
        'dean-blunt-pendant',
        'پلاک استیل دین بلانت',
        (
            select id
            from public.categories
            where slug = 'pendants'
        ),
        'pendant',
        350000,
        true,
        'Stainless Steel'
    ),

    (
        'Cross Pendant',
        'cross-pendant',
        'پلاک استیل صلیب',
        (
            select id
            from public.categories
            where slug = 'pendants'
        ),
        'pendant',
        350000,
        true,
        'Stainless Steel'
    ),

    (
        'Aphex Twin Pendant',
        'aphex-twin-pendant',
        'پلاک استیل Aphex Twin',
        (
            select id
            from public.categories
            where slug = 'pendants'
        ),
        'pendant',
        350000,
        true,
        'Stainless Steel'
    );


-- =========================================
-- 3. Product Variants
-- =========================================

insert into public.product_variants (
    product_id,
    size,
    sku,
    stock,
    price
)
values

    (
        (
            select id
            from public.products
            where slug = 'necklace'
        ),
        'One Size',
        'NECKLACE-001',
        8,
        200000
    ),

    (
        (
            select id
            from public.products
            where slug = 'dean-blunt-pendant'
        ),
        'One Size',
        'DEAN-BLUNT-001',
        1,
        350000
    ),

    (
        (
            select id
            from public.products
            where slug = 'cross-pendant'
        ),
        'One Size',
        'CROSS-PENDANT-001',
        1,
        350000
    ),

    (
        (
            select id
            from public.products
            where slug = 'aphex-twin-pendant'
        ),
        'One Size',
        'APHEX-TWIN-001',
        1,
        350000
    );


-- =========================================
-- 4. Store Settings
-- =========================================

insert into public.settings (
    tax_rate,
    shipping_fee,
    free_shipping_threshold,
    currency
)
values (
    10,
    0,
    null,
    'IRT'
);