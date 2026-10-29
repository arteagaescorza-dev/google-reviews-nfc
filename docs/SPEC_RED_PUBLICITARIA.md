# Especificación Técnica: Red Publicitaria Local & Motor de Anuncios

**Documento:** `docs/SPEC_RED_PUBLICITARIA.md`  
**Estado:** Aprobado vía `/grill-me`  
**Objetivo:** Definir la arquitectura, modelo de monetización, formatos de entrega, reglas de exclusión y entrega de métricas para la red publicitaria en mesas con tags NFC.

---

## 1. Modelo de Negocio y Monetización

- **Propósito:** Red de monetización externa basada en comercios locales (gimnasios, clínicas de salud, estética, servicios profesionales, talleres, entretenimiento, etc.).
- **Inventario Publicitario:** Todos los restaurantes afiliados que **no** hayan contratado el módulo *Ad-Free (Marca Blanca)*.
- **Relación con el Restaurante:**
  - Si el restaurante paga la cuota mensual de *Ad-Free*, sus tags quedan limpios de publicidad de terceros (0% anuncios).
  - Si el restaurante opta por la suscripción estándar sin *Ad-Free*, sus comensales visualizan los anuncios patrocinados de la red.

---

## 2. Formatos de Entrega (Placements) por Campaña

El formato de visualización se define al momento de crear la campaña según el paquete contratado por el anunciante:

1. **Card Integrada / Banner Inferior (`bottom_banner`):**
   - Tarjeta destacada integrada armónicamente debajo del widget de estrellas o al pie del Linktree.
   - Incluye logo/imagen del patrocinador, título de la oferta, etiqueta clara *"Patrocinado por [Nombre]"* y botón de acción (CTA).
   - Ideal para patrocinios continuos y presencia de marca sin bloquear la navegación.
2. **Pantalla Completa de Bienvenida / Interstitial (`interstitial`):**
   - Pantalla de transición de 2 a 3 segundos con banner a pantalla completa y botón *"Continuar a Calificar / Omitir"*.
   - Ideal para campañas de alto impacto, lanzamientos de eventos o promociones relámpago.

---

## 3. Algoritmo de Rotación y Segmentación

- **Rotación Equilibrada:** Cuando múltiples campañas activas coinciden en un mismo restaurante, el motor distribuye las impresiones equitativamente (round-robin o muestreo uniforme).
- **Segmentación Geográfica y por Local:**
  - `target_type: 'all'`: Se muestra en toda la red de locales disponibles.
  - `target_type: 'specific_restaurants'`: Se segmenta a restaurantes específicos (ej. dentro de un radio de 2 km del anunciante).
  - `target_type: 'specific_tags'`: Se asigna exclusivamente a ciertas mesas o barras.

---

## 4. Reglas de Exclusión y Protección del Restaurante

Para evitar conflictos de interés y descontento del dueño del local:
1. **Exclusión Automática de Competidores:** El sistema bloquea anuncios de categorías gastronómicas o negocios de comida dentro de los restaurantes.
2. **Lista de Exclusión Manual (`excluded_restaurant_ids`):** El Superadmin puede vetar restaurantes específicos donde un anunciante no debe aparecer bajo ninguna circunstancia.

---

## 5. Control de Vigencia y Finalización

Las campañas se gestionan bajo un modelo híbrido:
- **Fecha de Inicio y Fin:** Periodo de pauta (ej. 1 de Noviembre al 30 de Noviembre).
- **Tope de Impresiones Opcional (`max_impressions`):** Límite máximo contratado (ej. hasta 5,000 escaneos). La campaña pasa a estado inactivo al llegar a la fecha límite o agotar el tope de impresiones, lo que ocurra primero.

---

## 6. Destino del Anuncio & Tracking

- Al pulsar el anuncio, el sistema incrementa el contador de `clicks_count` en tiempo real.
- Abre inmediatamente la URL de destino en una nueva pestaña del navegador:
  - Sitio web oficial o perfil de Instagram.
  - Enlace directo a WhatsApp con mensaje predefinido: *"¡Hola! Vi su anuncio en la mesa del restaurante y me gustaría más información..."*.

---

## 7. Reportes y Transparencia para el Anunciante

- **Enlace de Métricas Compartible:** Vista pública segura (mediante token único o ID de campaña) donde el anunciante puede ver en tiempo real:
  - Total de Impresiones generadas.
  - Total de Clics obtenidos.
  - CTR (*Click-Through Rate* = Clics / Impresiones).
  - Locales con mayor volumen de interacción.
- No requiere que el anunciante cree contraseñas ni descargue aplicaciones.
