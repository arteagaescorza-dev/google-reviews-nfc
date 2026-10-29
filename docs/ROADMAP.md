# Roadmap Estratégico y Futuras Funcionalidades

Este documento registra formalmente las iniciativas clave de expansión de la plataforma para su priorización e implementación técnica en fases posteriores.

---

## 1. Mapa de Calor e Interacciones en Tiempo Real (Superadmin)

### Descripción
Visualización gráfica e interactiva en el panel del Superadministrador que muestra la actividad de escaneo de los tags NFC y QR en tiempo real sobre un mapa geográfico o plano de sucursales.

### Objetivos y Casos de Uso
- **Monitoreo de horas pico:** Detectar a qué horas del día se producen la mayor cantidad de interacciones por zona o tipo de restaurante.
- **Rendimiento por mesa/sucursal:** Identificar mesas frías (con pocos o nulos escaneos) frente a mesas de alto tráfico para asesorar al restaurantero en la reubicación de sus placas NFC.
- **Detección de anomalías en vivo:** Alertas visuales si un local sufre un pico inusual de bajas calificaciones en un intervalo corto de tiempo.

### Componentes Técnicos Previstos
- Integración de capa de mapas ligeros (Leaflet / Mapbox GL) o visualización por densidad de burbujas en cuadrícula.
- Supabase Realtime (suscripción por WebSockets a eventos `INSERT` en la tabla `tag_scans`).

---

## 2. Panel de Administración de Anuncios para el Suscriptor

### Descripción
Espacio dentro del portal del dueño del local donde puede crear, programar y medir sus propias campañas de anuncios internas y cruzadas.

### Objetivos y Casos de Uso
- **Promociones propias del negocio:** Anunciar el "2x1 de los jueves", postres de temporada o eventos especiales dentro de sus propios tags (reemplazando banners de terceros).
- **Publicidad cruzada de pago:** Posibilidad de que un restaurante compre impresiones en otros comercios no competidores afiliados a la red local (ej. una cafetería anunciándose en un gimnasio o viceversa).
- **Control de marcas patrocinadoras:** Visualizar ingresos o beneficios por permitir anuncios en sus mesas.

### Componentes Técnicos Previstos
- Filtro en la tabla `ads` por `organization_id`.
- Métricas dedicadas de CTR (Click-Through Rate) e impresiones para el suscriptor.

---

## 3. Menú Digital Interactivo con Generación de Comandas

### Descripción
Evolución del Menú Digital estático (actualmente en PDF o link externo) hacia un catálogo interactivo con carrito de compras donde el comensal arma su pedido directamente desde el celular en la mesa.

### Objetivos y Casos de Uso
- **Gestión de catálogo:** Alta de platillos, fotografías, descripciones, alérgenos, precios y modificadores (ej. término de carne, sin cebolla).
- **Generación de comanda:** Al escanear el tag de la Mesa 4, el cliente selecciona sus platillos y pulsa "Enviar Orden", generando un ticket digital vinculado a la mesa física.
- **Ahorro de tiempos:** Disminuir la espera del comensal y optimizar la rotación de mesas en horas pico.

### Componentes Técnicos Previstos
- Tablas nuevas en PostgreSQL: `menu_categories`, `menu_items`, `orders`, `order_items`.
- Estado de comanda: `creada`, `validada_por_mesero`, `en_cocina`, `servida`, `cerrada`.

---

## 4. Rol de Mesero (Validador de Comandas de Mesa)

### Descripción
Nuevo perfil de usuario y aplicación web móvil de interfaz ultrarrápida diseñada exclusivamente para el personal de servicio en sala.

### Objetivos y Casos de Uso
- **Validación humana antes de cocina:** El comensal envía su pedido desde el celular, y el mesero asignado recibe una notificación en su teléfono o tableta de servicio para confirmar que la mesa solicitó eso antes de pasarlo a producción (evitando pedidos falsos o errores).
- **Modificación rápida de orden:** Posibilidad de agregar notas adicionales o corregir disponibilidad de insumos en la mesa.
- **Atención de quejas al vuelo:** Alerta sonora inmediata cuando un comensal califica con 1-3 estrellas en esa mesa, permitiendo al mesero o capitán intervenir antes de que el cliente abandone el local insatisfecho.

### Componentes Técnicos Previstos
- Rol `waiter` con vista simplificada y botones grandes optimizados para uso móvil rápido con una sola mano.
- Asignación de meseros por rango de mesas o zonas de la sucursal.

---

## 5. Algoritmo Inteligente y Segmentación de Audiencia Publicitaria

### Descripción
Motor de recomendación y subasta de banners publicitarios que optimiza qué anuncio se le muestra a cada comensal en el momento exacto de interacción.

### Dimensiones de Segmentación
1. **Temporal (Dayparting):**
   - 08:00 - 12:00: Cafeterías, desayunos, servicios corporativos.
   - 13:00 - 17:00: Comidas ejecutivas, servicios de paquetería, postres.
   - 19:00 - 23:00: Cervecerías, vida nocturna, transporte/taxis privados.
2. **Geográfica y Radio de Proximidad:** Negocios locales a menos de 2 km a la redonda del comensal.
3. **Categoría y Contexto del Restaurante:** Exclusión de competidores directos (no anunciar tacos dentro de una taquería) y priorización de servicios complementarios (cine, entretenimiento, talleres, estética).
4. **Frecuencia de Exposición:** Capping para no mostrar el mismo anuncio al mismo comensal más de 2 veces por semana.

### Componentes Técnicos Previstos
- Función de base de datos PostgreSQL (`fn_select_target_ad`) o Edge Function que evalúe las reglas de contexto al momento de procesar `GET /api/resolve`.
