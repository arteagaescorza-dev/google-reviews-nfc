# Quality & Architectural Constraints

**Proyecto:** Google Reseñas NFC & Red Publicitaria Local  
**Última revisión:** 1 de Noviembre, 2026  
**Estándar:** Constraint-Driven Development (CDD Contract v1.0)

Este documento define la barra mínima de calidad que **ningún agente ni desarrollador puede rebajar**. Cualquier cambio en el código debe satisfacer estas restricciones de forma mecánica antes de considerarse listo para producción.

---

## 1. El Suelo Innegociable (The Floor)

Estas 5 reglas son bloqueantes en cualquier commit o PR:

1. **Compilación Limpia:** `npm run build` (`tsc && vite build`) debe compilar con **código de salida 0**. Cero errores de TypeScript.
2. **Cero Supresiones Silenciosas:** Prohibido agregar directivas `@ts-ignore`, `@ts-nocheck` o `eslint-disable` en rutas críticas de negocio (`src/lib/api.ts`, `src/types/index.ts`, `src/pages/`).
3. **Cero Secretos Expuestos:** Prohibido commitear `service_role_key`, tokens de Stripe o credenciales de backend en código cliente o variables públicas `VITE_*`.
4. **Cero Procesos Zombi:** Prohibido dejar servidores locales (`npm run dev`) en segundo plano consumiendo puertos o memoria tras finalizar una tarea.
5. **Cobertura de RLS al 100%:** Toda tabla creada en PostgreSQL / Supabase debe tener `ENABLE ROW LEVEL SECURITY` y políticas explícitas probadas contra escalación y fuga multi-tenant.

---

## 2. Dimensiones y Presupuestos Forzados (Budgets & Ratchets)

### A. Arquitectura y Composición (Vercel Composition Patterns)
* **Evitar Proliferación de Props Booleanas:** Componentes con más de 2 banderas booleanas de comportamiento (`isX`, `hasY`, `enableZ`) deben refactorizarse a variantes explícitas o Componentes Compuestos (*Compound Components*).
* **Desacoplamiento de Estado:** Los componentes de presentación no deben interactuar directamente con `localStorage` ni realizar llamadas fetch directas; deben consumir un Provider o hook de contexto.
* **Módulos de Dominio:** Ningún archivo de API o servicio debe superar los 500 renglones. El monolito `api.ts` debe modularizarse en adaptadores de dominio (`api/restaurants.ts`, `api/ads.ts`, `api/orders.ts`).

### B. Rendimiento Web (Performance Budgets)
* **Bundle Inicial:** El chunk principal vendor (`vendor-*.js`) no debe superar **180 kB (gzip)**.
* **Bundle Total JS:** La aplicación completa no debe exceder **500 kB (gzip)** en carga inicial.
* **Tiempo de Carga Resolver NFC:** El First Contentful Paint (FCP) en emulación móvil 4G para [`ResolverPage.tsx`](file:///c:/Users/Mickey/Documents/DEV/Google%20Reseñas/src/pages/ResolverPage.tsx) no debe superar **1.8 segundos**.

### C. Experiencia Móvil y Accesibilidad (A11y & Mobile First)
* **Objetivos Táctiles (Tap Targets):** Botones de acción en mesa (llamar mesero, pedir cuenta, calificar) deben medir al menos **44 × 44 px**.
* **Viewport Adaptativo:** La experiencia de comensal y terminal de mesero debe renderizar sin desbordamiento horizontal (*horizontal scrolling*) en anchos de **360px a 430px**.
* **Contraste:** Todo texto sobre fondos de color debe cumplir el ratio WCAG AA (mínimo 4.5:1 para texto normal, 3:1 para texto grande).

### D. Seguridad e Integridad de Datos
* **Sanitización de Redirecciones:** Cualquier URL externa de redirección (`google_review_url`, enlaces de LinkTree, destino de anuncios) debe pasar por `ensureAbsoluteUrl()` y validar estrictamente esquemas `http://` o `https://`.
* **Triggers de Base de Datos para Facturación:** Columnas de monetización (`tier`, `is_ad_free`, `ad_credit_balance`) están protegidas por triggers PostgreSQL contra manipulación de miembros.

---

## 3. Acciones de Bloqueo ante Fallos

| Severidad | Acción ante Fallo |
| :--- | :--- |
| **Fallo en El Suelo** (TypeScript, Build, Secretos) | **Bloqueo Inmediato:** El agente debe corregir el fallo antes de reportar la tarea como completada. |
| **Degradación de Presupuesto** (>180 kB vendor, FCP > 1.8s) | **Alerta Crítica:** Requiere optimización mediante *code-splitting* (`React.lazy`). |
| **Vulnerabilidad RLS o Mass Assignment** | **Bloqueo Inmediato:** Reversión y parche antes de merge en `main`. |

