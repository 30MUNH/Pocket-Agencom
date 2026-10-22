-- Pocket Agencom: complete SePay payment setup. Run this entire file in Supabase SQL Editor.
-- Creates payment tables and usage tracking; preserves existing user/content data.

-- Run this complete file in Supabase SQL Editor against the existing Pocket Agencom DB.
-- Uses public.users(id INTEGER), the app's own users, NOT auth.users (Supabase Auth).
-- Does not change/delete any existing user, content or storage table.
BEGIN;

CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    plan_id TEXT NOT NULL,
    payment_code TEXT NOT NULL,
    amount INTEGER NOT NULL,
    duration_days INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    bank TEXT NOT NULL,
    account_number TEXT NOT NULL,
    virtual_account TEXT NOT NULL,
    account_name TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP(3) NOT NULL,
    paid_at TIMESTAMP(3),
    CONSTRAINT payment_orders_pkey PRIMARY KEY (id),
    CONSTRAINT payment_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT payment_orders_plan_check CHECK (plan_id IN ('starter', 'pro', 'advanced')),
    CONSTRAINT payment_orders_amount_check CHECK (amount > 0 AND duration_days > 0),
    CONSTRAINT payment_orders_status_check CHECK (status IN ('pending', 'paid')),
    CONSTRAINT payment_orders_code_check CHECK (payment_code ~ '^PA[0-9]{12}$'),
    CONSTRAINT payment_orders_time_check CHECK (expires_at > created_at),
    CONSTRAINT payment_orders_paid_check CHECK ((status = 'paid') = (paid_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS payment_orders_payment_code_key ON public.payment_orders(payment_code);
CREATE INDEX IF NOT EXISTS payment_orders_user_id_created_at_idx ON public.payment_orders(user_id, created_at);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    user_id INTEGER NOT NULL,
    plan_id TEXT NOT NULL,
    starts_at TIMESTAMP(3) NOT NULL,
    expires_at TIMESTAMP(3) NOT NULL,
    last_order_id UUID NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_subscriptions_pkey PRIMARY KEY (user_id),
    CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT user_subscriptions_last_order_id_fkey FOREIGN KEY (last_order_id) REFERENCES public.payment_orders(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT user_subscriptions_plan_check CHECK (plan_id IN ('starter', 'pro', 'advanced')),
    CONSTRAINT user_subscriptions_time_check CHECK (expires_at > starts_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_last_order_id_key ON public.user_subscriptions(last_order_id);

CREATE TABLE IF NOT EXISTS public.sepay_webhook_events (
    transaction_id TEXT NOT NULL,
    order_id UUID,
    payment_code TEXT,
    amount BIGINT NOT NULL,
    account_number TEXT NOT NULL,
    virtual_account TEXT,
    reference_code TEXT,
    transaction_at TIMESTAMP(3) NOT NULL,
    outcome TEXT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT sepay_webhook_events_pkey PRIMARY KEY (transaction_id),
    CONSTRAINT sepay_webhook_events_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.payment_orders(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT sepay_webhook_events_amount_check CHECK (amount > 0)
);
CREATE INDEX IF NOT EXISTS sepay_webhook_events_outcome_created_at_idx ON public.sepay_webhook_events(outcome, created_at);

-- Only trusted backend database connections may read/write payment records.
-- This app authenticates its own integer users through JWT + Express, not Supabase Auth.
-- No browser RLS write policy, public RPC, or frontend service-role key is needed.
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sepay_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_orders, public.user_subscriptions, public.sepay_webhook_events FROM PUBLIC;
DO $$
DECLARE client_role TEXT;
BEGIN
    FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
            EXECUTE format('REVOKE ALL ON public.payment_orders, public.user_subscriptions, public.sepay_webhook_events FROM %I', client_role);
        END IF;
    END LOOP;
END $$;

COMMIT;


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
