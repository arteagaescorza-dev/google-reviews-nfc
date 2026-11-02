-- ==========================================
-- MIGRACIÓN FASE C: TABLA DE GERENTES POR ORGANIZACIÓN, TURNOS (60 DÍAS),
-- CUPONES DE RETENCIÓN CON LÍMITE MENSUAL Y MÉTRICAS DE CORTE PARA DUEÑO
-- Fecha: 2026-11-05
-- ==========================================

-- 1. Tabla de Gerentes por Organización (asignables por Dueño o Superadmin a cada sucursal)
CREATE TABLE IF NOT EXISTS public.organization_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  pin_code TEXT NOT NULL DEFAULT '9999',
  manager_role TEXT NOT NULL DEFAULT 'gerente_tienda' CHECK (manager_role IN ('gerente_tienda', 'capitan_piso')),
  assigned_branch_ids TEXT[] DEFAULT '{}',
  branch_roles JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organization_managers_org_id ON public.organization_managers(organization_id);

ALTER TABLE public.organization_managers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso operativo a gerentes de organizacion" ON public.organization_managers;
CREATE POLICY "Acceso operativo a gerentes de organizacion"
  ON public.organization_managers FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabla de Turnos de Personal (Programación hasta con 2 meses / 60 días de anticipación)
CREATE TABLE IF NOT EXISTS public.staff_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  staff_id TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  staff_role TEXT NOT NULL,
  shift_date DATE NOT NULL,
  shift_type TEXT NOT NULL DEFAULT 'matutino' CHECK (shift_type IN ('matutino', 'vespertino', 'nocturno_cierre', 'completo')),
  start_time TEXT NOT NULL DEFAULT '08:00',
  end_time TEXT NOT NULL DEFAULT '16:00',
  assigned_station TEXT DEFAULT 'all',
  assigned_tables TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by_manager TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_shifts_restaurant_date ON public.staff_shifts(restaurant_id, shift_date);

ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso operativo a turnos de personal" ON public.staff_shifts;
CREATE POLICY "Acceso operativo a turnos de personal"
  ON public.staff_shifts FOR ALL USING (true) WITH CHECK (true);

-- 3. Tabla de Cupones de Retención por Quejas creados por Gerentes con Límite Mensual
CREATE TABLE IF NOT EXISTS public.manager_retention_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  manager_name TEXT NOT NULL,
  coupon_code TEXT NOT NULL,
  title TEXT NOT NULL,
  discount_description TEXT NOT NULL,
  discount_percentage INT DEFAULT 0,
  monthly_limit INT NOT NULL DEFAULT 20 CHECK (monthly_limit >= 1 AND monthly_limit <= 1000),
  used_this_month INT NOT NULL DEFAULT 0 CHECK (used_this_month >= 0),
  month_key TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manager_retention_coupons_res ON public.manager_retention_coupons(restaurant_id);

ALTER TABLE public.manager_retention_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso operativo a cupones de gerente" ON public.manager_retention_coupons;
CREATE POLICY "Acceso operativo a cupones de gerente"
  ON public.manager_retention_coupons FOR ALL USING (true) WITH CHECK (true);

-- 4. Tabla de Reportes de Corte por Turno de Mesero y Métricas enviadas al Dueño
CREATE TABLE IF NOT EXISTS public.manager_shift_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
  branch_name TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  waiter_name TEXT NOT NULL,
  shift_type TEXT NOT NULL DEFAULT 'matutino',
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tables_served INT NOT NULL DEFAULT 0,
  total_sales NUMERIC(12,2) NOT NULL DEFAULT 0,
  cash_sales NUMERIC(12,2) NOT NULL DEFAULT 0,
  card_sales NUMERIC(12,2) NOT NULL DEFAULT 0,
  tips_collected NUMERIC(12,2) NOT NULL DEFAULT 0,
  discounts_authorized NUMERIC(12,2) NOT NULL DEFAULT 0,
  table_metrics JSONB DEFAULT '[]'::jsonb,
  employee_metrics JSONB DEFAULT '[]'::jsonb,
  sent_to_owner BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manager_shift_reports_res ON public.manager_shift_reports(restaurant_id);

ALTER TABLE public.manager_shift_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso operativo a reportes de turno" ON public.manager_shift_reports;
CREATE POLICY "Acceso operativo a reportes de turno"
  ON public.manager_shift_reports FOR ALL USING (true) WITH CHECK (true);

