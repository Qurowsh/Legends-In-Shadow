select
    conname,
    pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.orders'::regclass
  and conname = 'orders_status_check';