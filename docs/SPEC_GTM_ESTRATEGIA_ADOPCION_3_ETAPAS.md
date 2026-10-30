---
id: SPEC-011
titulo: Estrategia de Despliegue GTM en 3 Etapas (Caballo de Troya Físico y Activación Autónoma)
categoria: especificacion
estado: preaprobado
fecha_creacion: 2026-10-30
autores: [Mickey, Antigravity]
tags: [gtm, go-to-market, 3-etapas, caballo-de-troya, siembra-territorio, rollout, activacion-autonoma]
---

# 🎯 SPEC-011: Estrategia de Despliegue GTM en 3 Etapas

## 1. Resumen Ejecutivo & Filosofía de Siembra

El éxito de la plataforma depende de una **ejecución comercial por fases estrictas**. No se intenta vender un sistema complejo el primer día. Se utiliza una estrategia de siembra en 3 etapas diseñada para capturar territorio físico, generar confianza y monetizar de forma 100% autónoma desde la aplicación.

```mermaid
flowchart LR
    subgraph E1 ["📍 ETAPA 1: Siembra Física (Visita 1)"]
        A1["Venta de tags NFC en frío a $100 c/u"]
        A2["Meta: 100 locales en la zona (Restaurantes)"]
        A3["Solo enlace directo a Google Maps"]
        A4["🚫 RED DE ANUNCIOS DORMIDA (0% Ads)"]
        A1 --> A2 --> A3 --> A4
    end

    subgraph E2 ["📱 ETAPA 2: Activación App (Visita 2)"]
        B1["Alta de perfil del dueño en la app"]
        B2["Caballo de Troya Software:"]
        B3["Filtro de Quejas (1-3) 100% GRATIS"]
        B4["El dueño ve los niveles en su portal"]
        B1 --> B2 --> B3 --> B4
    end

    subgraph E3 ["⚡ ETAPA 3: Monetización Autónoma (Cero Visita 3)"]
        C1["Todo ocurre dentro de la app"]
        C2["Menú y Linktree por suscripción pequeña"]
        C3["🚀 NACE LA RED DE ANUNCIOS:"]
        C4["• Opción de eliminar ads (Ad-Free)<br/>• Opción de pautar anuncios"]
        C1 --> C2 --> C3 --> C4
    end

    E1 -->|"Una vez sembrados los 100 locales"| E2
    E2 -->|"Por uso y notificaciones in-app"| E3
```

---

## 2. Detalle Operativo de las 3 Etapas

### 📍 Etapa 1: "Penetración de Territorio en Frío" (El Caballo de Troya Físico)
* **Objetivo:** Adueñarse de las mesas físicas de la zona geográfica hasta alcanzar **100 locales afiliados** (enfocado 100% en restaurantes inicialmente).
* **Acción en Calle (Visita 1):**  
  * Venta en frío de las placas NFC a **$100 MXN cada una**.
  * Cero contratos, cero suscripciones, cero contraseñas en esta visita.
  * *Argumento:* *"Tu cliente acerca el celular y se abre de inmediato tu Google Maps para dejarte 5 estrellas"*.
* **Captura de Inteligencia de Mickey:**  
  * Nombre del restaurante, sucursal, WhatsApp del dueño/encargado y enlace de Google Reviews.
* **Regla Técnica en Sistema:**  
  * **La Red de Anuncios permanece DORMIDA (Apagada):** Durante las primeras semanas, ningún comensal ve publicidad de terceros. El resolvedor redirige en 1 segundo directo a Google Maps sin banners ni fricciones para ganarse la confianza absoluta del locatario.

---

### 📱 Etapa 2: "Activación Digital en Segunda Visita" (El Segundo Caballo de Troya)
* **Objetivo:** Convertir el hardware físico instalado en usuarios activos del portal móvil (`/#/portal`).
* **Acción en Calle (Visita 2):**  
  * Se visita nuevamente al locatario que ya vio comensales tocando la placa.
  * Se le entrega su acceso al portal: *"Te dimos de alta tu perfil en la app para que veas tus métricas"*.
* **El Gancho Irresistible (Caballo de Troya de Software):**  
  * Se le activa el **Filtro Inteligente de Reseñas 100% GRATIS**:  
    *"Como cliente fundador, te regalamos el filtro: si alguien califica con 1 a 3 estrellas, no va a Google; te llega directo a tu celular para que no te quemen públicamente"*.
* **El Semillero de Upgrades:**  
  * Al ingresar a su portal, el dueño descubre visualmente los niveles superiores que la plataforma ofrece.

---

### ⚡ Etapa 3: "Monetización Autónoma In-App" (Cero Tercera Visita)
* **Objetivo:** Cobro recurrente mensual y encendido oficial de la Red de Publicidad.
* **Regla Invariante:** **YA NO EXISTE TERCERA VISITA PRESENCIAL.** Mickey no vuelve a gastar tiempo en la calle con ese cliente. Todo el ciclo comercial se gestiona autónomamente por medio de la app:
  * **Upgrades de Software:** Notificaciones dentro del portal para desbloquear la gestión de **Menú Digital / Linktree y WiFi Zero-Password** mediante una suscripción mensual pequeña.
  * **Encendido de la Red de Anuncios:**  
    * Una vez que los 100 locales están usando la app, se enciende el inventario publicitario.
    * **Opción Ad-Free:** El locatario puede pagar su cuota para eliminar anuncios de terceros en sus mesas.
    * **Opción de Pauta:** El locatario puede comprar pauta para anunciarse en los otros 99 restaurantes de la zona.

---

## 3. Impacto en la Arquitectura de Software

1. **Interruptor Global de Red Publicitaria (`ads_network_enabled`):**
   * Configurable desde el Superadmin. En la Etapa 1 permanece en `false`, garantizando que ningún restaurante sembrado muestre anuncios hasta que Mickey decida el momento del lanzamiento oficial.
2. **Onboarding Rápido en Superadmin:**
   * Capacidad de registrar un restaurante y sus 10 placas en menos de 60 segundos durante la Visita 1.
3. **Invitación de 1-Clic para la Visita 2:**
   * Mensaje de WhatsApp pre-configurado para enviarle sus accesos y activar su filtro gratuito.

---

## 4. Estado de Aprobación & Registro

* **Estado:** `PREAPROBADO` (Aprobado formalmente por Mickey como la hoja de ruta oficial del proyecto).
