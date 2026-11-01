-- ==============================================================================
-- SCHEMA COMPLETO: PLATAFORMA NFC GOOGLE RESEÑAS & RED PUBLICITARIA LOCAL
-- ==============================================================================

-- Habilitar extensión para UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABLA: ORGANIZACIONES (DUEÑOS MULTI-SUCURSAL Y MULTI-MARCA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    owner_email TEXT,
    owner_phone TEXT,
    notify_negative_feedback BOOLEAN NOT NULL DEFAULT true,
    billing_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. TABLA: RESTAURANTES / SUCURSALES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    brand_name TEXT NOT NULL,
    branch_name TEXT NOT NULL DEFAULT 'Principal',
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    google_review_url TEXT NOT NULL,
    logo_url TEXT,
    business_type TEXT NOT NULL DEFAULT 'restaurant' CHECK (business_type IN ('restaurant', 'gym', 'dental', 'spa', 'general')),
    tier INT NOT NULL DEFAULT 2 CHECK (tier IN (1, 2, 3, 4)),
    is_ad_free BOOLEAN NOT NULL DEFAULT false,
    brand_color TEXT NOT NULL DEFAULT '#2563eb',
    links JSONB NOT NULL DEFAULT '[]'::jsonb,
    address TEXT,
    manager_phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. TABLA: ADS (RED PUBLICITARIA LOCAL)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    advertiser_name TEXT NOT NULL,
    banner_url TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    placement_type TEXT NOT NULL DEFAULT 'bottom_banner' CHECK (placement_type IN ('bottom_banner', 'interstitial')),
    target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'specific_restaurants', 'specific_tags')),
    target_restaurant_ids UUID[] DEFAULT ARRAY[]::UUID[],
    target_tag_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    impressions_count INT NOT NULL DEFAULT 0,
    clicks_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. TABLA: TAGS (CHIPS FÍSICOS NFC Y CÓDIGOS QR)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_code TEXT UNIQUE NOT NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    table_identifier TEXT,
    custom_ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
    scan_count INT NOT NULL DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. TABLA: FEEDBACK (BUZÓN PRIVADO DE QUEJAS 1-3 ESTRELLAS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    tag_code TEXT,
    rating INT NOT NULL CHECK (rating IN (1, 2, 3)),
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    comments TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'contacted', 'resolved')),
    internal_notes TEXT DEFAULT NULL,
    notified_to_owner BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5B. TABLA: ORGANIZATION_MEMBERS (USUARIOS SUSCRIPTORES Y GERENTES)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);

-- ------------------------------------------------------------------------------
-- 6. TABLA: TAG_SCANS (HISTORIAL DE ESCANEOS - ARQUITECTURA TIER 4)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tag_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_code TEXT NOT NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- ÍNDICES PARA BÚSQUEDA RÁPIDA
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tags_code ON tags(tag_code);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_org ON restaurants(organization_id);
CREATE INDEX IF NOT EXISTS idx_feedback_restaurant ON feedback(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ads_active ON ads(is_active);

-- ------------------------------------------------------------------------------
-- FUNCIONES RPC ATÓMICAS (SECTOR CLIENTE PÚBLICO)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_tag_scan(p_tag_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_restaurant_id UUID;
    v_last_scan TIMESTAMPTZ;
BEGIN
    SELECT restaurant_id, last_scanned_at 
    INTO v_restaurant_id, v_last_scan 
    FROM tags 
    WHERE tag_code = p_tag_code AND is_active = true;
    
    IF v_restaurant_id IS NOT NULL THEN
        -- Protección contra bucles de escaneo (Rate Limit mínimo de 2 segundos por tag)
        IF v_last_scan IS NULL OR (now() - v_last_scan) > interval '2 seconds' THEN
            UPDATE tags 
            SET scan_count = scan_count + 1,
                last_scanned_at = now()
            WHERE tag_code = p_tag_code;

            INSERT INTO tag_scans(tag_code, restaurant_id) VALUES (p_tag_code, v_restaurant_id);
        END IF;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION increment_ad_stats(p_ad_id UUID, p_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_type NOT IN ('impression', 'click') THEN
        RAISE EXCEPTION 'Tipo de evento publicitario no válido: %', p_type;
    END IF;

    IF p_type = 'impression' THEN
        UPDATE ads 
        SET impressions_count = impressions_count + 1 
        WHERE id = p_ad_id AND is_active = true;
    ELSIF p_type = 'click' THEN
        UPDATE ads 
        SET clicks_count = clicks_count + 1 
        WHERE id = p_ad_id AND is_active = true;
    END IF;
END;
$$;

-- ==============================================================================
-- FUNCIONES AUXILIARES PARA ROLES Y RLS MULTI-TENANT
-- ==============================================================================
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (
      email = 'arteagaescorza@gmail.com'
      OR (raw_app_meta_data->>'role') = 'superadmin'
    )
  );
$$;

CREATE OR REPLACE FUNCTION get_user_organization_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$;

-- ------------------------------------------------------------------------------
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_scans ENABLE ROW LEVEL SECURITY;

-- 1. Organizations: Superadmin total, miembros solo su organización
CREATE POLICY "Superadmin full access to organizations"
ON organizations FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Members view their organizations"
ON organizations FOR SELECT
TO authenticated
USING (id IN (SELECT get_user_organization_ids()));

-- 1B. Organization Members: Superadmin total, miembros ven su membresía
CREATE POLICY "Superadmin full access to org_members"
ON organization_members FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Members view organization members"
ON organization_members FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Owners can remove organization members"
ON organization_members FOR DELETE
TO authenticated
USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role = 'owner'
));

-- 2. Restaurants: Lectura pública si is_active = true, escritura superadmin o miembros
CREATE POLICY "Public read active restaurants"
ON restaurants FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Superadmin full access to restaurants"
ON restaurants FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Members view their restaurants"
ON restaurants FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Members update their restaurants"
ON restaurants FOR UPDATE
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids()))
WITH CHECK (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Members create their restaurants"
ON restaurants FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (SELECT get_user_organization_ids())
);

-- 3. Tags: Lectura pública de tags activos, escritura superadmin
CREATE POLICY "Public read active tags"
ON tags FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Superadmin full access to tags"
ON tags FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- 4. Ads: Lectura pública de anuncios activos, gestión superadmin
CREATE POLICY "Public read active ads"
ON ads FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Superadmin full access to ads"
ON ads FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

-- 5. Feedback: Inserción pública comensal, lectura/gestión superadmin y miembros del local
CREATE POLICY "Public insert feedback"
ON feedback FOR INSERT
TO anon, authenticated
WITH CHECK (
    status = 'new'
    AND notified_to_owner = false
    AND length(comments) >= 3
    AND length(comments) <= 2000
    AND rating IN (1, 2, 3)
);

CREATE POLICY "Superadmin full access to feedback"
ON feedback FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Members view their feedback"
ON feedback FOR SELECT
TO authenticated
USING (restaurant_id IN (
    SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
));

CREATE POLICY "Members update their feedback"
ON feedback FOR UPDATE
TO authenticated
USING (restaurant_id IN (
    SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
))
WITH CHECK (restaurant_id IN (
    SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
));

-- 6. Tag Scans: Superadmin acceso total, miembros ven solo los de sus locales
CREATE POLICY "Superadmin full access to tag_scans"
ON tag_scans FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Members view their restaurant tag_scans"
ON tag_scans FOR SELECT
TO authenticated
USING (restaurant_id IN (
    SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
));



-- ------------------------------------------------------------------------------
-- 7. TABLA: SUPPORT_TICKETS (MESA DE AYUDA B2B LOCATARIO <-> SUPERADMIN - SPEC-008)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('plate_damaged', 'billing', 'more_plates', 'general')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
    admin_reply TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_org ON support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin full access to support_tickets"
ON support_tickets FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Members view their support_tickets"
ON support_tickets FOR SELECT
TO authenticated
USING (organization_id IN (SELECT get_user_organization_ids()));

CREATE POLICY "Members create their support_tickets"
ON support_tickets FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (SELECT get_user_organization_ids())
    AND status = 'pending'
);

-- ------------------------------------------------------------------------------
-- ASEGURAR COLUMNAS PARA RED PUBLICITARIA Y GEOLOCALIZACIÓN
-- ------------------------------------------------------------------------------
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS coordinates JSONB DEFAULT '{"lat": 19.4185, "lng": -99.1625}'::jsonb;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS ad_credit_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS blocked_ad_categories TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE ads ADD COLUMN IF NOT EXISTS budget_total NUMERIC(10,2) DEFAULT 1000.00;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS budget_spent NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS cpc NUMERIC(10,2) DEFAULT 1.50;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS cpm NUMERIC(10,2) DEFAULT 0.15;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE ads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- ------------------------------------------------------------------------------
-- CONTROL DE PROPIEDADES A NIVEL DE COLUMNA (MASS ASSIGNMENT PREVENTION - VULN-002)
-- Bloquea que un locatario altere tier, is_ad_free o ad_credit_balance sin autorización
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_unauthorized_restaurant_billing_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Permitir si la acción es ejecutada por el Superadmin
    IF is_superadmin() THEN
        RETURN NEW;
    END IF;

    -- Si es INSERT (Creación de nueva sucursal por parte de un miembro común)
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.tier IS NOT NULL AND NEW.tier != 2) THEN
            RAISE EXCEPTION 'Acceso denegado: Las nuevas sucursales deben crearse en el Nivel 2 estándar.';
        END IF;
        IF (NEW.is_ad_free IS NOT NULL AND NEW.is_ad_free = true) THEN
            RAISE EXCEPTION 'Acceso denegado: El estado libre de anuncios requiere contratación.';
        END IF;
        IF (NEW.ad_credit_balance IS NOT NULL AND NEW.ad_credit_balance > 0) THEN
            RAISE EXCEPTION 'Acceso denegado: No se pueden auto-asignar créditos publicitarios.';
        END IF;
        RETURN NEW;
    END IF;

    -- Si es UPDATE:
    IF (NEW.tier IS DISTINCT FROM OLD.tier) THEN
        RAISE EXCEPTION 'Acceso denegado: El nivel de suscripción (tier) solo puede modificarse mediante el flujo de pago verificado.';
    END IF;

    IF (NEW.is_ad_free IS DISTINCT FROM OLD.is_ad_free) THEN
        RAISE EXCEPTION 'Acceso denegado: El estado libre de anuncios (is_ad_free) requiere suscripción activa.';
    END IF;

    IF (NEW.ad_credit_balance IS DISTINCT FROM OLD.ad_credit_balance) THEN
        RAISE EXCEPTION 'Acceso denegado: El saldo de créditos publicitarios no puede ser alterado directamente.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_restaurant_billing ON restaurants;
CREATE TRIGGER trg_protect_restaurant_billing
BEFORE INSERT OR UPDATE ON restaurants
FOR EACH ROW
EXECUTE FUNCTION prevent_unauthorized_restaurant_billing_mutation();

-- ------------------------------------------------------------------------------
-- 8. TABLA: COUPONS (PASAPORTE DIGITAL Y CANJE DE PROMOCIONES - FASE 3)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID REFERENCES ads(id) ON DELETE SET NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupons_restaurant ON coupons(restaurant_id);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active coupons"
ON coupons FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public insert generated coupons"
ON coupons FOR INSERT
TO anon, authenticated
WITH CHECK (
    status = 'active'
    AND length(coupon_code) >= 6
);

CREATE POLICY "Superadmin full access to coupons"
ON coupons FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Members redeem their restaurant coupons"
ON coupons FOR UPDATE
TO authenticated
USING (
    restaurant_id IS NULL OR restaurant_id IN (
        SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
    )
)
WITH CHECK (
    status IN ('redeemed', 'active')
);

-- ------------------------------------------------------------------------------
-- 9. TABLA: MENU_ITEMS (CARTA DIGITAL DE COMANDAS - FASE PRODUCTO)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('entradas', 'principales', 'bebidas', 'postres')),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    preparation_time_mins INT NOT NULL DEFAULT 15,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read available menu items"
ON menu_items FOR SELECT
TO anon, authenticated
USING (is_available = true);

CREATE POLICY "Superadmin full access to menu_items"
ON menu_items FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Members manage their menu_items"
ON menu_items FOR ALL
TO authenticated
USING (restaurant_id IN (
    SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
))
WITH CHECK (restaurant_id IN (
    SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
));

-- ------------------------------------------------------------------------------
-- 10. TABLA: TABLE_ORDERS (COMANDAS DIGITALES A COCINA / KDS - FASE PRODUCTO)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS table_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    tag_code TEXT NOT NULL,
    table_number TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
    customer_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_table_orders_restaurant ON table_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_table_orders_status ON table_orders(status);

ALTER TABLE table_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert new orders"
ON table_orders FOR INSERT
TO anon, authenticated
WITH CHECK (
    status = 'pending'
    AND length(table_number) >= 1
    AND total_amount >= 0
);

CREATE POLICY "Public read orders by id"
ON table_orders FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Superadmin full access to table_orders"
ON table_orders FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Members view their restaurant orders"
ON table_orders FOR SELECT
TO authenticated
USING (restaurant_id IN (
    SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
));

CREATE POLICY "Members update their restaurant orders"
ON table_orders FOR UPDATE
TO authenticated
USING (restaurant_id IN (
    SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
))
WITH CHECK (restaurant_id IN (
    SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
));

-- ------------------------------------------------------------------------------
-- 11. TABLA: TABLE_CALLS (LLAMADAS A MESERO Y PEDIDOS DE CUENTA - FASE PRODUCTO)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS table_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    tag_code TEXT NOT NULL,
    table_number TEXT NOT NULL,
    call_type TEXT NOT NULL CHECK (call_type IN ('waiter', 'bill_cash', 'bill_card', 'help')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'attended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    attended_at TIMESTAMPTZ DEFAULT NULL,
    attended_by TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_table_calls_restaurant ON table_calls(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_table_calls_status ON table_calls(status);

ALTER TABLE table_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert table calls"
ON table_calls FOR INSERT
TO anon, authenticated
WITH CHECK (
    status = 'active'
    AND length(table_number) >= 1
);

CREATE POLICY "Superadmin full access to table_calls"
ON table_calls FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Members view and attend their table_calls"
ON table_calls FOR ALL
TO authenticated
USING (restaurant_id IN (
    SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
))
WITH CHECK (restaurant_id IN (
    SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
));

-- ------------------------------------------------------------------------------
-- 12. TABLA: RESTAURANT_STAFF (PERSONAL DE SALA Y COCINA CON PIN - FASE PRODUCTO)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('waiter', 'kitchen', 'manager')),
    pin_code TEXT NOT NULL CHECK (length(pin_code) >= 4),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_staff_res ON restaurant_staff(restaurant_id);

ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin full access to restaurant_staff"
ON restaurant_staff FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Members manage their restaurant_staff"
ON restaurant_staff FOR ALL
TO authenticated
USING (restaurant_id IN (
    SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
))
WITH CHECK (restaurant_id IN (
    SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
));

-- ------------------------------------------------------------------------------
-- RPC: VERIFICACIÓN SEGURA DE PIN PARA TERMINALES DE SALA Y COCINA (FASE PRODUCTO)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION verify_staff_pin(p_restaurant_id UUID, p_pin TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff restaurant_staff%ROWTYPE;
BEGIN
    SELECT * INTO v_staff
    FROM restaurant_staff
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

-- ------------------------------------------------------------------------------
-- 13. TABLA: PUSH_SUBSCRIPTIONS (DISPOSITIVOS Y TOKENS PUSH - FASE 4 NATIVA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_org ON push_subscriptions(organization_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin full access to push_subscriptions"
ON push_subscriptions FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

CREATE POLICY "Members manage their push_subscriptions"
ON push_subscriptions FOR ALL
TO authenticated
USING (organization_id IN (
    SELECT get_user_organization_ids()
))
WITH CHECK (organization_id IN (
    SELECT get_user_organization_ids()
));
