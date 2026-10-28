# Reporte de Auditoría de Seguridad API: OWASP API Security Top 10 (2023)

**Proyecto:** Plataforma NFC Google Reseñas & Red Publicitaria Local  
**Fecha de Evaluación:** 28 de Octubre, 2026  
**Estándar de Evaluación:** OWASP API Security Top 10 (2023)  
**Alcance:** Esquema de Base de Datos Supabase (`supabase/schema.sql`), Funciones RPC, Políticas RLS y Capa API de Cliente (`src/lib/api.ts`, `src/lib/supabase.ts`, controladores y componentes).  

---

## 1. Resumen Ejecutivo de Postura de Seguridad

| Severidad | Vulnerabilidades Encontradas |
|---|---|
| 🔴 **ALTA** | 2 |
| 🟡 **MEDIA** | 2 |
| 🟢 **BAJA / INFORMATIVA** | 2 |

### Evaluación General
La arquitectura estática para GitHub Pages delegando la capa de persistencia en Supabase es sólida y minimiza la superficie de ataque al no mantener servidores Node.js expuestos. No obstante, al utilizar la clave pública `anon` directamente desde el navegador de comensales anónimos, la seguridad de los datos depende **al 100% de las políticas Row Level Security (RLS) y la definición de funciones PostgreSQL**. 

Se identificaron vectores de riesgo relacionados con **exposición excesiva de datos de contacto (API3)**, **falta de límites de inserción masiva en quejas (API4)** y **riesgos de autorización BOLA futuros en entornos multi-inquilino (API1)**.

---

## 2. Matriz de Cobertura OWASP API Security Top 10 (2023)

| Categoría OWASP | Estado en el Proyecto | Nivel de Riesgo |
|---|---|---|
| **API1:2023 Broken Object Level Authorization (BOLA/IDOR)** | ⚠️ Parcialmente Protegido (Admin único actual; vulnerable si se agregan logins para dueños de restaurantes sin aislar por `org_id`). | 🟡 MEDIO |
| **API2:2023 Broken Authentication** | ✅ Protegido (Supabase Auth gestiona tokens JWT de sesión). | 🟢 BAJO |
| **API3:2023 Broken Object Property Level Authorization** | ❌ Vulnerable (Exposición pública de `manager_phone` en tabla `restaurants` y asignación masiva en `feedback`). | 🔴 ALTO |
| **API4:2023 Unrestricted Resource Consumption** | ❌ Vulnerable (Ausencia de rate limiting / captcha en `feedback` y en la función `record_tag_scan`). | 🔴 ALTO |
| **API5:2023 Broken Function Level Authorization (BFLA)** | ✅ Protegido (Operaciones administrativas exigen `authenticated`). | 🟢 BAJO |
| **API6:2023 Unrestricted Access to Sensitive Business Flows** | ⚠️ Parcialmente Protegido (Manipulación artificial de métricas de clics/impresiones en anuncios). | 🟡 MEDIO |
| **API7:2023 Server Side Request Forgery (SSRF)** | ✅ No Aplica (No hay backend procesando URLs arbitrarias). | 🟢 N/A |
| **API8:2023 Security Misconfiguration** | ✅ Protegido (RLS activado en todas las tablas). | 🟢 BAJO |
| **API9:2023 Improper Inventory Management** | ✅ Protegido (Esquema SQL versionado). | 🟢 BAJO |
| **API10:2023 Unsafe Consumption of APIs** | ✅ Protegido (Solo se interactúa con Google Reseñas mediante redirección del navegador del usuario). | 🟢 BAJO |

---

## 3. Hallazgos Detallados y Vulnerabilidades Identificadas

### 🔴 Hallazgo 1: Exposición Excesiva de Datos Personales (API3:2023)
- **Ubicación:** `supabase/schema.sql` (Línea 170)
- **Problema:** La política RLS actual permite que cualquier usuario anónimo con la clave pública `anon` lea todas las columnas de restaurantes activos:
  ```sql
  CREATE POLICY "Public read active restaurants"
  ON restaurants FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
  ```
- **Impacto:** Un actor malintencionado puede consultar directamente el endpoint REST de Supabase (`/rest/v1/restaurants?select=*`) y extraer masivamente el teléfono personal del gerente (`manager_phone`) y la dirección de todos los locales comerciales, facilitando ataques de phishing o spam telefónico.
- **Remediación:** Utilizar una Vista SQL pública (`VIEW public_restaurants`) o crear una función/política que restrinja las columnas legibles al público general (`brand_name`, `name`, `logo_url`, `google_review_url`, `tier`, `is_ad_free`, `brand_color`, `links`).

---

### 🔴 Hallazgo 2: Falta de Límite de Recursos y Denegación de Servicio en Base de Datos (API4:2023)
- **Ubicación:** `supabase/schema.sql` (Líneas 117-136, 206-210)
- **Problema:** 
  1. La política de inserción en `feedback` es completamente abierta a usuarios anónimos (`WITH CHECK (true)`).
  2. La función RPC `record_tag_scan` es `SECURITY DEFINER` y realiza un `INSERT INTO tag_scans` en cada invocación sin ningún límite de frecuencia ni validación de IP/rate-limit.
- **Impacto:** Un script automatizado enviando solicitudes en bucle puede saturar el límite de almacenamiento del plan gratuito de Supabase (500 MB) o llenar la tabla `tag_scans` y `feedback` con millones de registros basura en pocos minutos, bloqueando el servicio para usuarios legítimos.
- **Remediación:**
  - Agregar un campo *honeypot* invisible y validación de longitud de texto en el formulario de feedback.
  - Implementar un rate-limit en PostgreSQL usando una tabla temporal de IPs/timestamps, o delegar el registro de escaneos a agregados en lugar de inserciones individuales sin límite.
  - Restringir la política de inserción en `feedback`: `WITH CHECK (status = 'new' AND notified_to_owner = false)`.

---

### 🟡 Hallazgo 3: Manipulación No Autorizada de Métricas Publicitarias (API6:2023)
- **Ubicación:** `supabase/schema.sql` (Líneas 138-150)
- **Problema:** La función `increment_ad_stats(p_ad_id, p_type)` puede ser invocada de manera ilimitada desde la API de Supabase por cualquier usuario anónimo.
- **Impacto:** Competidores de anunciantes o usuarios malintencionados pueden inflar fraudulentamente las métricas de impresiones o clics de un anuncio, distorsionando el reporte de rendimiento que se le entrega a los clientes de la red publicitaria.
- **Remediación:** Restringir la frecuencia con la que un mismo cliente puede incrementar impresiones mediante cookies de sesión o control por token en Supabase.

---

### 🟡 Hallazgo 4: Aislamiento Inquilino / BOLA Futuro (API1:2023)
- **Ubicación:** `supabase/schema.sql` (Políticas administrativas)
- **Problema:** Las políticas administrativas actuales utilizan `TO authenticated USING (true)`. Esto es funcional para un Administrador General único. Sin embargo, cuando se expanda el sistema para que cada dueño de restaurante tenga su propio usuario de acceso, un dueño autenticado podría leer y modificar sucursales, tags y quejas de otros dueños de restaurantes (BOLA / IDOR).
- **Remediación:** Diseñar desde ahora la política para asociar usuarios de `auth.users` con `organizations.id` mediante la columna `auth.uid() = organization.owner_id`.

---

## 4. Plan de Remediación Inmediata (Parche SQL de Seguridad)

Para corregir los Hallazgos 1, 2 y 3, se debe aplicar el siguiente endurecimiento en `supabase/schema.sql`:

```sql
-- 1. Vista Pública Segura (Evita exponer manager_phone al público general)
CREATE OR REPLACE VIEW public_restaurants AS
SELECT 
    id, slug, brand_name, branch_name, name, 
    google_review_url, logo_url, tier, is_ad_free, 
    brand_color, links, is_active
FROM restaurants
WHERE is_active = true;

-- 2. Endurecimiento de la Política de Feedback (Evita Mass-Assignment)
DROP POLICY IF EXISTS "Public insert feedback" ON feedback;
CREATE POLICY "Public insert feedback"
ON feedback FOR INSERT
TO anon, authenticated
WITH CHECK (
    status = 'new' 
    AND notified_to_owner = false
    AND length(comments) >= 3 
    AND length(comments) <= 2000
    AND rating IN (1, 2, 3)
);

-- 3. Protección de la función RPC de escaneos
CREATE OR REPLACE FUNCTION record_tag_scan(p_tag_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_restaurant_id UUID;
    v_last_scan TIMESTAMPTZ;
BEGIN
    -- Validar que el tag existe y obtener último escaneo
    SELECT restaurant_id, last_scanned_at 
    INTO v_restaurant_id, v_last_scan 
    FROM tags 
    WHERE tag_code = p_tag_code AND is_active = true;
    
    IF v_restaurant_id IS NOT NULL THEN
        -- Protección contra bucles de escaneo (Rate Limit mínimo de 2 segundos por tag)
        IF v_last_scan IS NULL OR (now() - v_last_scan) > interval '2 seconds' THEN
            UPDATE tags 
            SET scan_count = scan_count + 1,
                last_scanned_at = now()
            WHERE tag_code = p_tag_code;

            INSERT INTO tag_scans(tag_code, restaurant_id) VALUES (p_tag_code, v_restaurant_id);
        END IF;
    END IF;
END;
$$;
```
