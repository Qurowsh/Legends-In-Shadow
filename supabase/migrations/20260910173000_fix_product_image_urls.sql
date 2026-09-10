-- Product images are stored in the `product_image` bucket.
-- Keep product_images.storage_path directly usable by the existing storefront,
-- which assigns this value to <img src>.

CREATE OR REPLACE FUNCTION public.normalize_product_image_path()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  value text;
BEGIN
  value := NULLIF(trim(NEW.storage_path), '');

  IF value IS NULL THEN
    NEW.storage_path := NULL;
    RETURN NEW;
  END IF;

  -- Already a public storage URL: keep it.
  IF value ~* '^https?://[^/]+/storage/v1/object/public/product_image/' THEN
    NEW.storage_path := value;
    RETURN NEW;
  END IF;

  -- Strip accidental legacy/full prefixes and store a canonical public URL.
  value := regexp_replace(value, '^https?://[^/]+/storage/v1/object/(public|sign|authenticated)/product_image/', '', 'i');
  value := regexp_replace(value, '^https?://[^/]+/storage/v1/object/(public|sign|authenticated)/product-images/', '', 'i');
  value := regexp_replace(value, '^/+', '');
  value := regexp_replace(value, '^product_image/', '', 'i');
  value := regexp_replace(value, '^product-images/', '', 'i');

  NEW.storage_path :=
    'https://upuqgnysdzqlxpfehqhp.supabase.co/storage/v1/object/public/product_image/'
    || value;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_product_image_path_trigger
ON public.product_images;

CREATE TRIGGER normalize_product_image_path_trigger
BEFORE INSERT OR UPDATE OF storage_path
ON public.product_images
FOR EACH ROW
EXECUTE FUNCTION public.normalize_product_image_path();

-- Fix existing records once.
UPDATE public.product_images
SET storage_path = storage_path
WHERE storage_path IS NOT NULL
  AND storage_path !~* '^https?://[^/]+/storage/v1/object/public/product_image/';

REVOKE ALL ON FUNCTION public.normalize_product_image_path() FROM PUBLIC, anon, authenticated;
