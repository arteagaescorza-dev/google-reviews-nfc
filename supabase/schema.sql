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
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'contacted')),
    notified_to_owner BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- ------------------------------------------------------------------------------
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_scans ENABLE ROW LEVEL SECURITY;

-- 1. Organizations: Lectura y gestión solo para admins autenticados
CREATE POLICY "Admin full access to organizations"
ON organizations FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Restaurants: Lectura pública si is_active = true, escritura solo admin
CREATE POLICY "Public read active restaurants"
ON restaurants FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admin full access to restaurants"
ON restaurants FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Tags: Lectura pública de tags activos, escritura solo admin
CREATE POLICY "Public read active tags"
ON tags FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admin full access to tags"
ON tags FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Ads: Lectura pública de anuncios activos, escritura solo admin
CREATE POLICY "Public read active ads"
ON ads FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admin full access to ads"
ON ads FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Feedback: Inserción pública validada para evitar Mass Assignment y DoS
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

CREATE POLICY "Admin full access to feedback"
ON feedback FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. Tag Scans: Admin full access
CREATE POLICY "Admin full access to tag_scans"
ON tag_scans FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

