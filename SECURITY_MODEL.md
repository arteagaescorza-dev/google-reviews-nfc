# Security Model

**Estado:** Aprobado · **Fecha de revisión:** 2026-10-28 · **Aplica a:** Todo el repositorio `Google Reseñas`

---

## 1. Sistema y Alcance (System and Scope)

- **Propósito:** Plataforma web ligera multi-negocio para conectar tags NFC físicos y códigos QR a flujos optimizados de reseñas en Google, buzón privado de quejas y red de micro-anuncios patrocinados.
- **Modelo de Despliegue:** 
  - **Frontend:** Estático desplegado en **GitHub Pages** (Single Page Application con React, Vite y HashRouter).
  - **Backend / Persistencia:** **Supabase BaaS** (PostgreSQL gestionado, Supabase Auth y Storage).
- **Exposición de Red:**
  - Las pantallas de resolución de tags (`/?t=NFC-xxx`) y el formulario de feedback son **públicos y accesibles desde Internet** para cualquier comensal con un smartphone.
  - El panel de control (`/#/admin`) está expuesto públicamente pero **blindado mediante autenticación** (Supabase Auth).
  - La clave pública `anon` de Supabase se expone deliberadamente en el bundle del frontend; por diseño, la seguridad descansa en las políticas **Row Level Security (RLS)** de PostgreSQL.

---

## 2. Modelo de Amenazas y Límites de Confianza (Threat Model & Trust Boundaries)

### Actores
1. **Comensal Anónimo (No Autenticado):** Accede al escanear un tag NFC físico o código QR en una mesa de restaurante.
2. **Administrador Autenticado:** Tú como operador de la plataforma, autenticado mediante Supabase Auth con credenciales de correo/contraseña.
3. **Dueño de Restaurante / Gerente:** Recibe alertas y atiende quejas privadas.
4. **Atacante / Bot Malicioso en Internet:** Intenta scrapear datos de negocios, saturar la base de datos con spam o manipular métricas publicitarias.

### Entradas Controladas por el Usuario (Attacker-Controlled Inputs)
- Parámetros de URL (`?t=...`, `?tag=...`, `?r=...`).
- Formulario de feedback: `comments`, `customer_name`, `customer_phone`, `customer_email`, campo honeypot.
- Datos ingresados en formularios administrativos: `google_review_url`, `banner_url`, `destination_url`.

### Límites de Confianza (Trust Boundaries)
- **El navegador del cliente es NO CONFIABLE:** Cualquier validación o guardián de ruta en TypeScript (`AdminAuthGuard`) es meramente de interfaz. La única barrera real de acceso a datos son las políticas RLS y funciones de PostgreSQL en Supabase.
- **La clave pública `anon`:** No concede ningún privilegio administrativo por sí misma.
- **La clave `service_role`:** NUNCA debe incluirse en el frontend ni en los repositorios de código; sólo la clave `anon` está permitida en variables de entorno públicas.

---

## 3. Invariantes de Seguridad (Security Invariants)

- **INV-1 (Lectura Pública Restringida):** Un usuario no autenticado (rol `anon`) solo puede consultar registros activos (`is_active = true`) de las tablas `restaurants`, `tags` y `ads`.  
  *Enfocado por:* Políticas RLS en `supabase/schema.sql` (`Public read active restaurants`, `Public read active tags`, `Public read active ads`).

- **INV-2 (Privacidad de Quejas y Protección de Reputación):** El buzón de comentarios privados (`feedback`) permite inserciones públicas para comensales legítimos, pero su lectura, edición y marcado de estado (`reviewed`, `contacted`) está restringido estrictamente a usuarios autenticados.  
  *Enfocado por:* Políticas RLS en `supabase/schema.sql` (`Public insert feedback` y `Admin full access to feedback`).

- **INV-3 (Prevención de Asignación Masiva en Feedback):** Un comensal anónimo no puede insertar quejas con estados modificados arbitrariamente (ej. marcarse como `reviewed` o `notified_to_owner = true`), ni enviar payloads vacíos o desmedidos.  
  *Enfocado por:* Cláusula `WITH CHECK` en la política `Public insert feedback` que valida `status = 'new'`, `notified_to_owner = false`, `length(comments) BETWEEN 3 AND 2000` y `rating IN (1, 2, 3)`.

- **INV-4 (Protección contra Denegación de Servicio y Bucles de Escaneo):** Las peticiones automatizadas no pueden saturar la tabla `tag_scans` ni la memoria de PostgreSQL mediante llamadas en bucle.  
  *Enfocado por:* Throttle / rate-limit de 2 segundos en la función RPC `record_tag_scan` y campo trampa anti-bot (honeypot) en `FeedbackModal.tsx`.

- **INV-5 (Mutaciones Exclusivas de Administrador):** La creación, actualización o eliminación de organizaciones, sucursales, tags NFC y campañas de anuncios requiere invariablemente una sesión válida y verificada de Supabase Auth.  
  *Enfocado por:* Políticas RLS `TO authenticated USING (true) WITH CHECK (true)` en `supabase/schema.sql`.

- **INV-6 (Blindaje de Secretos):** La clave maestra de base de datos y la `service_role key` de Supabase jamás se almacenan en código fuente, bundles de Vite ni repositorios Git.  
  *Enfocado por:* `.gitignore`, `.env.example`, y uso exclusivo de variables `VITE_SUPABASE_ANON_KEY`.

---

## 4. Clases de Hallazgos y Severidad (Finding Classes)

| Clase de Vulnerabilidad | Invariante Afectado | Reportable | Contexto de Severidad |
|---|:---:|:---:|---|
| **Fuga de datos de quejas privadas (IDOR en feedback)** | INV-2 | **Sí** | **CRÍTICA:** Expondría opiniones confidenciales de clientes y datos de contacto de comensales. |
| **Bypass de RLS / Escritura no autorizada en restaurantes o tags** | INV-1, INV-5 | **Sí** | **CRÍTICA:** Permitiría a un atacante cambiar el enlace de Google de un restaurante para redirigir a sitios maliciosos. |
| **Exposición de claves privadas `service_role`** | INV-6 | **Sí** | **CRÍTICA:** Da control absoluto sobre la base de datos de Supabase. |
| **Inyección de código / XSS en el visor de quejas del administrador** | INV-2 | **Sí** | **ALTA:** Ejecutaría scripts en la sesión del administrador si los comentarios no son escapados por React. |
| **Saturación DoS de almacenamiento en Supabase** | INV-4 | **Sí** | **ALTA:** Provoca caída del servicio por sobrepasar la cuota gratuita (500 MB). |
| **Manipulación artificial de estadísticas de clics/impresiones** | — | **Sí** | **MEDIA:** Infla métricas comerciales pero no compromete la integridad del sistema. |
| **Evasión del Guardián en Modo Demo Local** (`localStorage.setItem('nfc_demo_auth', 'true')`) | — | **No** | **NO REPORTABLE:** Es un comportamiento previsto de diseño para permitir pruebas locales desconectadas; en producción real la seguridad la impone PostgreSQL RLS. |
| **Clonación física de chips NFC adhesivos** | — | **No** | **FUERA DE ALCANCE:** Riesgo físico aceptado; depende de inspecciones físicas en el local. |

---

## 5. Exclusiones y Riesgos Aceptados (Accepted Risks)

1. **Riesgo Físico de Hardware NFC:**  
   Un competidor o vándalo podría despegar un sticker NFC de una mesa o sustituirlo físicamente por otro sticker. Este riesgo es intrínseco al hardware físico en mesas de restaurantes y se mitiga operativamente mediante revisiones periódicas del personal del local.
2. **Modo Demo Local sin Supabase:**  
   Cuando la app corre sin variables de entorno de Supabase configuradas, los datos residen en `localStorage`. Este modo es únicamente para previsualización y pruebas de interfaz; en producción, la persistencia en la nube PostgreSQL es mandatoria.

