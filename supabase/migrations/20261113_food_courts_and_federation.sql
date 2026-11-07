-- ==============================================================================
-- MIGRACIÓN: FEDERACIÓN DE FOOD COURTS EN PLAZAS COMERCIALES Y TURNERO 4K
-- Soporta vinculación cross-organización, métricas de comedor y renta variable
-- ==============================================================================

-- 1. TABLA: FOOD_COURTS (PLAZAS COMERCIALES Y CORREDORES GASTRONÓMICOS)
CREATE TABLE IF NOT EXISTS food_courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    mall_name TEXT NOT NULL,
    logo_url TEXT,
    admin_email TEXT,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    turnero_config JSONB NOT NULL DEFAULT '{
      "enableVoiceTts": true,
      "enableBuzzerChime": true,
      "autoHideReadyMinutes": 3,
      "adRotationSeconds": 20,
      "primaryColor": "#10b981",
      "splitRatio": "70_30"
    }'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_courts_slug ON food_courts(slug);
CREATE INDEX IF NOT EXISTS idx_food_courts_admin ON food_courts(admin_user_id);

-- 2. TABLA: FOOD_COURT_BRANCHES (FEDERACIÓN CROSS-ORGANIZACIÓN)
-- Permite vincular sucursales de diferentes organizaciones independientes al Food Court
CREATE TABLE IF NOT EXISTS food_court_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_court_id UUID NOT NULL REFERENCES food_courts(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    commercial_space_number TEXT NOT NULL, -- Ej: "Local FC-04"
    pickup_counter_label TEXT NOT NULL DEFAULT 'Mostrador 1',
    tenant_brand_name TEXT,
    tenant_contact_email TEXT,
    tenant_contact_phone TEXT,
    invitation_token TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_activation', 'suspended')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(food_court_id, restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_fc_branches_fc ON food_court_branches(food_court_id);
CREATE INDEX IF NOT EXISTS idx_fc_branches_rest ON food_court_branches(restaurant_id);

-- 3. POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS)
ALTER TABLE food_courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_court_branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active food_courts" ON food_courts;
CREATE POLICY "Public read active food_courts"
ON food_courts FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Superadmin full access to food_courts" ON food_courts;
CREATE POLICY "Superadmin full access to food_courts"
ON food_courts FOR ALL
TO authenticated
USING (is_superadmin())
WITH CHECK (is_superadmin());

DROP POLICY IF EXISTS "Mall admin update their food_court" ON food_courts;
CREATE POLICY "Mall admin update their food_court"
ON food_courts FOR UPDATE
TO authenticated
USING (admin_user_id = auth.uid())
WITH CHECK (admin_user_id = auth.uid());

DROP POLICY IF EXISTS "Public read food_court_branches" ON food_court_branches;
CREATE POLICY "Public read food_court_branches"
ON food_court_branches FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Superadmin and Mall Admin manage food_court_branches" ON food_court_branches;
CREATE POLICY "Superadmin and Mall Admin manage food_court_branches"
ON food_court_branches FOR ALL
TO authenticated
USING (
    is_superadmin() OR food_court_id IN (
        SELECT id FROM food_courts WHERE admin_user_id = auth.uid()
    )
)
WITH CHECK (
    is_superadmin() OR food_court_id IN (
        SELECT id FROM food_courts WHERE admin_user_id = auth.uid()
    )
);

-- 4. FUNCIÓN RPC DE AUDITORÍA SUPERFICIAL Y RENTA VARIABLE DE COMEDOR
-- Otorga a la plaza afluencia, SLA de cocina, ticket promedio y facturación bruta estimada
-- sin exponer costos, nómina ni buzón de quejas privadas de las organizaciones locatarias
CREATE OR REPLACE FUNCTION get_food_court_metrics(p_food_court_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'branch_link_id', fcb.id,
            'restaurant_id', fcb.restaurant_id,
            'commercial_space_number', fcb.commercial_space_number,
            'pickup_counter_label', fcb.pickup_counter_label,
            'brand_name', COALESCE(r.brand_name, r.name, fcb.tenant_brand_name),
            'organization_id', r.organization_id,
            'status', fcb.status,
            'orders_count', COALESCE(ord_stats.orders_count, 0),
            'average_ticket', COALESCE(ord_stats.avg_ticket, 0),
            'gross_revenue_estimated', COALESCE(ord_stats.gross_sales, 0)
        )
    ) INTO v_result
    FROM food_court_branches fcb
    LEFT JOIN restaurants r ON r.id = fcb.restaurant_id
    LEFT JOIN LATERAL (
        SELECT 
            COUNT(*)::INT AS orders_count,
            ROUND(AVG(total_amount), 2) AS avg_ticket,
            ROUND(SUM(total_amount), 2) AS gross_sales
        FROM table_orders o
        WHERE o.restaurant_id = fcb.restaurant_id
          AND o.status != 'cancelled'
    ) ord_stats ON true
    WHERE fcb.food_court_id = p_food_court_id;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 5. HABILITAR PUBLICACIÓN REALTIME PARA FOOD COURTS
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE food_courts;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE food_court_branches;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
  END;
END $$;

-- 6. INSERTAR GIRO OFICIAL "PLAZA COMERCIAL / FOOD COURT" EN BUSINESS_VERTICALS
INSERT INTO public.business_verticals (
  slug,
  name,
  unit_label,
  unit_plural,
  show_kds,
  show_floor_staff,
  show_hostess,
  catalog_title,
  catalog_subtitle,
  action_primary,
  action_secondary,
  feedback_question,
  available_features,
  available_stations
) VALUES (
  'food_court',
  'Plaza Comercial / Food Court',
  'Local Federado',
  'Locales Federados',
  false,
  false,
  false,
  'Directorio del Comedor & Turnero 4K',
  'Consulta locales gastronómicos y turnos de entrega en pantalla',
  'Ver Turnero 4K en Vivo',
  'Asistencia de la Plaza',
  '¿Cómo estuvo tu visita a nuestro comedor hoy?',
  '[
    {"id": "turnero_4k_plaza", "name": "Turnero 4K Multi-Locatario (70% Turnos / 30% Red Ads)", "description": "Pantalla gigante para área de comidas que concentra turnos de múltiples organizaciones con voz TTS."},
    {"id": "cross_org_federation", "name": "Federación de Sucursales de Otras Organizaciones", "description": "Capacidad de adherir sucursales gastronómicas de distintas empresas matrices bajo un mismo comedor."},
    {"id": "plaza_metrics", "name": "Analítica de Renta Variable & Tiempos de Entrega SLA", "description": "Auditoría ejecutiva de volumen de comandas, ventas y tiempos de despacho por locatario."}
  ]'::jsonb,
  '[
    {"id": "station-turnero-plaza", "name": "Pantalla Turnero 4K del Comedor (Split 70/30)", "roleName": "Pantalla Pública de Plaza", "description": "Visualización consolidada de órdenes en preparación y listas para recoger con pauta publicitaria."}
  ]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  unit_label = EXCLUDED.unit_label,
  unit_plural = EXCLUDED.unit_plural,
  available_features = EXCLUDED.available_features,
  available_stations = EXCLUDED.available_stations;
