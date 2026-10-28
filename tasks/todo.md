# Lista de Tareas de Implementación: NFC Google Reseñas & Red de Anuncios

**Archivo:** `tasks/todo.md`  
**Referencia:** [plan.md](file:///c:/Users/Mickey/Documents/DEV/Google%20Reseñas/tasks/plan.md) | [SPEC.md](file:///c:/Users/Mickey/Documents/DEV/Google%20Reseñas/docs/SPEC.md)  

---

## Fase 1: Cimientos, Base de Datos y Scaffolding

- [x] **Tarea 1.1: Inicializar el proyecto con Vite, React, TypeScript y Tailwind CSS**
  - **Aceptación:** Proyecto estructurado con todas las dependencias (`lucide-react`, `react-router-dom`, `@supabase/supabase-js`, `qrcode.react`, `clsx`, `tailwind-merge`), Vite configurado con base relativa para GitHub Pages, y TypeScript estricto.
  - **Verificación:** Ejecutar `npm run build` sin errores y verificar que `dist/index.html` se genere limpiamente.
  - **Archivos:** `package.json`, `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`, `index.html`, `src/index.css`.

- [x] **Tarea 1.2: Definir tipos TypeScript y utilidades compartidas**
  - **Aceptación:** Interfaces completas para `Organization`, `Restaurant`, `Tag`, `Ad`, `Feedback`, `TierType` y helpers para clases CSS y normalización de URLs.
  - **Verificación:** `npx tsc --noEmit` ejecuta sin errores de compilación de tipos.
  - **Archivos:** `src/types/index.ts`, `src/lib/utils.ts`, `src/lib/constants.ts`.

- [x] **Tarea 1.3: Script SQL para Supabase (Schema, RLS y Datos de Prueba)**
  - **Aceptación:** Archivo SQL listo para ejecutar en el panel de Supabase que crea las tablas `organizations`, `restaurants`, `tags`, `ads`, `feedback`, `tag_scans`, con índices, claves foráneas, políticas de seguridad RLS y datos iniciales de prueba (seed).
  - **Verificación:** Revisión de sintaxis SQL y prueba de importación en el SQL Editor de Supabase.
  - **Archivos:** `supabase/schema.sql`, `supabase/seed.sql`, `.env.example`, `src/lib/supabase.ts`.

---

## Fase 2: Experiencia del Comensal (NFC Resolver & Public Pages)

- [x] **Tarea 2.1: Sistema de Enrutamiento y Bootstrap de Parámetro `?t=NFC-xxx`**
  - **Aceptación:** Al acceder con `https://.../?t=NFC-001`, la aplicación intercepta el código de tag, consulta Supabase, extrae los datos del restaurante y sucursal asignados y redirige a la vista correspondiente. Si el tag no está asignado o está inactivo, muestra una pantalla amigable de espera.
  - **Verificación:** Probar en navegador con un tag existente y con un tag inexistente comprobando los estados visuales.
  - **Archivos:** `src/App.tsx`, `src/pages/ResolverPage.tsx`, `src/components/client/TagStatusFallback.tsx`.

- [x] **Tarea 2.2: Componente de Banner Publicitario (`AdBanner`)**
  - **Aceptación:** Si el restaurante tiene `is_ad_free = false`, se consulta y renderiza el banner patrocinado (respetando si es general o segmentado al tag/sucursal) con formato elegante en el pie de página, registrando impresiones y abriendo el enlace al hacer clic.
  - **Verificación:** Probar que un restaurante ad-free no muestra anuncios y uno con ads activos muestra el banner con enlace funcional.
  - **Archivos:** `src/components/client/AdBanner.tsx`.

- [x] **Tarea 2.3: Vista Tier 1 - Redirección Directa a Google Reseñas**
  - **Aceptación:** Si el restaurante es Tier 1: si no es ad-free muestra pantalla de transición de 2.5s con cuenta regresiva, logo, spinner, banner y botón "Continuar ahora"; si es ad-free salta inmediatamente a la URL de Google Reseñas.
  - **Verificación:** Probar ambos casos verificando el tiempo de espera y la redirección efectiva.
  - **Archivos:** `src/components/client/DirectRedirect.tsx`.

- [x] **Tarea 2.4: Vista Tier 2 - Filtro de Satisfacción (Review Gating) & Feedback Privado**
  - **Aceptación:** Selector interactivo de 1 a 5 estrellas. Al hacer clic en 4 o 5 estrellas, redirige de inmediato a la URL oficial de Google Reseñas. Al hacer clic en 1, 2 o 3 estrellas, abre el formulario modal de queja privada.
  - **Verificación:** Probar clic en 5 estrellas (abre Google) y clic en 2 estrellas (abre modal de feedback).
  - **Archivos:** `src/components/client/ReviewRating.tsx`, `src/components/client/FeedbackModal.tsx`.

- [x] **Tarea 2.5: Envío y Persistencia del Feedback de Clientes**
  - **Aceptación:** El formulario de queja permite ingresar comentarios, nombre y teléfono opcionales. Al enviar, inserta la fila en Supabase `feedback` y muestra un mensaje cálido de agradecimiento por ayudar a la gerencia a corregir la experiencia.
  - **Verificación:** Enviar un comentario de prueba y comprobar que la fila se inserte correctamente en la tabla `feedback`.
  - **Archivos:** `src/components/client/FeedbackModal.tsx`.

- [x] **Tarea 2.6: Vista Tier 3 - Linktree de Marca (Menú, Redes, WiFi, WhatsApp)**
  - **Aceptación:** Integra el filtro de estrellas en la cabecera y debajo despliega los botones de accesos rápidos configurados en `restaurants.links` con iconos estilizados y color de marca del restaurante.
  - **Verificación:** Validar en vista móvil que los botones de menú y redes sociales se muestren fluidamente y abran en pestaña nueva.
  - **Archivos:** `src/components/client/LinkTreeSection.tsx`.

---

## Fase 3: Autenticación y Shell del Panel de Administración

- [x] **Tarea 3.1: Pantalla de Login de Administrador y Guardián de Rutas**
  - **Aceptación:** Ruta `#/admin/login` con formulario de correo y contraseña conectado a Supabase Auth. Rutas `#/admin/*` protegidas por `AdminAuthGuard` que redirige a login si no hay sesión activa.
  - **Verificación:** Intentar entrar a `#/admin` sin login (debe redirigir), iniciar sesión con usuario válido y verificar persistencia tras recargar.
  - **Archivos:** `src/pages/AdminLoginPage.tsx`, `src/components/admin/AdminAuthGuard.tsx`.

- [x] **Tarea 3.2: Layout Administrativo y Dashboard de Vista General**
  - **Aceptación:** Interfaz de administración responsiva con barra lateral/menú superior (Restaurantes, Tags, Publicidad, Feedback, Cerrar Sesión) y tarjetas de métricas en la pantalla principal (Total Sucursales, Tags Activos, Quejas Totales, Anuncios).
  - **Verificación:** Navegación fluida entre secciones administrativas en pantallas de escritorio y móvil.
  - **Archivos:** `src/components/admin/AdminLayout.tsx`, `src/pages/AdminDashboardPage.tsx`.

---

## Fase 4: Módulos de Gestión Administrativa (CRUD)

- [x] **Tarea 4.1: Módulo de Gestión de Organizaciones y Sucursales**
  - **Aceptación:** Crear, listar, editar y activar/desactivar sucursales. Formulario completo con: Organización, Marca, Nombre de sucursal, URL de Google Reseñas, selector de Tier (1, 2, 3), switch Ad-free, color de marca, logo y editor de botones de Linktree.
  - **Verificación:** Crear una sucursal de prueba y verificar que se refleje inmediatamente en la base de datos y en la lista.
  - **Archivos:** `src/pages/AdminRestaurantsPage.tsx`, `src/components/admin/RestaurantFormModal.tsx`.

- [x] **Tarea 4.2: Módulo de Gestión de Tags NFC y Generador Masivo con QR**
  - **Aceptación:** Listar todos los tags registrados. Herramienta de generación masiva (ej. ingresar prefijo `NFC-` y rango `1` a `50`). Capacidad de asociar un tag a una sucursal y mesa específica. Previsualizador de código QR y botón de descarga en imagen para imprimir en stickers.
  - **Verificación:** Generar un lote de tags, asignar uno a la sucursal de prueba y descargar el QR generado.
  - **Archivos:** `src/pages/AdminTagsPage.tsx`, `src/components/admin/TagBatchModal.tsx`, `src/components/admin/TagQRModal.tsx`.

- [x] **Tarea 4.3: Módulo de Red Publicitaria (Gestión de Anuncios y Segmentación)**
  - **Aceptación:** Crear y editar campañas publicitarias: Título, Nombre del anunciante, URL del banner, URL de destino, tipo de segmentación (Global, Por sucursal seleccionada o Por tag específico) y switch de estado activo/inactivo.
  - **Verificación:** Crear un anuncio segmentado a una sola sucursal y verificar que solo aparezca en los tags de esa sucursal.
  - **Archivos:** `src/pages/AdminAdsPage.tsx`, `src/components/admin/AdFormModal.tsx`.

- [x] **Tarea 4.4: Módulo de Buzón de Quejas y Feedback Privado**
  - **Aceptación:** Tabla visual de comentarios de 1 a 3 estrellas recibidos. Muestra: calificación, texto del cliente, nombre, teléfono, sucursal, mesa y fecha. Permite cambiar el estado de la queja (`new`, `reviewed`, `contacted`) y contactar al cliente por WhatsApp/teléfono con un solo clic.
  - **Verificación:** Abrir una queja de prueba, cambiar su estado a "revisado" y verificar que se actualice en Supabase.
  - **Archivos:** `src/pages/AdminFeedbackPage.tsx`.

---

## Fase 5: Despliegue en GitHub Pages y Documentación de Operación

- [x] **Tarea 5.1: Flujo de Integración y Despliegue Continuo (GitHub Actions)**
  - **Aceptación:** Archivo `.github/workflows/deploy.yml` que compila el frontend en cada push a `main` y lo despliega automáticamente a GitHub Pages sin intervención manual.
  - **Verificación:** Validar sintaxis del workflow y probar build de producción con `npm run build`.
  - **Archivos:** `.github/workflows/deploy.yml`.

- [x] **Tarea 5.2: Manual Operativo y Guía de Puesta en Marcha**
  - **Aceptación:** Documento `docs/GUIA_OPERATIVA.md` explicando paso a paso: cómo conectar Supabase, cómo dar de alta el primer cliente, cómo programar físicamente los tags NFC con apps móviles (como NFC Tools), y cómo comercializar los paquetes y espacios publicitarios.
  - **Verificación:** Lectura y verificación de completitud del manual.
  - **Archivos:** `docs/GUIA_OPERATIVA.md`, `README.md`.
