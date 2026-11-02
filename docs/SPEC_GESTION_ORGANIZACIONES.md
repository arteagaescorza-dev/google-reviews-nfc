---
id: SPEC-005
titulo: Gestión de Organizaciones, Marcas Multigiro y Sucursales en Superadmin
categoria: especificacion
estado: implementado
fecha_creacion: 2026-10-29
autores: [Mickey, Antigravity]
tags: [admin, superadmin, organizaciones, marcas, giros, sucursales, multi-tenant]
---

# SPEC-005: Gestión de Organizaciones, Marcas Multigiro y Sucursales en Superadmin

## 1. Resumen Ejecutivo & Arquitectura de 3 Niveles de Alta

El sistema estructura las cuentas de clientes bajo una jerarquía corporativa de 3 entidades encadenadas que permite que una misma organización opere múltiples marcas comerciales de distintos giros y múltiples sucursales supeditadas a cada marca:

1. **Organización (`public.organizations`)**: Base legal, fiscal (`billing_info` CFDI 4.0) y datos del dueño titular (`owner_name`, `owner_email`, `owner_phone`).
2. **Marca Comercial (`public.organization_brands`)**: Cada organización cuenta con su propio catálogo de marcas comerciales. Cada marca almacena su logotipo en formato cuadrado predeterminado (`256×256 px` 1:1) y se vincula al catálogo universal de giros comerciales (`public.business_verticals`).
3. **Sucursal Física (`public.restaurants`)**: Toda sucursal está supeditada a una marca comercial (`brand_id`), heredando su identidad visual y su giro operativo, y definiendo su enlace de reseñas de Google, paquete contratado (`Tier 1` a `4`), switch de modalidad de anuncios (`Marca Blanca Ad-Free` vs `Red de Anuncios`), teléfono de sucursal y dirección física.

```mermaid
flowchart TD
    A["Superadmin en /admin/restaurants"] --> B["Botón: Dar de Alta Organización"]
    B --> P1["Paso 1: Dar de Alta Organización<br/>(Datos Generales del Dueño + Datos Fiscales CFDI 4.0)"]
    P1 --> P2["Paso 2: Añadir Marca Comercial<br/>(Logo Cuadrado 1:1 + Buscador Universal de Giros)"]
    P2 -->|"Si el giro no existe"| G1["Botón: + Dar de alta giro en public.business_verticals"]
    G1 --> P2
    P2 --> P3["Paso 3: Añadir Sucursal Supeditada a la Marca<br/>(Link Google Reviews + Tier + Switch Anuncios + Teléfono y Dirección)"]
```

---

## 2. Tablas de Base de Datos (Supabase PostgreSQL)

### 2.1. Catálogo Universal de Giros (`public.business_verticals`)
Funciona de forma universal en todo el sistema y se sincroniza en tiempo real con todos los desplegables de marcas y sucursales:
* `id` (`UUID PRIMARY KEY`)
* `slug` (`TEXT UNIQUE NOT NULL`)
* `name` (`TEXT NOT NULL`) — Ej. `Gastronomía / Restaurante`, `Barbería & Peluquería`, `Clínica / Consultorio Dental`
* `unit_label` / `unit_plural` (`TEXT`) — Ej. `Mesa / Mesas`, `Sillón / Sillones`, `Consultorio / Consultorios`
* `show_kds` (`BOOLEAN`), `show_floor_staff` (`BOOLEAN`), `show_hostess` (`BOOLEAN`)

### 2.2. Tabla de Marcas por Organización (`public.organization_brands`)
* `id` (`UUID PRIMARY KEY`)
* `organization_id` (`UUID REFERENCES public.organizations(id) ON DELETE CASCADE`)
* `name` (`TEXT NOT NULL`)
* `vertical_id` (`UUID REFERENCES public.business_verticals(id)`)
* `vertical_slug` (`TEXT NOT NULL`)
* `logo_url` (`TEXT`) — Imagen normalizada en formato cuadrado estándar `256×256 px`
* `brand_color` (`TEXT DEFAULT '#2563eb'`)

### 2.3. Supeditación de Sucursales a Marcas (`public.restaurants`)
* `brand_id` (`UUID REFERENCES public.organization_brands(id) ON DELETE SET NULL`)
* `business_type` (`TEXT NOT NULL DEFAULT 'restaurant'`)

---

## 3. Componentes Implementados

* [`NewOrganizationModal.tsx`](file:///c:/Users/Mickey/Documents/DEV/Google%20Rese%C3%B1as/src/components/admin/NewOrganizationModal.tsx): Asistente guiado de 3 pasos (`1. Organización & Fiscal` -> `2. Añadir Marca & Giro` -> `3. Añadir Sucursal`) con recorte automático de logo en `<canvas>` `256×256 px` y desplegable de giros con buscador y botón **`+ Dar de alta giro`**.
* [`RestaurantFormModal.tsx`](file:///c:/Users/Mickey/Documents/DEV/Google%20Rese%C3%B1as/src/components/admin/RestaurantFormModal.tsx): Selector de organización y marca registrada, buscador universal de giros y switch interactivo para la modalidad de anuncios.
* [`AdminRestaurantsPage.tsx`](file:///c:/Users/Mickey/Documents/DEV/Google%20Rese%C3%B1as/src/pages/AdminRestaurantsPage.tsx) y [`restaurants_bento.ts`](file:///c:/Users/Mickey/Documents/DEV/Google%20Rese%C3%B1as/src/lib/restaurants_bento.ts): Botón superior **`Dar de Alta Organización`** y tabla jerárquica en árbol con niveles `Organización Matriz -> Marca Comercial -> Sucursal Física -> Panel de Control Operativo`.
