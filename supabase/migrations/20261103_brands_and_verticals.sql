-- ==========================================
-- MIGRACIÓN: CATÁLOGO UNIVERSAL DE GIROS Y TABLA DE MARCAS POR ORGANIZACIÓN
-- Fecha: 2026-11-03
-- ==========================================

-- 1. Tabla Universal de Giros Comerciales (business_verticals)
CREATE TABLE IF NOT EXISTS public.business_verticals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  unit_label TEXT NOT NULL DEFAULT 'Mesa',
  unit_plural TEXT NOT NULL DEFAULT 'Mesas',
  show_kds BOOLEAN NOT NULL DEFAULT false,
  show_floor_staff BOOLEAN NOT NULL DEFAULT false,
  show_hostess BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_verticals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'business_verticals' AND policyname = 'Lectura publica de giros universales'
  ) THEN
    CREATE POLICY "Lectura publica de giros universales"
      ON public.business_verticals FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'business_verticals' AND policyname = 'Escritura de giros universales'
  ) THEN
    CREATE POLICY "Escritura de giros universales"
      ON public.business_verticals FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Semilla inicial de giros universales
INSERT INTO public.business_verticals (slug, name, unit_label, unit_plural, show_kds, show_floor_staff, show_hostess)
VALUES
  ('restaurant', 'Restaurante / Gastronomía', 'Mesa', 'Mesas', true, true, true),
  ('barberia', 'Barbería / Salón de Belleza', 'Sillón / Estación', 'Sillones & Estaciones', false, false, false),
  ('dental', 'Consultorio Dental / Médico', 'Gabinete / Consultorio', 'Consultorios', false, false, false),
  ('gym', 'Gimnasio / Fitness & Box', 'Máquina / Zona', 'Equipos & Zonas', false, false, false),
  ('spa', 'Spa & Bienestar', 'Cabina / Sillón', 'Cabinas', false, false, false),
  ('cafeteria', 'Cafetería & Repostería', 'Mesa / Barra', 'Mesas & Barra', true, true, false),
  ('general', 'Comercio General / Retail', 'Punto de Atención', 'Puntos de Atención', false, false, false)
ON CONFLICT (slug) DO NOTHING;

-- 2. Tabla de Marcas por Organización (organization_brands)
CREATE TABLE IF NOT EXISTS public.organization_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  vertical_id UUID REFERENCES public.business_verticals(id) ON DELETE SET NULL,
  vertical_slug TEXT NOT NULL DEFAULT 'restaurant',
  logo_url TEXT,
  brand_color TEXT NOT NULL DEFAULT '#2563eb',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organization_brands_org_id ON public.organization_brands(organization_id);

ALTER TABLE public.organization_brands ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organization_brands' AND policyname = 'Lectura publica de marcas'
  ) THEN
    CREATE POLICY "Lectura publica de marcas"
      ON public.organization_brands FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organization_brands' AND policyname = 'Gestion de marcas por organizacion'
  ) THEN
    CREATE POLICY "Gestion de marcas por organizacion"
      ON public.organization_brands FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 3. Vincular Sucursales (restaurants) a Marcas (brand_id) y Giro (business_type)
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS business_type TEXT NOT NULL DEFAULT 'restaurant',
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.organization_brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_restaurants_brand_id ON public.restaurants(brand_id);

-- 4. Migrar automáticamente marcas existentes en public.restaurants hacia public.organization_brands
DO $$
DECLARE
  rec RECORD;
  v_brand_id UUID;
  v_vertical_id UUID;
BEGIN
  FOR rec IN
    SELECT DISTINCT organization_id, brand_name, COALESCE(business_type, 'restaurant') AS btype, logo_url, COALESCE(brand_color, '#2563eb') AS bcolor
    FROM public.restaurants
    WHERE organization_id IS NOT NULL AND brand_name IS NOT NULL
  LOOP
    SELECT id INTO v_brand_id
    FROM public.organization_brands
    WHERE organization_id = rec.organization_id AND lower(name) = lower(rec.brand_name)
    LIMIT 1;

    IF v_brand_id IS NULL THEN
      SELECT id INTO v_vertical_id FROM public.business_verticals WHERE slug = rec.btype LIMIT 1;

      INSERT INTO public.organization_brands (organization_id, name, vertical_id, vertical_slug, logo_url, brand_color)
      VALUES (rec.organization_id, rec.brand_name, v_vertical_id, rec.btype, rec.logo_url, rec.bcolor)
      RETURNING id INTO v_brand_id;
    END IF;

    UPDATE public.restaurants
    SET brand_id = v_brand_id
    WHERE organization_id = rec.organization_id
      AND lower(brand_name) = lower(rec.brand_name)
      AND brand_id IS NULL;
  END LOOP;
END $$;
