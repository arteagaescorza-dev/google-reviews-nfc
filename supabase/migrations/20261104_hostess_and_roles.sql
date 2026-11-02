-- ==========================================
-- MIGRACIÓN: ROLES DE HOSTESS & BARISTA, ESTACIONES KDS Y GESTIÓN DE MESAS POR SUCURSAL
-- Fecha: 2026-11-04
-- ==========================================

-- Asegurar existencia de table_calls y restaurant_staff en caso de no existir en el entorno remoto
CREATE TABLE IF NOT EXISTS public.table_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  tag_code TEXT NOT NULL,
  table_number TEXT NOT NULL,
  call_type TEXT NOT NULL DEFAULT 'waiter',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'attended')),
  attended_at TIMESTAMPTZ,
  attended_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.restaurant_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'waiter',
  pin_code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  assigned_tables TEXT[] DEFAULT '{}',
  zone_name TEXT,
  allowed_stations TEXT[] DEFAULT ARRAY['all']::TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1. Ampliar constraint de call_type en table_calls para permitir solicitud de limpieza ('cleaning') de Hostess a Mesero
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.table_calls'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%call_type%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.table_calls DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

ALTER TABLE public.table_calls
  ADD CONSTRAINT table_calls_call_type_check
  CHECK (call_type IN ('waiter', 'bill_cash', 'bill_card', 'help', 'cleaning'));

ALTER TABLE public.table_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica de llamados de mesa para terminales PIN" ON public.table_calls;
CREATE POLICY "Lectura publica de llamados de mesa para terminales PIN"
  ON public.table_calls FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insercion publica de llamados de mesa" ON public.table_calls;
CREATE POLICY "Insercion publica de llamados de mesa"
  ON public.table_calls FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Actualizacion publica de llamados de mesa para terminales PIN" ON public.table_calls;
CREATE POLICY "Actualizacion publica de llamados de mesa para terminales PIN"
  ON public.table_calls FOR UPDATE USING (true);

-- 2. Ampliar constraint de role en restaurant_staff para soportar 'hostess' y 'barista', y añadir allowed_stations
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.restaurant_staff'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  ) LOOP
    EXECUTE 'ALTER TABLE public.restaurant_staff DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

ALTER TABLE public.restaurant_staff
  ADD CONSTRAINT restaurant_staff_role_check
  CHECK (role IN ('waiter', 'kitchen', 'barista', 'hostess', 'manager'));

ALTER TABLE public.restaurant_staff
  ADD COLUMN IF NOT EXISTS allowed_stations TEXT[] DEFAULT ARRAY['all']::TEXT[];

ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica de staff para terminales PIN" ON public.restaurant_staff;
CREATE POLICY "Lectura publica de staff para terminales PIN"
  ON public.restaurant_staff FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gestion de staff para terminales" ON public.restaurant_staff;
CREATE POLICY "Gestion de staff para terminales"
  ON public.restaurant_staff FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabla de Mesas por Sucursal (Gestionada por Hostess, Capitán de Piso y Gerente)
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  table_number TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 4 CHECK (capacity >= 1 AND capacity <= 50),
  current_guests INT NOT NULL DEFAULT 0 CHECK (current_guests >= 0),
  status TEXT NOT NULL DEFAULT 'libre' CHECK (status IN ('libre', 'ocupada', 'en_limpieza', 'desactivada')),
  assigned_waiter_name TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_tables_restaurant_id ON public.restaurant_tables(restaurant_id);

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso operativo de lectura a mesas de sucursal" ON public.restaurant_tables;
CREATE POLICY "Acceso operativo de lectura a mesas de sucursal"
  ON public.restaurant_tables FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acceso operativo de insercion a mesas de sucursal" ON public.restaurant_tables;
CREATE POLICY "Acceso operativo de insercion a mesas de sucursal"
  ON public.restaurant_tables FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso operativo de actualizacion a mesas de sucursal" ON public.restaurant_tables;
CREATE POLICY "Acceso operativo de actualizacion a mesas de sucursal"
  ON public.restaurant_tables FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Acceso operativo de eliminacion a mesas de sucursal" ON public.restaurant_tables;
CREATE POLICY "Acceso operativo de eliminacion a mesas de sucursal"
  ON public.restaurant_tables FOR DELETE USING (true);
