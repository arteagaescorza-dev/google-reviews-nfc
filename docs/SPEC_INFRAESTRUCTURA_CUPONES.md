---
id: SPEC-006
titulo: Infraestructura de Cupones, Entrega de Leads, Reactivación y Pasaporte Multi-Cupón (Web PWA & Wallet)
categoria: especificacion
estado: preaprobado
fecha_creacion: 2026-10-29
fecha_actualizacion: 2026-10-30
autores: [Mickey, Antigravity]
tags: [cupones, vouchers, anunciantes, comensales, atribucion, roi, privacidad, leads, apple-wallet, google-wallet, pwa, pasaporte]
---

# 🎟️ SPEC-006: Infraestructura de Cupones, Entrega de Leads y Pasaporte Multi-Cupón

## 1. Resumen Ejecutivo & Propósito

Para cerrar el ciclo de la Red Publicitaria y garantizar que cada peso invertido por el anunciante demuestre un retorno financiero real, este documento especifica:
1. El mecanismo de **emisión y entrega** del cupón digital al comensal en mesa (cero fricción).
2. El candado de **un solo uso (Single-Use)** para evitar fraudes en punto de venta.
3. El módulo de **validación y canje** para el personal de recepción o caja del anunciante (`/#/canjear`).
4. La configuración de **privacidad de ingresos** (campo opcional de ticket de venta con cálculo de ROI).
5. Los canales de **traspaso de leads en tiempo real** al anunciante (Vía 1 y Vía 2 preaprobadas; Vía 3 en Deuda Técnica DT-08).
6. La **estrategia de dos fases del Pasaporte Multi-Cupón**:
   * **Fase 1 (Inmediata / Cero Dependencias):** Pasaporte Web PWA + Respaldo en WhatsApp + Descarga PNG.
   * **Fase 2 (Evolución Futura):** Integración nativa de Apple Wallet (`.pkpass`) y Google Wallet API (Deuda Técnica DT-09).

---

## 2. ¿Cómo recibe el comensal su cupón en mesa? (Cero Fricción)

El comensal está en su teléfono tras haber tocado el tag NFC en mesa. Para no matar la conversión, **no se le obliga a llenar formularios largos ni a crear contraseñas**.

```mermaid
flowchart TD
    A["📱 Comensal ve Banner en Mesa"] -->|"Toca 'Obtener Beneficio'"| B["⚡ Modal: Nombre + WhatsApp (3 segundos)"]
    B --> C["Despliega:<br/>• Código Único (ej: FIT-892)<br/>• Código QR Dinámico<br/>• Vigencia (ej: 7 días)"]
    
    C --> D1["Vía 1: '📲 Canjear / Guardar por WhatsApp'<br/>Abre chat con el Anunciante dejando constancia"]
    C --> D2["Vía 2: '📸 Guardar en Galería'<br/>Descarga tarjeta PNG con QR a sus fotos"]
    C --> D3["Vía 3: '🎟️ Pasaporte Web PWA'<br/>Tarjeta web interactiva 'Guardar en Pantalla de Inicio'"]
    C --> D4["Vía 4: '🔔 Memoria Local'<br/>Si vuelve al restaurante, una alerta le recuerda su cupón"]
```

---

## 3. Modelo de Datos & Candado Antifraude (Un solo uso)

### 3.1. Tabla en PostgreSQL (`coupons`)
```sql
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    tag_code TEXT,
    customer_phone TEXT,                               -- Teléfono verificado (Lead calificado)
    customer_name TEXT,                                -- Nombre del comensal
    coupon_code TEXT UNIQUE NOT NULL,                  -- Ej: "FIT-892" (Clave única)
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
    ticket_amount NUMERIC(10, 2) DEFAULT NULL,         -- Monto cobrado en venta (opcional según ajustes)
    redeemed_at TIMESTAMPTZ DEFAULT NULL,
    redeemed_by UUID DEFAULT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_coupons_ad ON coupons(ad_id);
```

### 3.2. Función Transaccional de Canje Único (`redeem_coupon`)
Para evitar que una captura de pantalla se comparta entre varios clientes, el canje se procesa con un bloqueo atómico (`FOR UPDATE`):
* Si el cupón ya tiene `status = 'redeemed'`, la base de datos aborta la transacción y devuelve:
  `{ success: false, error: 'CUPON_YA_CANJEADO', redeemed_at: '2026-10-30T15:20:00Z' }`.
* **Garantía matemática:** El cupón solo puede pasar de `active` a `redeemed` exactamente una vez en toda su vida útil.

---

## 4. Ajustes de Privacidad del Anunciante: Control de Registro de Ventas (ROI)

En los ajustes de perfil del cliente anunciante (`Ajustes de Campaña / Privacidad`), existirá un interruptor de configuración:

```text
[X] Registrar monto de venta al canjear cupón (Cálculo de ROI exacto)
    Si activas esta opción, tu personal de caja deberá ingresar el monto
    cobrado al validar cada cupón para calcular tu retorno de inversión
    en dinero. Si la desactivas, protegemos la confidencialidad de tus 
    ventas y solo mediremos cupones canjeados.
```

* **Si está ACTIVADA (`track_ticket_revenue = true`):** El campo `Monto de la Venta ($ MXN)` es obligatorio en la pantalla de canje y se genera la métrica de **ROI financiero**.
* **Si está DESACTIVADA (`track_ticket_revenue = false`):** El campo **desaparece por completo** de la pantalla de la recepcionista y el canje se realiza con un solo toque (`[ Quemar Cupón ]`), protegiendo la confidencialidad de ingresos del negocio.

---

## 5. Canales de Traspaso de Leads al Anunciante (Preaprobados)

Para que el negocio patrocinador pueda convertir comensales en clientes de pago, se habilitan dos canales directos:

### 🟢 Vía 1: Bandeja de Leads en su Portal (`/#/portal-anunciante/leads`)
* **CRM Ligero Integrado:** Tabla en tiempo real con fecha, teléfono del comensal, sucursal de procedencia, código de cupón y vigencia.
* **Botón 1-Clic de WhatsApp:** Al tocar `[ 💬 Contactar ]`, se abre WhatsApp Web o móvil con mensaje pre-redactado para agendar al prospecto de inmediato.

### 🟢 Vía 2: Alerta Instantánea al Celular del Vendedor (Venta en Caliente)
* En cuanto el comensal solicita el beneficio en mesa, el sistema dispara un mensaje de WhatsApp directo al encargado de ventas del anunciante con los datos del prospecto para cerrar la venta en los primeros 15 minutos.

> [!NOTE]
> **Vía 3 (Descarga Masiva CSV/Excel y Webhooks CRM):** Se cataloga formalmente en el inventario de **Deuda Técnica (`DT-08`)** para su desarrollo en la fase de integraciones corporativas.

---

## 6. Estrategias de Reactivación de Cupones (Preaprobadas)

Para asegurar que el comensal no olvide su cupón tras salir del restaurante:

1. **Recordatorio Automatizado por WhatsApp (Estrategia 1):**  
   Disparo programado 48 horas antes de expirar con la dirección en Google Maps del anunciante y su código de canje (Canal principal con 98% de tasa de apertura).
2. **Alertas Nativas de Billetera (Estrategia 2):**  
   Notificación en pantalla de bloqueo 24 horas antes de vencer o al pasar físicamente cerca del establecimiento del anunciante (cuando se active la Fase 2 de Wallet nativo).

---

## 7. Plan de Madurez del Pasaporte Multi-Cupón: Fase 1 vs. Fase 2

Para garantizar que el negocio arranque de inmediato sin depender de aprobaciones de Apple ni pagos de certificados:

```mermaid
flowchart TD
    subgraph Fase1 ["🟢 FASE 1: INMEDIATA (Preaprobada / Cero Dependencias)"]
        A1["📱 Pasaporte Digital Web PWA (/#/pasaporte)"]
        A2["💬 Respaldo y Recordatorios vía WhatsApp Business"]
        A3["📸 Guardado Offline en Galería (Imagen PNG con QR)"]
        A4["💎 100% de los Datos (Nombre, WhatsApp, Hábitos) capturados en Supabase"]
        A1 --> A4
        A2 --> A4
        A3 --> A4
    end

    subgraph Fase2 ["🚀 FASE 2: EVOLUCIÓN (Deuda Técnica DT-09)"]
        B1["🍏 Certificado Apple Developer & Empaquetador .pkpass"]
        B2["🤖 Google Wallet Issuer Account & JWT API"]
        B3["📍 Geocercas GPS en Pantalla de Bloqueo"]
        A4 -.->|"Migración transparente de la base existente"| B1
        A4 -.->|"Migración transparente de la base existente"| B2
    end
```

### 7.1. Fase 1: Pasaporte Web PWA + WhatsApp (Lista para Operar)
* **Pasaporte Digital Web (`/#/pasaporte?id=...`):**  
  Una tarjeta web con diseño responsivo premium que centraliza todos los cupones activos del usuario. Cuenta con la opción nativa de navegación móvil: *"Guardar en Pantalla de Inicio"*, creando un ícono de acceso directo en el escritorio del teléfono sin pasar por la App Store.
* **Respaldo Infalible en WhatsApp:**  
  Cada cupón emitido se envía a la conversación personal del usuario con enlaces directos a Google Maps y fechas de expiración.
* **Descarga de Gráfico Offline:**  
  Generación local con Canvas HTML5 para guardar el cupón como imagen en el carrete de fotos del teléfono.

### 7.2. Fase 2: Pasaporte Nativo Apple Wallet & Google Wallet (Futura)
* Se implementará un microservicio backend para firmar y distribuir archivos `.pkpass` para iOS y objetos de pase vía Google Wallet API.
* Permitirá notificaciones silenciosas vía APNs y geocercas automáticas por proximidad física (hasta 10 locales por pase).
* **Catálogo:** Registrado formalmente como ítem **`DT-09`** en la matriz de deuda técnica.

---

## 8. Activo de Datos (First-Party Data) & Vías de Explotación Comercial

Al emitir el Pasaporte (sea Web en Fase 1 o Wallet en Fase 2), la plataforma captura y monetiza:
1. **Identidad Directa:** Nombre y número de WhatsApp verificado.
2. **Hábitos Reales de Consumo:** Restaurantes visitados, frecuencia, horarios y ticket promedio inferido por zona geográfica.
3. **Pauta Premium a Marcas:** Comercialización de audiencias de alto poder adquisitivo hacia marcas y patrocinadores locales.
4. **Red de Afiliación de Restaurantes:** Capacidad de ofrecer a nuevos locales tráfico garantizado de miles de comensales ya integrados a la red.

---

## 9. Estado del Documento & Aprobación

* **Estado:** `PREAPROBADO` (Aprobado formalmente por Mickey).
* **Deuda Técnica Vinculada:**
  * `DT-08`: Exportación Masiva CSV/Excel y Webhooks CRM para Anunciantes.
  * `DT-09`: Integración de Apple Wallet (`.pkpass`) y Google Wallet API.
