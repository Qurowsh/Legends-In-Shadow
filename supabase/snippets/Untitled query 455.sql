SELECT
    p.oid::regprocedure AS function_signature
FROM pg_proc p
JOIN pg_namespace n
    ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname = 'create_order_from_cart';