# Plan de Implementación Técnica: Portal del Suscriptor (/portal PWA)

**Documento:** `docs/IMPLEMENTATION_PLAN_PORTAL.md`  
**Estado:** Confirmado vía `/grill-me`  
**Objetivo:** Guía de desarrollo paso a paso para construir el Portal del Suscriptor móvil (PWA) con aislamiento estricto RLS en Supabase.

---

## 1. Migración de Base de Datos (Supabase SQL)

### Tabla `organization_members`
```sql
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
```

### Políticas RLS Multi-Tenant
1. **Identificación de Rol:**
   - Función auxiliar `is_superadmin()` que comprueba si el usuario actual es Superadmin.
   - Función auxiliar `get_user_organization_ids()` que retorna los IDs de organizaciones a los que pertenece el usuario.
2. **Aislamiento en `organizations`:**
   - Superadmin: acceso total.
   - Miembros: `SELECT` únicamente donde `id IN (SELECT get_user_organization_ids())`.
3. **Aislamiento en `restaurants`:**
   - Miembros: `SELECT` donde `organization_id IN (SELECT get_user_organization_ids())`.
   - Miembros: `UPDATE` restringido a campos de presentación (`links`, `brand_color`, `address`, `manager_phone`).
4. **Aislamiento en `feedback`:**
   - Miembros: `SELECT` y `UPDATE` de estados (`status`, `internal_notes`) únicamente para los restaurantes de su organización.

---

## 2. Flujo de Autenticación y Activación

1. **Creación en `/admin`:**
   - En la tarjeta o modal de Organización, se agrega la sección *"Usuarios con Acceso"*.
   - El Superadmin ingresa el correo y contraseña provisional.
   - Se invoca `supabase.auth.signUp()` asociando el `organization_id`.
   - Se inserta el registro en `organization_members`.
2. **Activación:**
   - El cliente recibe el correo de confirmación de Supabase.
   - Al pulsar el enlace, se activa su cuenta y se le redirige a `/portal`.
3. **Persistencia:**
   - Tokens almacenados de forma segura en almacenamiento local con refresco automático de sesión.

---

## 3. Arquitectura Frontend (Rutas y Componentes)

```
src/
├── pages/portal/
│   ├── PortalLoginPage.tsx         # Login móvil limpio
│   ├── PortalDashboardPage.tsx     # Contenedor principal con Bottom Nav
│   ├── PortalFeedbackTab.tsx       # Pestaña 1: Quejas y WhatsApp
│   ├── PortalLinksTab.tsx          # Pestaña 2: Editor Linktree & Wi-Fi
│   └── PortalMetricsTab.tsx        # Pestaña 3: Métricas de ROI
├── components/portal/
│   ├── PortalAuthGuard.tsx         # Protección de rutas /portal
│   ├── PortalHeader.tsx            # Selector de sucursal y perfil
│   ├── PortalBottomNav.tsx         # Barra fija inferior (3 pestañas)
│   └── PwaInstallBanner.tsx        # Prompt para agregar a pantalla de inicio
```

---

## 4. Configuración PWA (Progressive Web App)

1. **`public/manifest.json`:**
   - `name`: "Portal Restaurantes"
   - `short_name`: "Mi Local"
   - `display`: "standalone"
   - `start_url`: "/#/portal"
   - `theme_color`: "#2563eb"
   - `background_color`: "#ffffff"
2. **Detección de evento `beforeinstallprompt`:**
   - Banner en la parte superior que ofrece instalar la app con 1 toque.
