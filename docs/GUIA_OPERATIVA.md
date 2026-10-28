# Guía Operativa: Puesta en Marcha y Comercialización NFC

Esta guía describe el procedimiento paso a paso para operar el negocio de tags NFC, configurar la nube, grabar los chips físicos y gestionar clientes y publicidad.

---

## 1. Conexión a la Nube Gratuita (Supabase)

El sistema ya funciona de forma autónoma en **Modo Demo Local** en tu navegador. Para ponerlo en producción multi-dispositivo con base de datos en la nube:

1. Ve a [supabase.com](https://supabase.com) y regístrate gratis.
2. Crea un nuevo proyecto (ejemplo: `nfc-google-resenas`).
3. Ve a la pestaña **SQL Editor** en el panel izquierdo de Supabase.
4. Abre el archivo [supabase/schema.sql](file:///c:/Users/Mickey/Documents/DEV/Google%20Reseñas/supabase/schema.sql), copia todo su contenido y pégalo en el SQL Editor de Supabase. Pulsa **Run**.
5. Abre el archivo [supabase/seed.sql](file:///c:/Users/Mickey/Documents/DEV/Google%20Reseñas/supabase/seed.sql) para cargar datos de prueba iniciales y pulsa **Run**.
6. En Supabase, ve a **Project Settings** → **API**. Copia:
   - **Project URL**
   - **anon public key**
7. En tu entorno local, crea un archivo `.env` en la raíz del proyecto:
   ```env
   VITE_SUPABASE_URL=https://tu-id-de-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
   ```
8. En tu repositorio de GitHub, ve a **Settings** → **Secrets and variables** → **Actions**, y agrega ambos secretos con los mismos nombres para el despliegue automático.

---

## 2. Compra y Grabación de Tags NFC Físicos

### Hardware Recomendado
- **Tipo de Chip:** **NTAG213** (144 bytes, suficiente para URLs cortas) o **NTAG215** (504 bytes, ideal y muy económico).
- **Formato:** Stickers adhesivos epoxi para mesas, placas acrílicas de madera o metal, o llaveros.
- **Capa Anti-Metal (On-Metal):** Si se van a pegar en mesas metálicas, asegúrate de comprar stickers con capa ferrítica anti-metal.

### Cómo Grabar los Chips en Lote (en tu taller/escritorio)
1. Descarga la aplicación gratuita **NFC Tools** en tu teléfono (disponible para iPhone y Android).
2. En la app, ve a **Escribir** → **Añadir un registro** → **URL / Enlace**.
3. Escribe la URL de tu sitio web con el código de tag asignado:
   `https://[tu-usuario].github.io/[tu-repo]/?t=NFC-001`
4. Pulsa **Escribir** y acerca el sticker NFC a la parte trasera de tu teléfono. En 1 segundo quedará grabado.
5. Repite el proceso para `NFC-002`, `NFC-003`, etc.
6. *(Opcional de seguridad)*: Puedes usar la función **Bloquear etiqueta** para que nadie pueda sobreescribir la URL grabada.

> **Regla de oro:** Solo grabas el chip físico **una sola vez**. Nunca más tendrás que tocarlo físicamente. Si el restaurante cambia de paquete, de mesa, de enlace de Google o de publicidad, todo se actualiza en tiempo real desde tu panel web.

---

## 3. Flujo para Registrar a un Restaurante Cliente

1. Entra a tu panel administrativo: `https://[tu-dominio]/#/admin`.
2. Ve a **Restaurantes** y pulsa **Dar de Alta Sucursal**.
3. Llena la información:
   - **Marca y Sucursal:** Ej. *Taquería Los Güeros - Sucursal Centro*.
   - **URL de Google Reseñas:** Para obtenerla, busca el negocio en Google Maps, pulsa "Compartir" o "Pedir reseñas", y copia el enlace oficial (`https://search.google.com/local/writereview?placeid=...`).
   - **Paquete Contratado:**
     - **Tier 1:** Enlace directo a Google (con pantalla de 2.5s y anuncio si no es ad-free).
     - **Tier 2:** Filtro de reputación (4-5 estrellas van a Google, 1-3 van a buzón privado).
     - **Tier 3:** Filtro de reputación + Linktree (menú digital, Instagram, Wi-Fi, WhatsApp).
   - **Modalidad Ad-Free:** Marca la casilla si el cliente pagó la cuota mensual para no mostrar publicidad en sus mesas.
   - **Color de Marca y Logo:** Para personalizar la pantalla con su identidad.
4. Ve a la sección **Tags NFC & QR**, selecciona los tags físicos que le vas a entregar (ej. `NFC-001` a `NFC-010`) y asígnalos a esa sucursal indicando la mesa ("Mesa 1", "Mesa 2", "Barra").
5. Entrega los stickers al dueño o colócalos en sus mesas.

---

## 4. Comercialización de la Red Publicitaria Local

Para monetizar con negocios vecinos que quieran anunciarse:

1. Ve a **Red de Anuncios** en tu panel y pulsa **Crear Anuncio**.
2. Ingresa el nombre del anunciante (ej. *Gimnasio FitZone*, *Dentista Dra. Morales*), el título de la oferta, la imagen del banner y la URL de destino (su web o su WhatsApp).
3. **Elige la segmentación:**
   - **Todos los locales:** Se mostrará rotativo en cualquier restaurante que no tenga activa la opción Ad-Free.
   - **Locales específicos:** Selecciona solo las sucursales donde el anunciante quiere aparecer (ej. en los restaurantes de su misma colonia).
   - **Por Tag Único:** Ideal para mesas VIP o zonas específicas.
4. El sistema contabilizará automáticamente las impresiones (vistas) y los clics generados.

---

## 5. Gestión del Buzón de Quejas Privadas

Cuando un comensal califica con 1, 2 o 3 estrellas:
1. El comensal ve una pantalla amigable pidiendo detalles para la gerencia, protegiendo al restaurante de una mala calificación pública en Google Maps.
2. La queja entra de inmediato a tu sección **Buzón de Quejas**.
3. Si el comensal dejó su teléfono, pulsa el botón **Contactar por WhatsApp** para que el gerente pueda enviarle un mensaje en 1 clic ofreciéndole una disculpa o cortesía antes de que el malentendido escale.

