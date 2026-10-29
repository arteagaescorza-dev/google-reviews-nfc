# Declaración de Intención: Plataforma NFC Google Reseñas & Red Publicitaria Local

**Fecha de definición:** 28 de Octubre, 2026  
**Estado:** Confirmado  
**Hosting:** GitHub Pages  
**Backend & Base de Datos:** Supabase (Capa Gratuita)  

---

## 1. Declaración de Intención (Statement of Intent)

- **Resultado (Outcome):**  
  Plataforma web multi-negocio alojada en GitHub Pages con backend en Supabase, diseñada para conectar tags NFC físicos a páginas optimizadas para capturar reseñas en Google con 4 niveles de servicio escalonados, operando en paralelo una red publicitaria interna segmentable por tag con modalidad de cobro por eliminar anuncios (ad-free).

- **Usuarios (User):**  
  - **Administrador:** Tú (gestión de clientes, tags, campañas publicitarias y métricas).
  - **Clientes de Negocio:** Dueños de restaurantes y locales comerciales locales.
  - **Anunciantes:** Marcas y comercios locales que compran espacios publicitarios en las pantallas.
  - **Usuario Final (Comensal/Cliente):** Personas que tocan el tag NFC o escanean el QR en la mesa.

- **Por qué ahora (Why now):**  
  Crear un negocio rentable, escalable y con costo de infraestructura \$0 vendiendo hardware NFC y servicios de reputación a comercios locales, generando flujo de efectivo doble: por suscripción/soporte y por la monetización de espacios publicitarios cruzados.

- **Criterio de Éxito (Success Criteria):**  
  - Dar de alta un restaurante y configurar su paquete en menos de 3 minutos desde el panel web.
  - Asociar tags NFC pre-grabados (`?t=NFC-xxx`) asignándoles restaurante, mesa y campaña de publicidad en caliente sin tocar el chip físico.
  - Redirigir de forma ágil a los clientes satisfechos (4-5 estrellas) directamente a la ficha de Google Reseñas.
  - Retener y capturar quejas o calificaciones bajas (1-3 estrellas) en un buzón de feedback privado para proteger la reputación pública del negocio.
  - Mostrar banners publicitarios patrocinados de forma elegante en negocios que no hayan adquirido el paquete de eliminación de publicidad.

- **Restricciones Técnicas (Constraints):**  
  - **Frontend:** Estático para GitHub Pages (costo de alojamiento \$0, tiempo de carga ultrarrápido).
  - **Backend:** Supabase Free Tier (Base de datos PostgreSQL, autenticación de administrador, almacenamiento para logos y creatividades de banners).
  - **Experiencia de Usuario:** Web móvil nativa ultra ligera, sin descargas de apps ni registros requeridos para el comensal.

- **Fuera de Alcance Inicial (Out of Scope v1):**  
  - Pasarelas de pago automatizadas auto-servicio (Stripe / Mercado Pago): los cobros a restaurantes y anunciantes se gestionan de forma manual y offline en v1.
  - Emisión de pases Wallet (Apple/Google Wallet) y campañas automáticas de WhatsApp: forma parte del roadmap de fidelización para la fase posterior.
  - App móvil nativa (todo opera vía navegador móvil estándar al interactuar con el NFC).
  - Dashboard analítico complejo en tiempo real por mesa (Tier 4 queda modelado a nivel de base de datos como arquitectura preparada/deuda técnica, pero la interfaz avanzada se desarrollará en fases posteriores).

---

## 2. Definición de Paquetes y Niveles de Servicio

1. **Tier 1 - Enlace Directo (Paquete Inicial):**  
   - Redirección rápida a la ficha de reseñas de Google.
   - Si no ha pagado por eliminar anuncios: pantalla de transición limpia de 2 a 3 segundos ("*Redirigiendo a Google...*") mostrando el banner patrocinado y un botón para continuar inmediatamente.
   - Si pagó por eliminar anuncios: redirección inmediata (0 segundos).

2. **Tier 2 - Filtro de Satisfacción & Protección de Reputación:**  
   - Pantalla interactiva de calificación con estrellas (1 a 5).
   - **4 o 5 estrellas:** Redirección automática inmediata al enlace de Google Reseñas del restaurante.
   - **1 a 3 estrellas:** Apertura de formulario privado ("*¿Cómo podemos mejorar? Ayúdanos a corregirlo directamente con gerencia*") para contener el problema internamente.
   - Banner patrocinado en la parte inferior si no pagó por eliminar publicidad.

3. **Tier 3 - Filtro de Reputación + Linktree de Marca:**  
   - Incluye todo lo del Tier 2 (filtro inteligente).
   - Agrega accesos rápidos de marca: menú digital (PDF / link), redes sociales (Instagram, Facebook, TikTok), conexión Wi-Fi, WhatsApp de pedidos o reservaciones.
   - Banner patrocinado integrado estéticamente en la base del Linktree.

4. **Tier 4 - Métricas Dinámicas por Mesa/Tag (Arquitectura Preparada / Deuda Técnica):**  
   - Registro de escaneos individuales por tag/mesa/sucursal.
   - Capacidad de redirigir dinámicamente según horario, mesa o campaña sin reprogramar chips físicos.
   - Estructura de base de datos lista en v1 para evitar refactorizaciones futuras.

---

## 3. Modelo de Negocio, Escalabilidad y Jerarquía

### Jerarquía Multi-Marca y Multi-Sucursal
El sistema soporta que un mismo cliente (dueño de negocio u operador gastronómico) posea:
- Múltiples **Marcas** (ej. una cadena de pizzerías y una cadena de cafeterías).
- Múltiples **Sucursales** por marca (ej. Sucursal Norte, Sucursal Sur, Sucursal Centro), cada una con su propia ficha y enlace de Google Reseñas, mesas y tags independientes.
- Un panel unificado donde el dueño o administrador puede visualizar y gestionar todas sus sucursales.

### Modelo de Monetización
- **Venta de Hardware NFC:** Cobro inicial por placas/stickers NFC grabados.
- **Suscripción Mensual / Soporte:** Cobro por sucursal según el paquete contratado (Tier 1, 2 o 3).
- **Upsell Ad-Free (Marca Blanca):** Cuota mensual para eliminar anuncios publicitarios.
- **Red de Publicidad Local:** Ingresos por venta de espacios de banner en tags activos que no pagan ad-free.
- **Servicios Futuros:** Cuotas por reportes automatizados de analíticas, alertas WhatsApp y módulo de fidelización Wallet.

---

## 4. Estrategia de Hardware & Identificación de Tags NFC

- **Codificación en Lote:** Los stickers NFC se programan físicamente una sola vez con una URL que contiene un ID único (ejemplo: `https://[dominio]/?t=NFC-001`).
- **Asignación Dinámica en la Nube:** Desde el panel de administración, el tag `NFC-001` se vincula dinámicamente al restaurante/sucursal correspondiente, mesa específica y anuncio asignado.
- Si un restaurante se da de baja, cambia de sucursal o actualiza su enlace de Google, el chip físico no requiere ser reprogramado.

---

## 5. Criterios de Migración de Hosting (GitHub Pages → Cloud / Hosting Dedicado)

GitHub Pages es la plataforma ideal para validar el MVP a costo \$0. La migración a una plataforma en la nube más robusta (Cloudflare Pages, Vercel o VPS dedicado) se activará cuando se alcance cualquiera de los siguientes hitos:

1. **Dominios Personalizados Multi-Tenant:** Cuando los restaurantes soliciten que el tag abra bajo su propio dominio de marca (ej. `resenas.mirestaurante.com`). GitHub Pages solo permite 1 dominio personalizado por repositorio.
2. **Límites de Tráfico / Ancho de Banda:** Si el volumen de escaneos supera el límite suave de GitHub Pages (~100 GB/mes o 100,000+ visitas mensuales).
3. **Firmado Criptográfico de Tarjetas Wallet:** La generación de pases `.pkpass` de Apple Wallet requiere firma con certificados en backend en tiempo real.
4. **Automatizaciones de Notificaciones y Webhooks de Servidor:** Cuando se integren bots de WhatsApp en Node.js que requieran procesos persistentes en background.

---

## 6. Roadmap de Expansión Futura

Para el desglose arquitectónico y especificaciones completas de cada iniciativa, consultar [`docs/ROADMAP.md`](../ROADMAP.md).

1. **Fase 2 - Alertas, Analíticas y Portal de Suscriptor:**
   - Envío automático de notificaciones a WhatsApp o email del gerente cuando un comensal deja 1-3 estrellas en menos de 1 minuto.
   - Portal dedicado para el Dueño del Local (gestión de quejas privadas, métricas de retención y administración de anuncios propios).
   - Mapa de calor de escaneos en tiempo real para el Superadmin.
2. **Fase 3 - Operación Gastronómica (Menú Digital & Comandas):**
   - Menú digital con precios, fotografías y modificadores.
   - Generación de comanda desde la mesa y nuevo Rol de Mesero para validar las órdenes antes de enviar a cocina.
3. **Fase 4 - Segmentación Publicitaria Inteligente & Fidelización:**
   - Algoritmo de distribución de anuncios por franja horaria (dayparting), cercanía geográfica y tipo de negocio.
   - Fidelización Digital con pases en Apple Wallet & Google Wallet (sellos/puntos por visita).

