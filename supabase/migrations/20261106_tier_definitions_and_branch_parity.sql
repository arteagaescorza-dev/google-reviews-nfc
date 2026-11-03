-- ==========================================
-- MIGRACIÓN FASE D: TABLA DE DEFINICIONES DE TIERS Y PARIDAD DE SUCURSAL
-- Fecha: 2026-11-06
-- ==========================================

CREATE TABLE IF NOT EXISTS public.tier_definitions (
  tier INT PRIMARY KEY,
  name TEXT NOT NULL,
  badge_label TEXT NOT NULL,
  price_mxn NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  included_features TEXT[] DEFAULT '{}',
  included_stations TEXT[] DEFAULT '{}',
  client_visible_features TEXT[] DEFAULT '{}',
  client_visible_stations TEXT[] DEFAULT '{}',
  allowed_categories INT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tier_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso operativo a tier_definitions" ON public.tier_definitions;
CREATE POLICY "Acceso operativo a tier_definitions"
  ON public.tier_definitions FOR ALL USING (true) WITH CHECK (true);

-- Agregar columnas faltantes a restaurants y organizations si no existen
ALTER TABLE public.restaurants 
  ADD COLUMN IF NOT EXISTS has_digital_menu BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS trial_tier INT,
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_days INT;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS trial_tier INT,
  ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_days INT;

INSERT INTO public.tier_definitions (tier, name, badge_label, price_mxn, description, included_features, included_stations, client_visible_features, client_visible_stations, allowed_categories)
VALUES
  (1, 'Tier 1: Enlace Directo (Etapa 1 - Siembra)', 'Tier 1', 100, 'Redirección instantánea a Google Reviews con semillero viral de placas.',
   ARRAY['feat_redirect', 'feat_viral_seeds'],
   ARRAY[]::text[],
   ARRAY['feat_redirect', 'feat_viral_seeds'],
   ARRAY[]::text[],
   ARRAY[1, 2]),
  (2, 'Tier 2: Filtro de Reputación (Cliente Fundador)', 'Tier 2', 399, 'Calificaciones de 4-5 estrellas van a Google; 1-3 a buzón privado con cupones de gerente y menú digital.',
   ARRAY['feat_redirect', 'feat_viral_seeds', 'feat_reputation_shield', 'feat_complaints_inbox', 'feat_manager_coupons', 'feat_digital_menu'],
   ARRAY['station_manager'],
   ARRAY['feat_redirect', 'feat_viral_seeds', 'feat_reputation_shield', 'feat_complaints_inbox', 'feat_manager_coupons', 'feat_digital_menu'],
   ARRAY['station_manager'],
   ARRAY[1, 2, 3, 5, 6]),
  (3, 'Tier 3: Menú Digital, Linktree & KDS Operativo', 'Tier 3', 899, 'Menú digital con carrito a cocina, Linktree, Wi-Fi 1-toque, estaciones KDS y terminales de sala.',
   ARRAY['feat_redirect', 'feat_viral_seeds', 'feat_reputation_shield', 'feat_complaints_inbox', 'feat_manager_coupons', 'feat_digital_menu', 'feat_linktree', 'feat_wifi'],
   ARRAY['station_manager', 'station_hostess', 'station_waiter', 'station_kds_general', 'station_kds_cocina', 'station_kds_barra', 'station_kds_postres', 'station_pickup'],
   ARRAY['feat_redirect', 'feat_viral_seeds', 'feat_reputation_shield', 'feat_complaints_inbox', 'feat_manager_coupons', 'feat_digital_menu', 'feat_linktree', 'feat_wifi'],
   ARRAY['station_manager', 'station_hostess', 'station_waiter', 'station_kds_general', 'station_kds_cocina', 'station_kds_barra', 'station_kds_postres', 'station_pickup'],
   ARRAY[1, 2, 3, 4, 5, 6]),
  (4, 'Tier 4: Red Publicitaria, Turnero 4K & Analítica', 'Tier 4', 1499, 'Bolsa publicitaria local ($500 MXN), mapa de calor por mesa, turnero público 4K y suite completa.',
   ARRAY['feat_redirect', 'feat_viral_seeds', 'feat_reputation_shield', 'feat_complaints_inbox', 'feat_manager_coupons', 'feat_digital_menu', 'feat_linktree', 'feat_wifi', 'feat_ad_network', 'feat_analytics_heatmaps'],
   ARRAY['station_manager', 'station_hostess', 'station_waiter', 'station_kds_general', 'station_kds_cocina', 'station_kds_barra', 'station_kds_postres', 'station_turnero', 'station_pickup'],
   ARRAY['feat_redirect', 'feat_viral_seeds', 'feat_reputation_shield', 'feat_complaints_inbox', 'feat_manager_coupons', 'feat_digital_menu', 'feat_linktree', 'feat_wifi', 'feat_ad_network', 'feat_analytics_heatmaps'],
   ARRAY['station_manager', 'station_hostess', 'station_waiter', 'station_kds_general', 'station_kds_cocina', 'station_kds_barra', 'station_kds_postres', 'station_turnero', 'station_pickup'],
   ARRAY[1, 2, 3, 4, 5, 6])
ON CONFLICT (tier) DO UPDATE SET
  name = EXCLUDED.name,
  badge_label = EXCLUDED.badge_label,
  price_mxn = EXCLUDED.price_mxn,
  description = EXCLUDED.description,
  included_features = EXCLUDED.included_features,
  included_stations = EXCLUDED.included_stations,
  client_visible_features = EXCLUDED.client_visible_features,
  client_visible_stations = EXCLUDED.client_visible_stations,
  allowed_categories = EXCLUDED.allowed_categories,
  updated_at = now();

