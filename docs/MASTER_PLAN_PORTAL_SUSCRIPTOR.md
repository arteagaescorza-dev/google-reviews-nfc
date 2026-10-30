# Plan Maestro de Implementación: Portal del Suscriptor & Reglas de Negocio

**Documento:** `docs/MASTER_PLAN_PORTAL_SUSCRIPTOR.md`  
**Rama activa:** `pantalla-de-dueno-de-local`  
**Estado:** Aprobado por el usuario  
**Fecha:** Octubre 2026  

---

## 1. Regla de Fallback para Cuentas Canceladas o Pausadas

- **Comportamiento Operativo de los Tags Físicos:**  
  Si un restaurante cancela su suscripción, cae en mora o pausa su cuenta:
  - **Los tags NFC y códigos QR físicos en las mesas NO se borran ni muestran pantallas de error o suspensión.**
  - **Degradación a Redirección Directa a Google Maps:** El comensal que escanee el tag es redirigido inmediata y directamente a la URL oficial de Google Reseñas (`google_review_url`).
  - **Pérdida de Valor de Software:** Pierde el filtro de reputación (las malas opiniones de 1 a 3 estrellas ya no se contienen en el buzón privado y van directo a dañar la reputación pública en Google Maps), pierde los botones de Linktree y pierde soporte.
  - **Motivación comercial:** Esta regla asegura que el comensal nunca experimente un tag roto, pero incentiva al dueño a mantener su suscripción activa para no perder su escudo protector.

---

## 2. Flujo de Inbox Zero en Buzón de Quejas

- **Vista Predeterminada:** Filtro `Pendientes` (las que requieren atención inmediata en el piso de venta).
- **Acción al Resolver:** Al cambiar el estado a `🟢 Resuelto`, la queja desaparece de la vista activa de pendientes con una notificación visual y queda archivada en la pestaña `Resueltas` para auditoría y consulta histórica.
- **Acción Directa de Contacto:** Botón de WhatsApp integrado que genera automáticamente el mensaje personalizado de atención y disculpa hacia el comensal.

---

## 3. Pestaña 4: "Mi Cuenta & Equipo" (`/portal/cuenta`)

La interfaz del portal integra una cuarta pestaña accesible desde el menú inferior móvil y el encabezado de escritorio:

### Bloques de Contenido:
1. **Perfil del Negocio:**
   - Nombre de la Organización / Razón social.
   - Teléfono del Gerente (para recepción de alertas).
   - Logotipo y color de marca.
2. **Gestión de Equipo & Gerentes:**
   - Listado de usuarios con acceso a la organización.
   - Botón `+ Invitar Gerente`: Formulario para registrar correo, contraseña provisional y asignar sucursal específica con rol `manager`.
3. **Datos de Facturación Fiscal:**
   - Razón Social.
   - RFC / CIF / Tax ID.
   - Régimen Fiscal y Código Postal Fiscal.
   - Correo electrónico de recepción de facturas (CFDI / Recibos).
   - Método de pago recurrente asociado.
4. **Estado de Suscripción & Upsell Ad-Free:**
   - Nivel de servicio contratado (Tier 1, Tier 2 o Tier 3).
   - Estado de anuncios: *Con Anuncios* o *Marca Blanca (Ad-Free)*.
   - Botón *"Eliminar Anuncios"* que redirige al flujo de checkout de Ad-Free.
5. **Zona de Peligro (Cancelación):**
   - Botón *"Cancelar Suscripción y Pausar Servicio"*.
   - Modal de confirmación solicitando contraseña de seguridad.
   - Ejecuta la regla de fallback descrita en el punto 1.

---

## 4. Expansión: Solicitud de Nuevas Sucursales y Tags Extra

- **Ubicación:** Integrado en el selector de sucursales del encabezado y en la pestaña de Cuenta: botón **`+ Solicitar Nueva Sucursal`**.
- **Flujo Guiado:**
  1. El cliente especifica el nombre de la nueva sucursal, dirección física y enlace de Google Maps de la nueva unidad.
  2. Indica cuántas mesas / tags NFC físicos requerirá.
  3. Al enviar, la solicitud se registra en el panel del Superadmin (`/admin`), quien aprueba la expansión, realiza el cobro del setup y asigna el nuevo lote de tags.

---

## 5. Analítica Comparativa por Sucursal y Ponderado por Cadena

La pestaña de **Métricas** se expande para soportar análisis gerencial multi-sucursal:

### Nivel 1: Métricas Consolidadas de Cadena (Ponderado Global)
- **Escaneos Totales Acumulados** en todas las unidades.
- **Índice Ponderado de Satisfacción de la Marca (%):**  
  Calculado como `(Total Clientes a Google / Total Escaneos) * 100`.
- **Total de Malas Reseñas Prevenidas** en toda la cadena gastronómica.

### Nivel 2: Tabla / Grid Comparativo entre Sucursales
- Ranking de sucursales ordenadas por tasa de satisfacción.
- Columnas comparativas:
  - Nombre de la Sucursal.
  - Total de Escaneos.
  - Clientes a Google (4-5 ⭐).
  - Quejas contenidas (1-3 ⭐).
  - Semáforo de salud: `Excelente (>90%)`, `Normal (80-89%)`, `Alerta (<80%)`.

---

## 6. Módulo de Pauta Publicitaria y Checkout de Anuncios

### Secciones y Acciones:
1. **Eliminar Publicidad de mis Mesas (Ad-Free):**  
   Paso directo al Checkout de Marca Blanca (\$X/mes por sucursal).
2. **Promocionar mi Negocio en la Red de Restaurantes Aliados:**  
   Asistente de configuración de campaña de 3 pasos:
   - **Paso 1: Parámetros:** Título promocional, enlace de destino (WhatsApp / Instagram / Web) y radio de alcance geográfico.
   - **Paso 2: Subida de Creatividad:**
     - **Card / Banner Inferior (`bottom_banner`):** 16:9 o 3:1 (1200 × 628 px o 600 × 200 px, máx. 500 KB, formato WebP/JPG).
     - **Interstitial / Bienvenida (`interstitial`):** 9:16 vertical (1080 × 1920 px, máx. 1 MB, formato WebP/JPG).
   - **Paso 3: Checkout de Pauta:** Selección de paquete de impresiones y pago con tarjeta, enviando la campaña a `/admin/ads` con estado `Pendiente de Aprobación`.
