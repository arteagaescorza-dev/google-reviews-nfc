-- Migración: Agregar columnas de horarios operativos, horas diarias y saldo/bloqueos a restaurants
-- Corrige error: Could not find the 'closing_time' column of 'restaurants' in the schema cache

ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS opening_time TEXT,
ADD COLUMN IF NOT EXISTS closing_time TEXT,
ADD COLUMN IF NOT EXISTS operating_days TEXT,
ADD COLUMN IF NOT EXISTS daily_operating_hours TEXT,
ADD COLUMN IF NOT EXISTS blocked_ad_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_veto_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ad_credit_balance NUMERIC DEFAULT 0;

-- Recargar caché de esquema en PostgREST
NOTIFY pgrst, 'reload schema';
