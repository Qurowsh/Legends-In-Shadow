-- =========================================================
-- Product image storage RLS
-- Bucket: product_image
-- Only authenticated admins can upload/change/delete product images.
-- The bucket itself remains public for storefront image URLs.
-- =========================================================

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'product_image'
    AND public.is_admin()
);

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'product_image'
    AND public.is_admin()
)
WITH CHECK (
    bucket_id = 'product_image'
    AND public.is_admin()
);

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'product_image'
    AND public.is_admin()
);
