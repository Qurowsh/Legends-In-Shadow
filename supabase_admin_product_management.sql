-- =========================================================
-- NICHERZ / SUPABASE
-- ADMIN PRODUCT MANAGEMENT POLICIES
-- =========================================================
--
-- Run this file once in Supabase SQL Editor.
-- The frontend still checks role=admin, but these policies are the
-- real database-level protection for product CRUD and image storage.
--
-- Product deletion is intentionally implemented as a soft delete
-- (is_active=false) in the Admin UI so existing order history is preserved.
-- =========================================================


-- =========================================================
-- PRODUCTS
-- =========================================================

alter table public.products enable row level security;

drop policy if exists "Admins can view all products"
on public.products;

create policy "Admins can view all products"
on public.products
for select
to authenticated
using (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
);


drop policy if exists "Admins can insert products"
on public.products;

create policy "Admins can insert products"
on public.products
for insert
to authenticated
with check (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
);


drop policy if exists "Admins can update products"
on public.products;

create policy "Admins can update products"
on public.products
for update
to authenticated
using (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
)
with check (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
);


drop policy if exists "Admins can delete products"
on public.products;

create policy "Admins can delete products"
on public.products
for delete
to authenticated
using (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
);


-- =========================================================
-- PRODUCT VARIANTS
-- =========================================================

alter table public.product_variants enable row level security;

drop policy if exists "Admins can insert product variants"
on public.product_variants;

create policy "Admins can insert product variants"
on public.product_variants
for insert
to authenticated
with check (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
);


drop policy if exists "Admins can update product variants"
on public.product_variants;

create policy "Admins can update product variants"
on public.product_variants
for update
to authenticated
using (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
)
with check (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
);


drop policy if exists "Admins can delete product variants"
on public.product_variants;

create policy "Admins can delete product variants"
on public.product_variants
for delete
to authenticated
using (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
);


-- =========================================================
-- PRODUCT IMAGES TABLE
-- =========================================================

alter table public.product_images enable row level security;

drop policy if exists "Admins can insert product images"
on public.product_images;

create policy "Admins can insert product images"
on public.product_images
for insert
to authenticated
with check (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
);


drop policy if exists "Admins can update product images"
on public.product_images;

create policy "Admins can update product images"
on public.product_images
for update
to authenticated
using (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
)
with check (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
);


drop policy if exists "Admins can delete product images"
on public.product_images;

create policy "Admins can delete product images"
on public.product_images
for delete
to authenticated
using (
    exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
);


-- =========================================================
-- STORAGE: product-images
-- =========================================================
--
-- The bucket itself is public for product display.
-- These policies only control who may upload/change/remove objects.
-- =========================================================


drop policy if exists "Admins can upload product images"
on storage.objects;

create policy "Admins can upload product images"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'product-images'
    and exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
);


drop policy if exists "Admins can update product image objects"
on storage.objects;

create policy "Admins can update product image objects"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'product-images'
    and exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
)
with check (
    bucket_id = 'product-images'
    and exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
);


drop policy if exists "Admins can delete product image objects"
on storage.objects;

create policy "Admins can delete product image objects"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'product-images'
    and exists (
        select 1
        from public.profiles
        where profiles.id = auth.uid()
          and profiles.role = 'admin'
    )
);
