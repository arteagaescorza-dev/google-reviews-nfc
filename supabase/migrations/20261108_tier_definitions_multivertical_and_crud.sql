-- ==============================================================================
-- Migracion: 20261108_tier_definitions_multivertical_and_crud.sql
-- Descripcion: Soporte multivertical, archivado, CRUD y restauracion de Tier 5
-- Politicas: POL-008, POL-010
-- ==============================================================================

-- 1. Asegurar columna id UUID como llave primaria
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tier_definitions' AND column_name = 'id'
  ) THEN
    ALTER TABLE public.tier_definitions ADD COLUMN id UUID DEFAULT gen_random_uuid();
    UPDATE public.tier_definitions SET id = gen_random_uuid() WHERE id IS NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tier_definitions_pkey' AND conrelid = 'public.tier_definitions'::regclass
  ) THEN
    ALTER TABLE public.tier_definitions DROP CONSTRAINT tier_definitions_pkey;
  END IF;
  
  ALTER TABLE public.tier_definitions ALTER COLUMN id SET NOT NULL;
  ALTER TABLE public.tier_definitions ADD CONSTRAINT tier_definitions_pkey PRIMARY KEY (id);
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Aviso en ajuste de llave primaria: %', SQLERRM;
END $$;

-- 2. Columnas de multiverticalidad, archivado y visibilidad
ALTER TABLE public.tier_definitions 
  ADD COLUMN IF NOT EXISTS vertical_slug TEXT NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS vertical_id UUID REFERENCES public.business_verticals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS client_visible_categories INT[] DEFAULT '{}';

-- 3. Asignar giro a tiers iniciales
UPDATE public.tier_definitions 
SET vertical_slug = 'restaurant'
WHERE tier IN (1, 2, 3, 4) AND (vertical_slug = 'all' OR vertical_slug IS NULL);

UPDATE public.tier_definitions td
SET vertical_id = bv.id
FROM public.business_verticals bv
WHERE td.vertical_slug = bv.slug;

-- 4. Insercion o sincronizacion de Tier 5 (Escudo Marca Blanca / Ad-Free)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.tier_definitions WHERE tier = 5
  ) THEN
    INSERT INTO public.tier_definitions (
      id,
      tier,
      name,
      badge_label,
      price_mxn,
      description,
      vertical_slug,
      is_archived,
      included_features,
      included_stations,
      client_visible_features,
      client_visible_stations,
      allowed_categories,
      client_visible_categories
    ) VALUES (
      gen_random_uuid(),
      5,
      'Tier 5: Escudo Marca Blanca (Ad-Free • 0% Anuncios)',
      'Tier 5',
      299,
      'Bloquea toda publicidad de terceros en las pantallas de las mesas de la sucursal.',
      'all',
      false,
      ARRAY['feat_ad_free'],
      ARRAY[]::text[],
      ARRAY['feat_ad_free'],
      ARRAY[]::text[],
      ARRAY[1, 2],
      ARRAY[1, 2]
    );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

