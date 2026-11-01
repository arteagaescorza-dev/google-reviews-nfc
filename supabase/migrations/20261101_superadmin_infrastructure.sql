-- ==============================================================================
-- MIGRACIÓN FASE 6: INFRAESTRUCTURA BACKEND SUPERADMINISTRADOR
-- Hardware, Lotes de Imprenta, Pipeline Comercial B2B, Reposición de Tags & EBITDA
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLA: HARDWARE_INVENTORY (CONTROL DE INSUMOS FÍSICOS EN BODEGA)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hardware_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('nfc_chip', 'vinyl_sticker', 'acrylic_stand', 'installation_tool', 'packaging')),
    stock_available INT NOT NULL DEFAULT 0 CHECK (stock_available >= 0),
    stock_allocated INT NOT NULL DEFAULT 0 CHECK (stock_allocated >= 0),
    stock_min_threshold INT NOT NULL DEFAULT 50,
    unit_cost_mxn NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    supplier_info JSONB DEFAULT '{}'::jsonb,
    last_restocked_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_hardware_inventory_category ON public.hardware_inventory(category);
CREATE INDEX IF NOT EXISTS idx_hardware_inventory_sku ON public.hardware_inventory(sku);

-- ------------------------------------------------------------------------------
-- 2. TABLA: PRINT_BATCHES (LOTES DE IMPRENTA PARA VINIL Y SUAJADO)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.print_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number TEXT UNIQUE NOT NULL, -- ej. 'LOT-2026-001'
    supplier_name TEXT NOT NULL DEFAULT 'Imprenta Central',
    total_units INT NOT NULL CHECK (total_units > 0),
    prefix TEXT NOT NULL DEFAULT 'TAG-',
    range_start INT NOT NULL CHECK (range_start >= 1),
    range_end INT NOT NULL CHECK (range_end >= range_start),
    status TEXT NOT NULL DEFAULT 'generado' CHECK (status IN ('generado', 'en_imprenta', 'recibido_en_bodega', 'en_uso', 'agotado')),
    cost_total_mxn NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    specifications JSONB DEFAULT '{"tamano": "6x6cm", "material": "vinil_adhesivo_3m", "laminado": "mate_uv", "corte": "redondo"}'::jsonb,
    pdf_vector_url TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    received_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_print_batches_status ON public.print_batches(status);
CREATE INDEX IF NOT EXISTS idx_print_batches_number ON public.print_batches(batch_number);

-- ------------------------------------------------------------------------------
-- 3. EXTENSIÓN DE LA TABLA TAGS (TRAZABILIDAD DE HARDWARE Y REPOSICIONES)
-- ------------------------------------------------------------------------------
ALTER TABLE public.tags 
ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.print_batches(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS nfc_chip_model TEXT DEFAULT 'NTAG213',
ADD COLUMN IF NOT EXISTS physical_condition TEXT NOT NULL DEFAULT 'nuevo' CHECK (physical_condition IN ('nuevo', 'instalado', 'desgastado', 'danado', 'reemplazado')),
ADD COLUMN IF NOT EXISTS installer_name TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS installed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS replaced_by_tag_code TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS replacement_reason TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_tags_physical_condition ON public.tags(physical_condition);
CREATE INDEX IF NOT EXISTS idx_tags_batch_id ON public.tags(batch_id);

-- ------------------------------------------------------------------------------
-- 4. TABLA: SALES_LEADS (PIPELINE COMERCIAL B2B PARA EQUIPO DE VENTAS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sales_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_name TEXT NOT NULL,
    business_type TEXT NOT NULL DEFAULT 'restaurant',
    contact_name TEXT NOT NULL,
    contact_role TEXT DEFAULT 'Dueño / Gerente General',
    phone TEXT NOT NULL,
    email TEXT DEFAULT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'CDMX',
    estimated_tables INT NOT NULL DEFAULT 10,
    stage TEXT NOT NULL DEFAULT 'prospeccion' CHECK (stage IN (
        'prospeccion', 
        'demo_agendada', 
        'demo_realizada', 
        'cotizacion_enviada', 
        'cierre_ganado', 
        'instalacion_pendiente', 
        'instalado_activo', 
        'cerrado_perdido'
    )),
    deal_mrr_mxn NUMERIC(10,2) NOT NULL DEFAULT 299.00,
    hardware_kit_fee_mxn NUMERIC(10,2) NOT NULL DEFAULT 1200.00,
    assigned_sales_rep TEXT NOT NULL DEFAULT 'Dirección',
    next_follow_up TIMESTAMPTZ DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    lost_reason TEXT DEFAULT NULL,
    converted_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    converted_restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_leads_stage ON public.sales_leads(stage);
CREATE INDEX IF NOT EXISTS idx_sales_leads_city ON public.sales_leads(city);
CREATE INDEX IF NOT EXISTS idx_sales_leads_rep ON public.sales_leads(assigned_sales_rep);

-- ------------------------------------------------------------------------------
-- 5. TABLA: TERRITORY_ZONES (COBERTURA TERRITORIAL & LOGÍSTICA DE INSTALACIÓN)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.territory_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- ej. 'CDMX-POLANCO'
    name TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'CDMX',
    center_lat NUMERIC(10,6) NOT NULL,
    center_lng NUMERIC(10,6) NOT NULL,
    coverage_radius_km NUMERIC(5,2) NOT NULL DEFAULT 3.5,
    target_restaurants INT NOT NULL DEFAULT 50,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 6. EXTENSIÓN DE SUPPORT_TICKETS PARA REPOSICIÓN DIRECTA DE PLACAS
-- ------------------------------------------------------------------------------
ALTER TABLE public.support_tickets
ADD COLUMN IF NOT EXISTS affected_tag_code TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS replacement_status TEXT DEFAULT 'no_aplica' CHECK (replacement_status IN ('no_aplica', 'solicitado', 'aprobado', 'en_reparto', 'instalado')),
ADD COLUMN IF NOT EXISTS replacement_tag_code TEXT DEFAULT NULL;

-- ------------------------------------------------------------------------------
-- 7. RPC ATÓMICAS PARA INSTALACIÓN EN CAMPO Y REPOSICIONES
-- ------------------------------------------------------------------------------

-- RPC: Activador Express In-Situ de Tags en Mesa
CREATE OR REPLACE FUNCTION activate_table_tag_in_situ(
    p_tag_code TEXT,
    p_restaurant_id UUID,
    p_table_identifier TEXT,
    p_installer_name TEXT DEFAULT 'Técnico de Campo'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tag_id UUID;
BEGIN
    -- 1. Insertar o actualizar el tag físico
    INSERT INTO public.tags (
        tag_code, 
        restaurant_id, 
        table_identifier, 
        physical_condition, 
        installer_name, 
        installed_at, 
        is_active
    )
    VALUES (
        p_tag_code, 
        p_restaurant_id, 
        p_table_identifier, 
        'instalado', 
        p_installer_name, 
        now(), 
        true
    )
    ON CONFLICT (tag_code) DO UPDATE
    SET 
        restaurant_id = p_restaurant_id,
        table_identifier = p_table_identifier,
        physical_condition = 'instalado',
        installer_name = p_installer_name,
        installed_at = now(),
        is_active = true
    RETURNING id INTO v_tag_id;

    -- 2. Descontar 1 chip NFC y 1 vinil del inventario si hay stock registrado
    UPDATE public.hardware_inventory
    SET stock_available = GREATEST(0, stock_available - 1),
        stock_allocated = stock_allocated + 1,
        updated_at = now()
    WHERE category IN ('nfc_chip', 'vinyl_sticker');

    RETURN jsonb_build_object(
        'success', true,
        'tag_id', v_tag_id,
        'tag_code', p_tag_code,
        'restaurant_id', p_restaurant_id,
        'table_identifier', p_table_identifier,
        'message', 'Tag activado en mesa con éxito e inventario descontado.'
    );
END;
$$;

-- RPC: Sustitución de Tag Desgastado o Dañado
CREATE OR REPLACE FUNCTION replace_damaged_table_tag(
    p_old_tag_code TEXT,
    p_new_tag_code TEXT,
    p_installer_name TEXT DEFAULT 'Técnico de Campo',
    p_reason TEXT DEFAULT 'Desgaste por uso / desengrasante',
    p_ticket_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_restaurant_id UUID;
    v_table_identifier TEXT;
BEGIN
    -- 1. Obtener datos del tag antiguo
    SELECT restaurant_id, table_identifier
    INTO v_restaurant_id, v_table_identifier
    FROM public.tags
    WHERE tag_code = p_old_tag_code;

    IF v_restaurant_id IS NULL THEN
        RAISE EXCEPTION 'El tag antiguo % no existe en la base de datos.', p_old_tag_code;
    END IF;

    -- 2. Marcar el tag antiguo como reemplazado y desactivarlo
    UPDATE public.tags
    SET physical_condition = 'reemplazado',
        is_active = false,
        replaced_by_tag_code = p_new_tag_code,
        replacement_reason = p_reason
    WHERE tag_code = p_old_tag_code;

    -- 3. Activar el nuevo tag en la misma mesa
    INSERT INTO public.tags (
        tag_code, 
        restaurant_id, 
        table_identifier, 
        physical_condition, 
        installer_name, 
        installed_at, 
        is_active
    )
    VALUES (
        p_new_tag_code, 
        v_restaurant_id, 
        v_table_identifier, 
        'instalado', 
        p_installer_name, 
        now(), 
        true
    )
    ON CONFLICT (tag_code) DO UPDATE
    SET 
        restaurant_id = v_restaurant_id,
        table_identifier = v_table_identifier,
        physical_condition = 'instalado',
        installer_name = p_installer_name,
        installed_at = now(),
        is_active = true;

    -- 4. Si hay un ticket de soporte asociado, marcar la reposición como completada
    IF p_ticket_id IS NOT NULL THEN
        UPDATE public.support_tickets
        SET replacement_status = 'instalado',
            replacement_tag_code = p_new_tag_code,
            status = 'resolved',
            updated_at = now()
        WHERE id = p_ticket_id;
    END IF;

    -- 5. Descontar 1 vinil de reemplazo del inventario
    UPDATE public.hardware_inventory
    SET stock_available = GREATEST(0, stock_available - 1),
        stock_allocated = stock_allocated + 1,
        updated_at = now()
    WHERE category = 'vinyl_sticker';

    RETURN jsonb_build_object(
        'success', true,
        'old_tag_code', p_old_tag_code,
        'new_tag_code', p_new_tag_code,
        'restaurant_id', v_restaurant_id,
        'table_identifier', v_table_identifier,
        'message', 'Reemplazo completado con trazabilidad y stock actualizado.'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. POLÍTICAS DE SEGURIDAD (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.hardware_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territory_zones ENABLE ROW LEVEL SECURITY;

-- Superadmin acceso total
CREATE POLICY "Superadmin acceso total hardware_inventory"
ON public.hardware_inventory FOR ALL TO authenticated
USING (is_superadmin()) WITH CHECK (is_superadmin());

CREATE POLICY "Superadmin acceso total print_batches"
ON public.print_batches FOR ALL TO authenticated
USING (is_superadmin()) WITH CHECK (is_superadmin());

CREATE POLICY "Superadmin acceso total sales_leads"
ON public.sales_leads FOR ALL TO authenticated
USING (is_superadmin()) WITH CHECK (is_superadmin());

CREATE POLICY "Superadmin acceso total territory_zones"
ON public.territory_zones FOR ALL TO authenticated
USING (is_superadmin()) WITH CHECK (is_superadmin());

-- Lectura pública para zonas territoriales activas
CREATE POLICY "Public read active territory_zones"
ON public.territory_zones FOR SELECT TO anon, authenticated
USING (is_active = true);
