-- Run AFTER 20261022010000_sepay_va_payments. Only payment tables are changed.
BEGIN;
ALTER TABLE public.payment_orders ADD COLUMN IF NOT EXISTS bank_paid_at TIMESTAMP(3);
ALTER TABLE public.payment_orders DROP CONSTRAINT IF EXISTS payment_orders_status_check;
ALTER TABLE public.payment_orders ADD CONSTRAINT payment_orders_status_check CHECK (status IN ('pending', 'paid', 'cancelled'));

CREATE TABLE IF NOT EXISTS public.subscription_usage (
    user_id INTEGER NOT NULL,
    period_key TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT subscription_usage_pkey PRIMARY KEY (user_id, period_key),
    CONSTRAINT subscription_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT subscription_usage_count_check CHECK (count >= 0)
);
ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscription_usage FROM PUBLIC;
DO $$
DECLARE client_role TEXT;
BEGIN
    FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
            EXECUTE format('REVOKE ALL ON public.subscription_usage FROM %I', client_role);
        END IF;
    END LOOP;
END $$;
COMMIT;
