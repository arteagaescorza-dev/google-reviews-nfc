# Especificación Técnica: Plataforma NFC Google Reseñas & Red Publicitaria Local

**Archivo:** `docs/SPEC.md`  
**Versión:** 1.0.0  
**Fecha:** 28 de Octubre, 2026  
**Estado:** Pendiente de Aprobación  

---

## 1. Supuestos Iniciales (Assumptions)

1. **Plataforma Web Móvil:** La aplicación es 100% web optimizada para pantallas móviles de comensales. No requiere descarga de apps nativas en iOS o Android.
2. **Hosting Estático:** Se despliega en GitHub Pages sin servidor Node.js backend propio (costo \$0 de hosting).
3. **Backend As a Service (BaaS):** Se utiliza Supabase en su plan gratuito (PostgreSQL, Autenticación y Storage para imágenes) consumido directamente desde el cliente vía `@supabase/supabase-js`.
4. **Enrutamiento GitHub Pages:** Se utiliza enrutamiento con Hash (`HashRouter`) y soporte para query parameters (`?t=NFC-001`) para garantizar que la recarga de página nunca arroje error 404 en GitHub Pages.
5. **Autenticación:** El acceso administrativo al panel (`#/admin`) está protegido por usuario y contraseña mediante Supabase Auth. El acceso de los comensales (`?t=...`) es público y no requiere login.
6. **Cobros en v1:** No se integra pasarela de pago automatizada (Stripe/Mercado Pago) en esta versión; la gestión de cobros y facturación con clientes se realiza offline.

---

## 2. Objetivo y Casos de Uso (Objective & User Stories)

### Objetivo
Proveer un sistema centralizado, ligero y de costo operativo nulo que permita comercializar placas y stickers NFC para que negocios locales aumenten sus reseñas positivas en Google, protejan su reputación ante malas experiencias, ofrezcan un micro-linktree, y moneticen o promuevan publicidad cruzada local.

### Historias de Usuario (Acceptance Stories)

1. **Comensal con experiencia positiva (4-5 estrellas):**
   - Toca el tag NFC en su mesa.
   - Ve el logo y nombre del restaurante de inmediato (< 1.5s).
   - Pulsa 4 o 5 estrellas.
   - El sistema abre de inmediato la ficha oficial de Google Maps/Google Reseñas con la modal de escribir reseña activa.

2. **Comensal con experiencia negativa (1-3 estrellas):**
   - Toca el tag NFC y pulsa 1, 2 o 3 estrellas.
   - En lugar de ir a Google, se despliega una interfaz amigable pidiéndole retroalimentación para la gerencia.
   - El comensal ingresa su comentario (y opcionalmente su nombre y teléfono).
   - Al enviar, los datos quedan almacenados en la base de datos y se muestra un agradecimiento por ayudar a mejorar.

3. **Comensal en restaurante con Paquete 1 (Enlace Directo) y Publicidad:**
   - Toca el tag NFC.
   - Ve una pantalla limpia durante 2.5 segundos con un spinner, el logo del restaurante, el texto "*Redirigiendo a Google Reseñas...*" y un banner publicitario patrocinado al pie.
   - Puede esperar los 2.5s o pulsar el botón "*Continuar ahora*" para saltar a Google de inmediato.

4. **Administrador creando un nuevo cliente:**
   - Inicia sesión en `#/admin`.
   - Crea un nuevo restaurante ("Taquería Central", slug `taqueria-central`, URL de Google Reseñas, paquete Tier 2 o Tier 3, sube logo).
   - Asigna tags NFC pre-generados (`NFC-010`, `NFC-011`) especificando el identificador de mesa ("Mesa 1", "Mesa 2").
   - Define si el negocio tiene la casilla `is_ad_free` activa o si muestra anuncios.

5. **Administrador configurando la Red de Publicidad:**
   - Registra una campaña ("Gimnasio IronFit - 20% descuento", banner JPG/PNG/WebP, URL de destino).
   - Selecciona a qué restaurantes o tags específicos se les mostrará el anuncio (o si es general).

---

## 3. Pila Tecnológica (Tech Stack)

| Capa | Tecnología | Justificación |
|---|---|---|
| **Lenguaje** | TypeScript | Tipado estricto para entidades (restaurantes, tags, ads, feedback). |
| **Framework UI** | React 18 + Vite | Rendimiento óptimo, compilación estática rápida, bundle ligero (< 150KB gzip). |
| **Estilos** | Tailwind CSS | Diseño responsivo móvil first, sin CSS pesado adicional. |
| **Iconografía** | Lucide React | Iconos SVG optimizados y accesibles. |
| **Router** | React Router DOM (HashRouter) | Compatible al 100% con GitHub Pages sin errores 404 al recargar. |
| **Base de Datos & Auth** | Supabase JS Client (`@supabase/supabase-js`) | PostgreSQL gestionado, Auth, RLS y Storage para imágenes. |
| **Generador QR** | `qrcode.react` | Para previsualizar y descargar códigos QR de cada tag desde el panel admin. |

---

## 4. Comandos del Proyecto (Commands)

```bash
# Instalación de dependencias
npm install

# Servidor de desarrollo local
npm run dev

# Compilación para producción (genera carpeta /dist para GitHub Pages)
npm run build

# Previsualización local del build estático
npm run preview

# Linter y verificación de tipos TypeScript
npm run lint
npx tsc --noEmit
```

---

## 5. Estructura de Directorios (Project Structure)

```
Google Reseñas/
├── docs/
│   ├── intent/
│   │   └── nfc-google-reviews.md   # Intención y visión de negocio validada
│   └── SPEC.md                     # Esta especificación técnica
├── public/
│   ├── favicon.svg                 # Favicon de la app
│   └── placeholder-logo.svg        # Asset por defecto
├── src/
│   ├── assets/                     # Estilos y recursos estáticos
│   ├── components/                 # Componentes reutilizables
│   │   ├── client/                 # Vistas que ve el comensal
│   │   │   ├── DirectRedirect.tsx  # Tier 1 (con o sin ad countdown)
│   │   │   ├── ReviewRating.tsx    # Widget interactivo de 1 a 5 estrellas
│   │   │   ├── FeedbackModal.tsx   # Formulario privado para 1-3 estrellas
│   │   │   ├── LinkTreeSection.tsx # Tier 3: Botones de menú, redes, wifi
│   │   │   └── AdBanner.tsx        # Renderizado del banner patrocinado
│   │   ├── admin/                  # Componentes del panel administrativo
│   │   │   ├── AdminNavbar.tsx
│   │   │   ├── RestaurantForm.tsx
│   │   │   ├── TagBatchModal.tsx   # Creación masiva de tags NFC
│   │   │   ├── AdCampaignModal.tsx
│   │   │   └── FeedbackTable.tsx
│   │   └── ui/                     # Botones, inputs, badges, modales
│   ├── lib/
│   │   ├── supabase.ts             # Cliente de Supabase inicializado
│   │   ├── constants.ts            # Tiers, estados y defaults
│   │   └── utils.ts                # Helpers de formato, clases y URLs
│   ├── pages/
│   │   ├── ResolverPage.tsx        # Entrada principal para tags (?t=NFC-xxx)
│   │   ├── AdminLoginPage.tsx      # Login administrativo
│   │   ├── AdminDashboardPage.tsx  # Vista general y métricas rápidas
│   │   ├── AdminRestaurantsPage.tsx# Gestión de negocios clientes
│   │   ├── AdminTagsPage.tsx       # Gestión y asignación de tags NFC
│   │   ├── AdminAdsPage.tsx        # Gestión de campañas publicitarias
│   │   └── AdminFeedbackPage.tsx   # Buzón de quejas privadas
│   ├── types/
│   │   └── index.ts                # Definiciones TypeScript completas
│   ├── App.tsx                     # Configuración de rutas y fallback de tags
│   ├── main.tsx                    # Punto de entrada de React
│   └── index.css                   # Directivas Tailwind
├── supabase/
│   ├── schema.sql                  # Script SQL con tablas, índices y RLS
│   └── seed.sql                    # Datos de prueba iniciales
├── index.html                      # HTML raíz para Vite
├── vite.config.ts                  # Configuración de base path para GitHub Pages
├── tailwind.config.js              # Configuración de estilos
├── tsconfig.json                   # Configuración TypeScript
└── package.json
```

---

## 6. Modelo de Datos y Esquema Supabase (Database Schema & Security)

### Tablas Principales

```sql
-- 0. ORGANIZACIONES / DUEÑOS DE NEGOCIO (Multi-sucursal y multi-marca)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- Ej: 'Grupo Gastronómico del Norte'
    owner_name TEXT NOT NULL,
    owner_email TEXT,
    owner_phone TEXT, -- Para alertas de WhatsApp futuras
    notify_negative_feedback BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1. SUCURSALES / RESTAURANTES
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    brand_name TEXT NOT NULL, -- Ej: 'Tacos El Rey' o 'Café Central'
    branch_name TEXT NOT NULL DEFAULT 'Principal', -- Ej: 'Sucursal Centro', 'Sucursal Norte'
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL, -- Nombre completo mostrado (ej: 'Tacos El Rey - Centro')
    google_review_url TEXT NOT NULL,
    logo_url TEXT,
    tier INT NOT NULL DEFAULT 2 CHECK (tier IN (1, 2, 3, 4)),
    is_ad_free BOOLEAN NOT NULL DEFAULT false,
    brand_color TEXT NOT NULL DEFAULT '#2563eb',
    links JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{ id, title, url, icon, type }]
    address TEXT,
    manager_phone TEXT, -- Teléfono directo para avisos inmediatos
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TAGS FÍSICOS (NFC / QR)
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_code TEXT UNIQUE NOT NULL, -- Ej: 'NFC-001', 'MESA-A1'
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    table_identifier TEXT, -- Ej: 'Mesa 3', 'Terraza 2'
    custom_ad_id UUID, -- Override de anuncio específico si aplica
    scan_count INT NOT NULL DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. RED PUBLICITARIA (ADS)
CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    advertiser_name TEXT NOT NULL,
    banner_url TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    placement_type TEXT NOT NULL DEFAULT 'bottom_banner' CHECK (placement_type IN ('bottom_banner', 'interstitial')),
    target_type TEXT NOT NULL DEFAULT 'all' CHECK (target_type IN ('all', 'specific_restaurants', 'specific_tags')),
    target_restaurant_ids UUID[] DEFAULT ARRAY[]::UUID[],
    target_tag_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    impressions_count INT NOT NULL DEFAULT 0,
    clicks_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. BUZÓN DE RETROALIMENTACIÓN PRIVADA (FEEDBACK 1-3 ESTRELLAS)
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    tag_code TEXT,
    rating INT NOT NULL CHECK (rating IN (1, 2, 3)),
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    comments TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'contacted')),
    notified_to_owner BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. HISTORIAL DE ESCANEOS (ARQUITECTURA PREPARADA TIER 4)
CREATE TABLE tag_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_code TEXT NOT NULL,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. ESQUEMA PREPARADO PARA FIDELIZACIÓN (FASE FUTURA WALLET)
-- loyalty_cards: id, customer_phone, pass_serial, points_balance, google_wallet_jwt, apple_pass_url
```

### Reglas de Seguridad (Row Level Security - RLS)

- **`restaurants`:**
  - `SELECT`: Público para registros con `is_active = true`.
  - `INSERT`, `UPDATE`, `DELETE`: Solo para usuarios autenticados (Admin).
- **`tags`:**
  - `SELECT`: Público para resolución del tag (`is_active = true`).
  - `UPDATE`: Público para incremento de `scan_count` vía función RPC segura o trigger.
  - `INSERT`, `UPDATE`, `DELETE` completo: Solo Admin.
- **`ads`:**
  - `SELECT`: Público para anuncios activos `is_active = true`.
  - `INSERT`, `UPDATE`, `DELETE`: Solo Admin.
- **`feedback`:**
  - `INSERT`: Público (cualquier comensal que envía queja legítima).
  - `SELECT`, `UPDATE`, `DELETE`: Solo Admin autenticado.

---

## 7. Estrategia de URLs y Resolución de Tags

### Formato de URLs grabadas en chips NFC
1. **Con parámetro de consulta:**  
   `https://[usuario].github.io/[repo]/?t=NFC-001`  
   *(Ideal para que el comensal vea una URL limpia sin fragmentos hash raros en su navegador inicial).*
2. **Compatibilidad:**  
   Al cargar `index.html`, un script inicial analiza si viene `?t=NFC-xxx` o `?r=slug` y enruta automáticamente a la vista de resolución de cliente sin recargar la página.
3. **Acceso administrativo:**  
   `https://[usuario].github.io/[repo]/#/admin`  
   Protegido por Supabase Auth; si no hay sesión activa, redirige a `#/admin/login`.

---

## 8. Límites y Reglas de Calidad (Boundaries)

- **Siempre hacer:**
  - Optimizar la carga de la pantalla del comensal para que responda en menos de 1 segundo en redes móviles 4G.
  - Abrir la URL de Google Reseñas en una nueva pestaña/app usando `target="_blank"` o `window.location.href` según el sistema operativo detectado (iOS/Android).
  - Validar datos en el formulario de feedback para evitar envíos vacíos.
  - Sanitizar entradas antes de enviar a Supabase.
- **Consultar primero:**
  - Modificaciones estructurales en las tablas SQL de Supabase.
  - Cambios en el flujo de estrellas (1-3 vs 4-5).
  - Agregar bibliotecas pesadas de dependencias npm (> 100KB).
- **Nunca hacer:**
  - Dejar expuestas claves privadas `service_role` de Supabase en el código cliente (solo usar la `anon_key` pública con RLS activo).
  - Bloquear el acceso a Google Reseñas si el usuario insiste en dar 1 estrella (el comensal puede elegir continuar si lo desea, aunque se promueva prioritariamente el feedback privado).
  - Guardar contraseñas de administradores en texto plano.

---

## 9. Criterios de Aceptación y Pruebas (Success Criteria)

| ID | Prueba / Criterio | Resultado Esperado |
|---|---|---|
| **SC-01** | Resolución de Tag | Ingresar con `?t=NFC-001` carga los datos del restaurante asignado en menos de 1.5s. |
| **SC-02** | Filtro de 5 Estrellas | Pulsar 5 estrellas redirige inmediatamente a la URL de Google Reseñas configurada. |
| **SC-03** | Captura de Feedback | Pulsar 2 estrellas abre el modal de feedback; enviar el mensaje guarda la fila en `feedback` y muestra confirmación. |
| **SC-04** | Paquete 1 con Ads | En Tier 1 sin ad-free, muestra pantalla de transición con banner durante 2.5s antes de redirigir. |
| **SC-05** | Paquete 1 Ad-Free | En Tier 1 con `is_ad_free = true`, redirige inmediatamente sin pausas ni publicidad. |
| **SC-06** | Segmentación de Anuncios | Un anuncio asignado exclusivamente a `taqueria-central` solo se muestra en tags de ese restaurante. |
| **SC-07** | Panel de Administración | El admin puede iniciar sesión, crear un negocio, generar 50 tags en lote y ver las quejas recibidas. |
| **SC-08** | Despliegue GitHub Pages | El proyecto compila con `npm run build` sin errores de TypeScript y corre como SPA estática. |

---

## 10. Criterios de Migración de Hosting (GitHub Pages → Nube / Hosting Dedicado)

GitHub Pages es la elección perfecta para la fase inicial (costo \$0 de infraestructura, CDN global ultra rápido y simplicidad de despliegue mediante GitHub Actions).

La migración a una plataforma en la nube más robusta (Cloudflare Pages, Vercel o un VPS dedicado con Docker/Coolify) se convertirá en una necesidad técnica cuando ocurra cualquiera de los siguientes escenarios:

1. **Dominios Personalizados Dinámicos Multi-Tenant:**
   - *Escenario:* Un restaurante o cadena exige que el tag NFC abra bajo su propio dominio de marca (ej. `resenas.tacoselrey.com` o `menu.cafecentral.com`).
   - *Limitación de GitHub Pages:* Solo permite configurar **un único CNAME** por repositorio.
   - *Solución al migrar:* Vercel, Cloudflare for SaaS o un VPS con Nginx/Caddy que permite asignar dominios personalizados ilimitados mediante API.

2. **Firmado Criptográfico de Tarjetas Apple Wallet (`.pkpass`):**
   - *Escenario:* Al emitir pases de fidelización para iPhone, iOS exige que los archivos `.pkpass` vengan firmados digitalmente con un certificado de desarrollador de Apple en tiempo de ejecución.
   - *Limitación de GitHub Pages:* No ejecuta código de servidor ni puede almacenar certificados criptográficos privados de firma.
   - *Solución al migrar:* Supabase Edge Functions (Deno) o un microservicio en Node.js/Fastify en un hosting backend.

3. **Límites de Tráfico y Políticas de GitHub Pages:**
   - *Escenario:* La red crece a más de 50 restaurantes activos con cientos de miles de escaneos mensuales.
   - *Límites oficiales de GitHub Pages:* 100 GB de ancho de banda mensual, 10 builds por hora y 1 GB de tamaño de repositorio. Si bien un bundle SPA de 150 KB puede soportar ~500,000 visitas con 100 GB, superar ese umbral requerirá Cloudflare Pages (ancho de banda ilimitado gratuito) o CDN dedicado.

4. **Webhooks Pesados y Procesos en Background:**
   - *Escenario:* Envío masivo de mensajes de WhatsApp o sincronización con sistemas de punto de venta (POS) que requieran colas de trabajo (BullMQ / Redis) y servidores activos 24/7.

---

## 11. Roadmap de Servicios Futuros (Notificaciones & Fidelización)

### Fase 2: Alertas Inmediatas y Envío Automatizado de Analíticas
- **Alerta de Comentario Negativo (< 60 segundos):**
  - Cuando un comensal deja 1, 2 o 3 estrellas en la tabla `feedback`, un Database Webhook de Supabase dispara una notificación directa al WhatsApp o correo del gerente de la sucursal (`restaurants.manager_phone`), permitiéndole acercarse a la mesa antes de que el cliente abandone el local.
- **Reporte Periódico de Rendimiento:**
  - Envío mensual en PDF o mensaje resumido de WhatsApp al dueño de la organización con: total de escaneos, total de reseñas de 5 estrellas canalizadas a Google, quejas retenidas y rendimiento de anuncios.

### Fase 3: Fidelización Digital con Apple Wallet & Google Wallet
- **Pase Digital en 1 Toque:**
  - Al escanear el tag o dejar su reseña, el comensal puede pulsar *"Agregar tarjeta de cliente frecuente a Apple Wallet / Google Wallet"*.
  - Guarda la tarjeta digital en su smartphone sin descargar ninguna app.
- **Acumulación de Puntos / Sellos:**
  - Cada visita o consumo suma puntos mediante escaneo o validación de ticket.
- **Campañas de Reenganche por WhatsApp:**
  - Envío de promociones personalizadas a través de WhatsApp Business API a los usuarios registrados en el programa de lealtad (ej: 2x1 en su cumpleaños, recordatorio si no ha visitado en 30 días).

---

## 12. Preguntas Abiertas (Open Questions)

*No hay preguntas bloqueantes en este momento; todos los objetivos iniciales, arquitectura escalable multi-sucursal y visión de futuro han quedado formalmente integrados.*

