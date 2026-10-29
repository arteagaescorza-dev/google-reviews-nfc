# Especificación Técnica: Portal del Suscriptor (Dueño del Local)

**Documento:** `docs/SPEC_PORTAL_SUSCRIPTOR.md`  
**Estado:** Aprobado vía `/grill-me`  
**Objetivo:** Desarrollar el portal móvil (PWA-ready) dedicado para que los clientes suscriptores gestionen sus quejas privadas, midan el retorno de su inversión y administren sus enlaces de Linktree.

---

## 1. Arquitectura de Acceso y Rutas

- **Ruta del Portal:** `/portal`
- **Ruta de Inicio de Sesión:** `/portal/login`
- **Diseño:** Mobile-First con layout limpio estilo App nativa (PWA-ready), operable a una sola mano desde el piso de ventas.
- **Aislamiento Multi-Tenant:**
  - El usuario autenticado está vinculado a un `organization_id` en Supabase Auth (`raw_user_meta_data->>'organization_id'`).
  - Solo puede consultar y actualizar datos correspondientes a su propia organización.
  - El Superadmin gestiona los usuarios desde `/admin` y dispone de un botón *"Copiar credenciales de acceso"* para enviárselas por WhatsApp.

---

## 2. Soporte Multi-Sucursal

- Si la organización tiene **1 sola sucursal**, la interfaz omite el selector y muestra directamente los datos del local.
- Si la organización tiene **2 o más sucursales**, se despliega un selector dinámico en el encabezado:
  - Opción *"Todas las sucursales"* (vista consolidada).
  - Opción para filtrar por sucursal específica (ej. *"Sucursal Centro"*, *"Sucursal Norte"*).

---

## 3. Métricas de Retención y Valor (Encabezado)

Tarjetas KPI prominentes en la parte superior:
1. **🛡️ Malas Reseñas Evitadas:** Contador de opiniones de 1 a 3 estrellas contenidas internamente antes de llegar a Google Maps.
2. **⭐ Clientes Enviados a Google:** Total de comensales que calificaron 4 o 5 estrellas y fueron redirigidos a la ficha oficial.
3. **📱 Total de Escaneos del Mes:** Volumen de interacción general de los tags NFC y códigos QR.
4. **📍 Mesa Más Activa:** Identificador de la mesa con mayor número de interacciones.

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
