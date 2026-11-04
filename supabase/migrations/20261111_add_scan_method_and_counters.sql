-- Migración 20261111: Método de Escaneo y Contadores Separados NFC vs QR
-- POL-008 / POL-009 / POL-010

-- 1. Añadir columna scan_method a public.tag_scans si no existe
ALTER TABLE public.tag_scans 
ADD COLUMN IF NOT EXISTS scan_method TEXT DEFAULT 'nfc' 
CHECK (scan_method IN ('nfc', 'qr'));

-- 2. Añadir columnas nfc_scans_count y qr_scans_count a public.tags si no existen
ALTER TABLE public.tags 
ADD COLUMN IF NOT EXISTS nfc_scans_count INT DEFAULT 0;

ALTER TABLE public.tags 
ADD COLUMN IF NOT EXISTS qr_scans_count INT DEFAULT 0;

-- 3. Poblar nfc_scans_count con scan_count para placas existentes si están en 0
UPDATE public.tags 
SET nfc_scans_count = COALESCE(scan_count, 0)
WHERE nfc_scans_count = 0 AND qr_scans_count = 0 AND COALESCE(scan_count, 0) > 0;

NOTIFY pgrst, 'reload schema';
