-- ==========================================
-- MIGRACIÓN FASE 5: MONETIZACIÓN AUTÓNOMA, WEBHOOKS CRM & WIN-BACK
-- ==========================================

-- 1. Campos de Suscripción Stripe en organizations (DT-04)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz,
ADD COLUMN IF NOT EXISTS webhook_url text,
ADD COLUMN IF NOT EXISTS webhook_secret text;

-- 2. Tabla de Bitácora de Webhooks Salientes a CRMs (DT-08)
CREATE TABLE IF NOT EXISTS public.crm_webhook_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    ad_id uuid REFERENCES public.ads(id) ON DELETE SET NULL,
    target_url text NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    status_code integer,
    response_body text,
    attempts integer DEFAULT 1,
    is_success boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en crm_webhook_logs
ALTER TABLE public.crm_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los miembros de la org pueden ver sus logs de webhooks"
ON public.crm_webhook_logs
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

-- 3. Tabla de Pipeline de Recaptura Win-Back (DT-07)
CREATE TABLE IF NOT EXISTS public.winback_campaign_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    restaurant_name text NOT NULL,
    owner_email text NOT NULL,
    step text NOT NULL, -- 'day_3' o 'day_14'
    status text DEFAULT 'scheduled' NOT NULL, -- 'scheduled', 'sent', 'opened', 'reactivated'
    scheduled_for timestamptz NOT NULL,
    sent_at timestamptz,
    created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en winback_campaign_logs
ALTER TABLE public.winback_campaign_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo administradores pueden gestionar winback logs"
ON public.winback_campaign_logs
FOR ALL
USING (
    EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = auth.uid() AND role = 'admin')
);

