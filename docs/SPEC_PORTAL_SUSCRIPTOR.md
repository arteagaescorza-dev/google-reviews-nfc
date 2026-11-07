# Especificación Técnica: Portal del Suscriptor (Dueño del Local)

**Documento:** `docs/SPEC_PORTAL_SUSCRIPTOR.md`  
**Estado:** Aprobado vía `/grill-me`  
**Objetivo:** Desarrollar el portal móvil y de escritorio dedicado para que los clientes suscriptores gestionen sus quejas privadas, midan el retorno de su inversión y administren sus enlaces de Linktree.

---

## 1. Arquitectura de Acceso y Rutas

- **Ruta del Portal:** `/portal`
- **Ruta de Inicio de Sesión:** `/portal/login`
- **Diseño:** Responsive ergonómico con Bento Grid Light (`bg-slate-50`), Mobile-First táctil en smartphones y Sidebar expandible en pantallas de escritorio.
- **Aislamiento Multi-Tenant:**
  - El usuario autenticado está vinculado a un `organization_id` en Supabase Auth (`raw_user_meta_data->>'organization_id'`).
  - Solo puede consultar y actualizar datos correspondientes a su propia organización.
  - El Superadmin gestiona los usuarios desde `/admin` y dispone de un botón *"Copiar credenciales de acceso"* para enviárselas por WhatsApp.

---

## 2. Soporte Multi-Sucursal

- Si la organización tiene **1 sola sucursal**, la interfaz omite el selector y muestra directamente los datos del local.
- Si la organización tiene **2 o más sucursales**, se despliega un selector dinámico en la cabecera / barra lateral:
  - Opción *"Todas las sucursales"* (vista consolidada).
  - Opción para filtrar por sucursal específica (ej. *"Sucursal Centro"*, *"Sucursal Norte"*).
  - Botón para registrar o solicitar nueva sucursal (`+ Sucursal`).

---

## 3. Métricas de Retención y Valor (Encabezado)

Tarjetas KPI prominentes en la parte superior:
1. **Malas Reseñas Evitadas:** Contador de opiniones de 1 a 3 estrellas contenidas internamente antes de llegar a Google Maps.
2. **Clientes Enviados a Google:** Total de comensales que calificaron 4 o 5 estrellas y fueron redirigidos a la ficha oficial.
3. **Total de Escaneos del Mes:** Volumen de interacción general de los tags NFC y códigos QR.
4. **Mesa Más Activa:** Identificador de la mesa con mayor número de interacciones.

---

## 4. Buzón de Quejas Proactivo (1 a 3 Estrellas)

- Lista cronológica filtrable por estado: `Pendientes`, `Contactados`, `Resueltos`.
- Tarjeta de detalle por comensal:
  - Calificación en estrellas (1, 2 o 3).
  - Nombre del comensal.
  - Teléfono / WhatsApp.
  - Mesa donde estuvo ubicado (`table_identifier`).
  - Comentario / motivo de la inconformidad.
  - Fecha y hora exacta.
- **Herramientas de acción:**
  - **Botón directo de WhatsApp:** Abre chat con mensaje precargado de disculpa y atención personalizada.
  - **Selector de Estado:** Permite cambiar entre `Pendiente`, `Contactado` y `Resuelto`.
  - **Notas Internas de Gerencia:** Campo de texto privado para que el restaurante documente qué acuerdo se tomó (ej. *"Se le regaló un postre de cortesía para su próxima visita"*).

---

## 5. Autonomía Controlada (Edición de Linktree)

- Pestaña o sección de **"Mis Accesos & Redes"**:
  - El dueño puede modificar títulos y destinos de sus botones (Menú Digital en PDF, Instagram, Facebook, WhatsApp, etc.).
  - Configuración simplificada de Wi-Fi Clientes (Red y Contraseña).
- **Protección de negocio:**
  - El enlace oficial de Google Reviews queda bloqueado para el dueño (solo editable por el Superadmin).
  - La selección de paquete (Tier 1, 2 o 3) y el estado Ad-Free quedan restringidos a Superadmin.

---

## 6. Distribución de Pantalla para Escritorio (Desktop Layout Bento Light - POL-008)

Homologado con la ergonomía del panel de Superadministrador (`AdminLayout.tsx`):
- **Barra Lateral Izquierda Fija (`h-screen sticky top-0 bg-white border-r border-slate-200/90 shadow-xs z-30`)**:
  - Estado colapsado inicial de 80px (`w-20`) para maximizar el espacio de trabajo.
  - Expandible a 256px (`w-64`) de forma reactiva al pasar el cursor (`isHovered`) o mediante botón pin fijo (`isCollapsed`).
  - **Portal del Dueño (`PortalSidebar.tsx`)**:
    - Cabecera con isotipo de la marca/organización y pastilla de plan.
    - Selector dinámico de sucursales con botón rápido de `+ Sucursal`.
    - Pestañas maestras: *Buzón de Quejas* (con pastilla numérica en tiempo real), *Enlaces & QR de Mesa*, *Métricas & Analítica*, *Mi Cuenta & Equipo*.
    - Pie con acceso a Vista Comensal, cuenta del propietario y botón de Cerrar Sesión.
  - **Portal del Gerente (`PortalManagerSidebar.tsx`)**:
    - Cabecera con insignia operativa (`Gerente de Tienda` / `Capitán de Piso`) y sucursal asignada.
    - Las 4 funciones operativas: *Personal & Estaciones KDS*, *Turnos a 2 Meses*, *Cortes & Métricas Dueño*, *Quejas & Cupones con Límite Mensual*.
    - Accesos rápidos a terminales de piso: Hostess, Mesero, KDS Cocina & Barra, Pick Up.
    - Acciones rápidas de *Carta & Menú Digital* (86 agotados) y sincronización de datos.
    - Pie con botón de regreso al Portal del Dueño y salida del turno.
- **Área de Trabajo Bento Grid (`flex-1 min-w-0 bg-slate-50 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto`)**:
  - Aprovechamiento fluido del ancho completo del monitor sin columnas angostas móviles.
- **Mantenimiento Móvil Responsivo (`md:hidden`)**:
  - En smartphones y tablets se preserva el encabezado superior compacto y la barra de navegación táctil inferior (`PortalBottomNav.tsx`) en el Portal del Dueño, y la botonera de 4 tarjetas táctiles en el Portal del Gerente.

---

## 7. Acceso Universal Inteligente y Motor Realtime WebSockets (POL-008 & SaaS Multi-Tenant)

- **Punto de Entrada Universal (`/#/login` y `/#/acceso`)**:
  - Unifica los accesos dispersos (`/admin/login`, `/portal/login`, terminales de piso) en una sola vista Bento Light.
  - Pestaña **"Acceso Administrativo"** para directivos (correo y contraseña) con detección de rol (Superadmin a `/#/admin`, Propietario a `/#/portal`).
  - Pestaña **"Terminal con PIN"** para personal operativo con teclado numérico táctil de 4 dígitos y selector de sucursal persistente en el dispositivo (`localStorage.nfc_enrolled_branch_id`).
  - Enrutamiento directo automático por rol:
    - `waiter` -> `/#/portal/mesero`
    - `kitchen` / `barista` -> `/#/portal/cocina`
    - `hostess` -> `/#/portal/hostess`
    - `cashier` -> `/#/portal/pickup`
    - `manager` / `capitan_piso` -> `/#/portal/gerente`
  - Botón de *"Cambiar Turno"* en todas las terminales de sala y cocina que regresa ágilmente a `/#/login?type=staff&branch={id}` para el siguiente colaborador.
- **Sincronización en Tiempo Real (SaaS Realtime Engine)**:
  - Sustitución de sondeos agresivos (`setInterval` cada 4-5 segundos) por suscripciones WebSockets nativas (`postgres_changes`) en `table_orders`, `table_calls` y `restaurant_staff` (`src/lib/realtimeSubscriptions.ts`).
  - Reducción del 95%+ en consumo de consultas y CPU en PostgreSQL, con latencia inferior a 100 milisegundos.
  - Latido pasivo de respaldo cada 45 segundos para contingencias de Wi-Fi.
  - Micro-indicador Bento Light de estado de conexión (*"En Vivo"* / *"Reconectando..."* / *"Offline"*).


---

## 8. Federación de Food Courts en Plazas Comerciales y Turnero Maestro 4K (POL-008)

- **Modelo de Federación Cross-Organización (`food_court_branches`)**:
  - Permite que la cuenta administradora de una Plaza Comercial vincule sucursales pertenecientes a **organizaciones jurídicas independientes** (franquicias, cadenas o negocios propios) a su área común de comedor, conservando el aislamiento de sus datos privados.
- **Doble Vía de Incorporación de Locatarios**:
  - **Vía A**: Vinculación directa de sucursales ya existentes en la plataforma asignándoles su espacio físico (ej. *Local FC-04*) y mostrador.
  - **Vía B**: Pre-registro de nuevo locatario por contrato de arrendamiento de la plaza con generación de enlace de activación (`fc_invite`).
- **Métricas de Comedor y Auditoría de Renta Variable (`/#/food-court`)**:
  - La administración de la plaza consulta afluencia total de órdenes, tiempos promedio de preparación (SLA), ticket promedio estimado ($ MXN) y facturación bruta estimada por local para el cálculo de su renta variable, con exportación a CSV.
  - **Privacidad estricta**: Costos de insumos, recetas, nóminas y buzón privado de quejas permanecen confidenciales para cada organización locataria.
- **Turnero Maestro 4K con Layout 70/30 (`/#/turnero-plaza`)**:
  - **70% Izquierda**: Columnas en tiempo real (*"Listo para Recoger"* y *"En Preparación"*) con timbre acústico, síntesis de voz (*"Orden 382 de La Parrilla de Don Carlos, en Barra 1"*) y retiro automático configurable (3 min por defecto).
  - **30% Derecha**: Columna vertical permanente dedicada a nuestra red publicitaria local (`ads`), con rotación automática configurable (20 seg por defecto), código QR de pasaporte digital y contabilización automática de impresiones.
