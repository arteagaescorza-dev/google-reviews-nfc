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
    IF p_type = 'impression' THEN
        UPDATE ads SET impressions_count = impressions_count + 1 WHERE id = p_ad_id;
    ELSIF p_type = 'click' THEN
        UPDATE ads SET clicks_count = clicks_count + 1 WHERE id = p_ad_id;
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
      OR (raw_user_meta_data->>'role') = 'superadmin'
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

CREATE POLICY "Members can view their own membership"
ON organization_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

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

-- 6. Tag Scans: Admin full access
CREATE POLICY "Admin full access to tag_scans"
ON tag_scans FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

