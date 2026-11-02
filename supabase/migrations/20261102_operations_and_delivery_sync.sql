-- ==============================================================================
-- MIGRACIÓN UNIFICADA: OPERACIONES, SALA, COMANDAS, CORTE Z Y DELIVERY CORPORATIVO
-- ==============================================================================

-- 1. Columnas de Stripe y Webhook en organizations (DT-04)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz,
ADD COLUMN IF NOT EXISTS webhook_url text,
ADD COLUMN IF NOT EXISTS webhook_secret text;

-- 2. Tabla coupons (Red de Anuncios y Cupones)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID REFERENCES public.ads(id) ON DELETE SET NULL,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    tag_code TEXT,
    customer_phone TEXT,
    customer_name TEXT,
    coupon_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    advertiser_name TEXT NOT NULL,
    discount_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
    ticket_amount NUMERIC(10,2) DEFAULT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NULL,
    redeemed_by TEXT DEFAULT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupons_restaurant ON public.coupons(restaurant_id);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'Public read active coupons') THEN
        CREATE POLICY "Public read active coupons" ON public.coupons FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'Public insert generated coupons') THEN
        CREATE POLICY "Public insert generated coupons" ON public.coupons FOR INSERT TO anon, authenticated WITH CHECK (status = 'active' AND length(coupon_code) >= 6);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'Superadmin full access to coupons') THEN
        CREATE POLICY "Superadmin full access to coupons" ON public.coupons FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'coupons' AND policyname = 'Members redeem their restaurant coupons') THEN
        CREATE POLICY "Members redeem their restaurant coupons" ON public.coupons FOR UPDATE TO authenticated USING (
            restaurant_id IS NULL OR restaurant_id IN (
                SELECT id FROM public.restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
            )
        ) WITH CHECK (status IN ('redeemed', 'active'));
    END IF;
END $$;

-- 3. Tabla menu_items
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('entradas', 'principales', 'bebidas', 'postres')),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    preparation_time_mins INT NOT NULL DEFAULT 15,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON public.menu_items(restaurant_id);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'menu_items' AND policyname = 'Public read available menu items') THEN
        CREATE POLICY "Public read available menu items" ON public.menu_items FOR SELECT TO anon, authenticated USING (is_available = true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'menu_items' AND policyname = 'Superadmin full access to menu_items') THEN
        CREATE POLICY "Superadmin full access to menu_items" ON public.menu_items FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'menu_items' AND policyname = 'Members manage their menu_items') THEN
        CREATE POLICY "Members manage their menu_items" ON public.menu_items FOR ALL TO authenticated USING (
            restaurant_id IN (
                SELECT id FROM public.restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
            )
        ) WITH CHECK (
            restaurant_id IN (
                SELECT id FROM public.restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
            )
        );
    END IF;
END $$;

-- 4. Tabla table_orders
CREATE TABLE IF NOT EXISTS public.table_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    tag_code TEXT NOT NULL,
    table_number TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
    customer_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_table_orders_restaurant ON public.table_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_table_orders_status ON public.table_orders(status);

ALTER TABLE public.table_orders ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'table_orders' AND policyname = 'Public insert new orders') THEN
        CREATE POLICY "Public insert new orders" ON public.table_orders FOR INSERT TO anon, authenticated WITH CHECK (
            status = 'pending' AND length(table_number) >= 1 AND total_amount >= 0
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'table_orders' AND policyname = 'Public read orders by id') THEN
        CREATE POLICY "Public read orders by id" ON public.table_orders FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'table_orders' AND policyname = 'Superadmin full access to table_orders') THEN
        CREATE POLICY "Superadmin full access to table_orders" ON public.table_orders FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'table_orders' AND policyname = 'Members view their restaurant orders') THEN
        CREATE POLICY "Members view their restaurant orders" ON public.table_orders FOR SELECT TO authenticated USING (
            restaurant_id IN (
                SELECT id FROM public.restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
            )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'table_orders' AND policyname = 'Members update their restaurant orders') THEN
        CREATE POLICY "Members update their restaurant orders" ON public.table_orders FOR UPDATE TO authenticated USING (
            restaurant_id IN (
                SELECT id FROM public.restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
            )
        ) WITH CHECK (
            restaurant_id IN (
                SELECT id FROM public.restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
            )
        );
    END IF;
END $$;

-- 5. Tabla table_calls
CREATE TABLE IF NOT EXISTS public.table_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    tag_code TEXT NOT NULL,
    table_number TEXT NOT NULL,
    call_type TEXT NOT NULL CHECK (call_type IN ('waiter', 'bill_cash', 'bill_card', 'help')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'attended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    attended_at TIMESTAMPTZ DEFAULT NULL,
    attended_by TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_table_calls_restaurant ON public.table_calls(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_table_calls_status ON public.table_calls(status);

ALTER TABLE public.table_calls ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'table_calls' AND policyname = 'Public insert table calls') THEN
        CREATE POLICY "Public insert table calls" ON public.table_calls FOR INSERT TO anon, authenticated WITH CHECK (
            status = 'active' AND length(table_number) >= 1
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'table_calls' AND policyname = 'Superadmin full access to table_calls') THEN
        CREATE POLICY "Superadmin full access to table_calls" ON public.table_calls FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'table_calls' AND policyname = 'Members view and attend their table_calls') THEN
        CREATE POLICY "Members view and attend their table_calls" ON public.table_calls FOR ALL TO authenticated USING (
            restaurant_id IN (
                SELECT id FROM public.restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
            )
        ) WITH CHECK (
            restaurant_id IN (
                SELECT id FROM public.restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
            )
        );
    END IF;
END $$;

-- 6. Tabla restaurant_staff y verify_staff_pin
CREATE TABLE IF NOT EXISTS public.restaurant_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('waiter', 'kitchen', 'manager')),
    pin_code TEXT NOT NULL CHECK (length(pin_code) >= 4),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_staff_res ON public.restaurant_staff(restaurant_id);

ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'restaurant_staff' AND policyname = 'Superadmin full access to restaurant_staff') THEN
        CREATE POLICY "Superadmin full access to restaurant_staff" ON public.restaurant_staff FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'restaurant_staff' AND policyname = 'Members manage their restaurant_staff') THEN
        CREATE POLICY "Members manage their restaurant_staff" ON public.restaurant_staff FOR ALL TO authenticated USING (
            restaurant_id IN (
                SELECT id FROM public.restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
            )
        ) WITH CHECK (
            restaurant_id IN (
                SELECT id FROM public.restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
            )
        );
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.verify_staff_pin(p_restaurant_id UUID, p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff public.restaurant_staff%ROWTYPE;
BEGIN
    SELECT * INTO v_staff
    FROM public.restaurant_staff
    WHERE restaurant_id = p_restaurant_id
      AND pin_code = p_pin
      AND is_active = true
    LIMIT 1;

    IF v_staff.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'staff', jsonb_build_object(
                'id', v_staff.id,
                'name', v_staff.name,
                'role', v_staff.role,
                'restaurant_id', v_staff.restaurant_id
            )
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'PIN de acceso incorrecto o personal inactivo.'
        );
    END IF;
END;
$$;

-- 7. Tabla push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_org ON public.push_subscriptions(organization_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'push_subscriptions' AND policyname = 'Superadmin full access to push_subscriptions') THEN
        CREATE POLICY "Superadmin full access to push_subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'push_subscriptions' AND policyname = 'Members manage their push_subscriptions') THEN
        CREATE POLICY "Members manage their push_subscriptions" ON public.push_subscriptions FOR ALL TO authenticated USING (
            organization_id IN (SELECT get_user_organization_ids())
        ) WITH CHECK (
            organization_id IN (SELECT get_user_organization_ids())
        );
    END IF;
END $$;

-- 8. Tabla table_sessions (DT-12: Split Bill y Comandas Colaborativas)
CREATE TABLE IF NOT EXISTS public.table_sessions (
    id text PRIMARY KEY,
    restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    table_number integer NOT NULL,
    status text DEFAULT 'open' NOT NULL,
    participants jsonb DEFAULT '[]'::jsonb NOT NULL,
    split_mode text,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    paid_amount numeric(10,2) DEFAULT 0 NOT NULL,
    opened_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_table_sessions_restaurant ON public.table_sessions(restaurant_id);
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'table_sessions' AND policyname = 'Gestión pública y autenticada de table_sessions') THEN
        CREATE POLICY "Gestión pública y autenticada de table_sessions" ON public.table_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 9. Tabla daily_cash_closes (DT-13: Arqueo Ciego y Corte Z)
CREATE TABLE IF NOT EXISTS public.daily_cash_closes (
    id text PRIMARY KEY,
    restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    shift_date date DEFAULT CURRENT_DATE NOT NULL,
    closed_by_staff_id text,
    closed_by_name text NOT NULL,
    initial_cash_float numeric(10,2) DEFAULT 0 NOT NULL,
    gross_sales numeric(10,2) DEFAULT 0 NOT NULL,
    net_sales numeric(10,2) DEFAULT 0 NOT NULL,
    cash_sales numeric(10,2) DEFAULT 0 NOT NULL,
    card_sales numeric(10,2) DEFAULT 0 NOT NULL,
    discounts_total numeric(10,2) DEFAULT 0 NOT NULL,
    tips_total numeric(10,2) DEFAULT 0 NOT NULL,
    cash_counted numeric(10,2) DEFAULT 0 NOT NULL,
    cash_difference numeric(10,2) DEFAULT 0 NOT NULL,
    discrepancy_reason text,
    status text DEFAULT 'balanced' NOT NULL,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_cash_closes_restaurant ON public.daily_cash_closes(restaurant_id);
ALTER TABLE public.daily_cash_closes ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_cash_closes' AND policyname = 'Gestión pública y autenticada de daily_cash_closes') THEN
        CREATE POLICY "Gestión pública y autenticada de daily_cash_closes" ON public.daily_cash_closes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 10. Tabla corporate_orders (DT-17 & DT-19: Delivery Oficinas y Blindaje Handshake PIN)
CREATE TABLE IF NOT EXISTS public.corporate_orders (
    id text PRIMARY KEY,
    restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    folio text NOT NULL,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_email text,
    delivery_mode text DEFAULT 'office_delivery' NOT NULL,
    building_name text,
    floor_office text,
    delivery_instructions text,
    handshake_pin text NOT NULL,
    payment_method text DEFAULT 'cash' NOT NULL,
    cash_change_for numeric(10,2),
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    total_amount numeric(10,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending' NOT NULL,
    verified_at timestamptz,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_corporate_orders_restaurant ON public.corporate_orders(restaurant_id);
ALTER TABLE public.corporate_orders ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'corporate_orders' AND policyname = 'Gestión pública y autenticada de corporate_orders') THEN
        CREATE POLICY "Gestión pública y autenticada de corporate_orders" ON public.corporate_orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 11. Tabla crm_webhook_logs (DT-08: Bitácora de Webhooks CRM)
CREATE TABLE IF NOT EXISTS public.crm_webhook_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    ad_id uuid REFERENCES public.ads(id) ON DELETE SET NULL,
    target_url text NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    status_code integer,
    response_body text,
    attempts integer DEFAULT 1,
    is_success boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_webhook_logs_org ON public.crm_webhook_logs(organization_id);
ALTER TABLE public.crm_webhook_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'crm_webhook_logs' AND policyname = 'Gestión de logs de webhooks CRM') THEN
        CREATE POLICY "Gestión de logs de webhooks CRM" ON public.crm_webhook_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
