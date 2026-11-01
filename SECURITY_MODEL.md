# Security Model

**Estado:** Aprobado y Actualizado · **Fecha de revisión:** 2026-11-01 · **Aplica a:** Todo el repositorio `Google Reseñas`

---

## 1. Sistema y Alcance (System and Scope)

- **Propósito:** Plataforma web integral para conectar tags físicos NFC y códigos QR a flujos optimizados de reseñas en Google, buzón privado de quejas 1-3 estrellas, red publicitaria hiperlocal, pasaporte web de cupones PWA, comandas en mesa, terminal de meseros y sistema KDS de cocina.
- **Modelo de Despliegue:** 
  - **Frontend:** Single Page Application (SPA) con React, Vite, Tailwind CSS y HashRouter, distribuido de forma estática en GitHub Pages / CDN.
  - **Backend / Persistencia:** **Supabase BaaS** (PostgreSQL gestionado, Supabase Auth, Storage y PostgREST API).
- **Exposición de Red:**
  - Las pantallas de resolución de tags (`/?t=NFC-xxx`), carta digital, pedidos de mesa y cupones PWA son **públicas y accesibles desde Internet** para cualquier comensal con un smartphone.
  - El panel de administración global (`/#/admin`) y el portal de locatarios (`/#/portal`) están expuestos públicamente pero **blindados mediante autenticación de Supabase Auth y validación de membresías**.
  - La clave pública `anon` de Supabase se expone deliberadamente en el bundle del frontend; la seguridad descansa en las políticas **Row Level Security (RLS)** y **Triggers a Nivel de Base de Datos** en PostgreSQL.

---

## 2. Modelo de Amenazas y Límites de Confianza (Threat Model & Trust Boundaries)

### Actores
1. **Comensal Anónimo (No Autenticado):** Accede al escanear un tag NFC o QR en una mesa de restaurante; puede ver el menú, ordenar platillos, llamar al mesero, dejar quejas y reclamar cupones.
2. **Personal de Sala / Cocina (Staff con PIN):** Meseros y cocineros con acceso a las terminales KDS y alertas de mesa protegidas por PIN de 4 dígitos.
3. **Dueño de Restaurante / Gerente (Portal Tenant):** Gestiona sucursales, enlaces, carta, quejas privadas y campañas publicitarias propias.
4. **Superadministrador (Global Admin):** Acceso total a finanzas, métricas globales, organizaciones, hardware y red publicitaria.
5. **Atacante / Bot Malicioso en Internet:** Intenta scrapear datos de negocios, saturar la base de datos con spam, defraudar presupuestos publicitarios o escalar privilegios.

### Entradas Controladas por el Usuario (Attacker-Controlled Inputs)
- Parámetros de URL (`?t=...`, `?tag=...`, `?r=...`).
- Formularios de comensales: quejas, pedidos de mesa (`table_orders`), llamadas (`table_calls`), reclamo de cupones.
- Formularios administrativos y de portal: URLs de reseñas (`google_review_url`), banners, links de menú y datos de facturación.
- Payloads JSON enviados a la API PostgREST.

### Límites de Confianza (Trust Boundaries)
- **El navegador del cliente es NO CONFIABLE:** Cualquier guardián de ruta en React (`AdminAuthGuard`, `PortalAuthGuard`) es puramente estético. La única barrera real de control de acceso son las políticas RLS y triggers de PostgreSQL en Supabase.
- **La clave pública `anon`:** No concede privilegios administrativos ni de bypass por sí misma.
- **La clave `service_role`:** NUNCA debe incluirse en el frontend ni en repositorios de código; sólo la clave pública `anon` está permitida en variables de entorno cliente.

---

## 3. Invariantes de Seguridad (Security Invariants)

- **INV-1 (Lectura Pública Restringida):** Un usuario no autenticado (rol `anon`) solo puede consultar registros activos (`is_active = true`) de las tablas `restaurants`, `tags`, `ads` y `menu_items`.
- **INV-2 (Aislamiento Multi-Tenant de Organizaciones):** Los miembros de una organización solo pueden ver y modificar los datos (restaurantes, tags, quejas, tickets, comandas y llamadas) pertenecientes a su propia empresa.
- **INV-3 (Privacidad de Quejas y Protección de Reputación):** El buzón de comentarios privados (`feedback`) permite inserciones públicas para comensales, pero su lectura, edición y marcado de estado está restringido estrictamente a miembros de la sucursal y al superadministrador.
- **INV-4 (Protección contra Inserción Maliciosa de Feedback):** Un comensal anónimo no puede enviar quejas con estados modificados (ej. `reviewed`), ni campos gigantescos.
- **INV-5 (Blindaje de Rol Superadmin):** La función `is_superadmin()` se evalúa exclusivamente contra `raw_app_meta_data->>'role' = 'superadmin'` (gestionado por el servidor), impidiendo que un usuario cliente se auto-promueva modificando su `raw_user_meta_data`.
- **INV-6 (Blindaje de Columnas de Monetización y Facturación):** Un suscriptor no puede alterar `tier`, `is_ad_free` ni `ad_credit_balance` directamente en la tabla `restaurants`. El trigger `prevent_unauthorized_restaurant_billing_mutation()` bloquea mutaciones no autorizadas tanto en `INSERT` como en `UPDATE`.
- **INV-7 (Anti-Abuso y Rate Limiting de Métricas Publicitarias):** `record_tag_scan` tiene un throttle de 2 segundos por tag. `increment_ad_stats` valida estrictamente tipos `impression` o `click` y solo opera sobre anuncios activos.
- **INV-8 (Garantía Single-Use de Cupones):** Un cupón de descuento (`coupons`) solo puede redimirse una única vez; el estado `redeemed` y la verificación de fecha de expiración se ejecutan atómicamente antes de registrar el consumo.
- **INV-9 (Sanitización Estricta de Redirecciones):** Cualquier URL de redirección externa (`google_review_url`, links de Linktree, URL de destino de anuncios) debe validarse estrictamente con `ensureAbsoluteUrl()`, bloqueando esquemas `javascript:`, `data:` y `vbscript:`.
- **INV-10 (Cero Claves Maestras Expuestas):** Ninguna clave `service_role` ni secretos de pasarelas de pago se almacenan en código fuente, bundles de Vite ni repositorios Git.

---

## 4. Clases de Hallazgos y Severidad (Finding Classes)

| Clase de Vulnerabilidad | Invariante Afectado | Reportable | Severidad | Contexto |
| :--- | :---: | :---: | :---: | :--- |
| **Escalación de Privilegios a Superadmin** | INV-5 | **Sí** | **CRÍTICA** | Acceso irrestricto a todas las empresas, finanzas y configuraciones. |
| **Mass Assignment en Tiers o Saldo Publicitario** | INV-6 | **Sí** | **CRÍTICA** | Auto-adjudicación de servicios de pago sin liquidar la suscripción. |
| **Fuga Multi-Tenant (BOLA / IDOR)** | INV-2 | **Sí** | **ALTA** | Visualización o alteración de datos de un restaurante por parte de otro. |
| **Ejecución de Scripts vía Redirección (XSS)** | INV-9 | **Sí** | **ALTA** | Inyección de payloads `javascript:` en URLs de reseña o enlaces de mesa. |
| **Agotamiento de Presupuesto por Click Fraud** | INV-7 | **Sí** | **MEDIA** | Scripts automatizados consumiendo saldo de anunciantes locales. |
| **Doble Redención de Cupones (Race Condition)** | INV-8 | **Sí** | **MEDIA** | Clientes reutilizando un cupón de descuento ya canjeado. |
| **Evasión de PIN en Terminal Demo Local** | — | **No** | **NO REPORTABLE** | El bypass con PIN `1234` está restringido a entornos de prueba sin Supabase (`nfc_demo_auth = true`). |
| **Clonación Física de Stickers NFC** | — | **No** | **FUERA DE ALCANCE** | Riesgo físico de hardware aceptado; se mitiga con rondas de inspección física en mesa. |

---

## 5. Exclusiones y Riesgos Aceptados (Accepted Risks)

1. **Riesgo Físico de Hardware NFC:**  
   Un tercero puede despegar o sustituir físicamente un sticker NFC en la mesa. Es un riesgo intrínseco al mundo físico, mitigado operativamente por el personal del restaurante.
2. **Modo Demo Offline sin Conexión Supabase:**  
   Si la aplicación se utiliza sin variables de entorno de Supabase configuradas, los datos residen en `localStorage`. Este modo existe para pruebas de desarrollo; en entornos de producción, la persistencia en Supabase con RLS es mandatoria.
