# 🏛️ Registro Oficial de Políticas del Sistema (Políticas Inamovibles)

* **Propósito:** Catálogo central de todas las decisiones irrevocables, directrices de arquitectura y reglas de negocio del proyecto que han sido declaradas como **"Inamovibles"** o **"Políticas del Sistema"** por el usuario.
* **Mecanismo de Cascada:** Cada vez que una regla ingresa a este registro, se actualiza automáticamente en cascada en todos los documentos técnicos, especificaciones, esquemas de base de datos y componentes donde incida.
* **Fecha de Última Sincronización:** Noviembre 2026

---

## 📜 Inventario de Políticas Activas

### 🔒 POL-001: Modelo Financiero "Zero-Custody" en Pagos de Comida
* **Declaración:** La plataforma **NUNCA** custodia, retiene, intermedia ni cobra comisiones porcentuales de transacciones sobre los pedidos de comida o consumo en mesa de los comensales.
* **Mecanismo Técnico:** Los fondos de las comandas van 100% directos de la cuenta del comensal a la cuenta bancaria / Stripe Connect / Mercado Pago del restaurante.
* **Ingresos de la Plataforma:** La plataforma monetiza exclusivamente mediante:
  1. Venta inicial de kits de hardware físico (antenas NFC + viniles).
  2. Suscripción SaaS mensual/anual de software cobrada vía Stripe.
  3. Pauta publicitaria contratada por marcas anunciantes.
* **Documentos Incidentes:**
  * [`docs/SPEC_ARQUITECTURA_FINANCIERA.md`](./SPEC_ARQUITECTURA_FINANCIERA.md)
  * [`docs/SPEC.md`](./SPEC.md)
  * [`src/lib/payments.ts`](../src/lib/payments.ts)
  * [`docs/DEUDA_TECNICA.md`](./DEUDA_TECNICA.md) (DT-04)

---

### 🎨 POL-002: Consola Superadmin Estrictamente en Modo Claro y Estilo Bento Grid
* **Declaración:** El panel de Superadministrador (`/admin`) debe regirse de forma permanente por la estética **Bento Box Grid en Modo Claro** (Apple & Linear design aesthetic). No se permiten modos oscuros ni interfaces genéricas de tablas apiñadas.
* **Directrices Visuales:**
  * Superficies blancas puras (`#FFFFFF`) con micro-bordes sutiles (`#E2E8F0`).
  * Fondo luminoso slate-50 (`#F8FAFC`).
  * Tarjetas asimétricas modulares con esquinas generosas (`rounded-3xl` / 24px).
  * Tipografía tabular para importes monetarios en pesos mexicanos (`$ MXN`).
* **Documentos Incidentes:**
  * [`docs/TAREAS_UI_SUPERADMIN.md`](./TAREAS_UI_SUPERADMIN.md)
  * [`docs/IMPECCABLE_CRITIQUE.md`](./IMPECCABLE_CRITIQUE.md)
  * [`src/components/admin/AdminLayout.tsx`](../src/components/admin/AdminLayout.tsx)
  * [`src/pages/AdminDashboardPage.tsx`](../src/pages/AdminDashboardPage.tsx)

---

### 🏭 POL-003: Trazabilidad Física Obligatoria en Hardware y Producción
* **Declaración:** Cada placa física en restaurante debe tener trazabilidad de extremo a extremo:
  1. **Lotes de Imprenta:** Todo vinil debe pertenecer a un lote (`print_batches`) con folios correlativos generados en vector PDF/SVG con guías de corte/suaje circular de 6x6cm para la imprenta.
  2. **Bodega de Insumos:** Las antenas NTAG213/215 vírgenes y viniles se registran en `hardware_inventory` con umbral de reorden mínimo.
  3. **Activación In-Situ Atómica:** La vinculación en mesa se realiza en campo mediante la RPC `activate_table_tag_in_situ`, descontando stock automáticamente.
  4. **Reposición por Desgaste:** Todo reemplazo de placa dañada se ejecuta mediante la RPC `replace_damaged_table_tag` sin romper el histórico de escaneos de la mesa.
* **Documentos Incidentes:**
  * [`docs/GUIA_OPERATIVA.md`](./GUIA_OPERATIVA.md)
  * [`docs/TAREAS_UI_SUPERADMIN.md`](./TAREAS_UI_SUPERADMIN.md)
  * [`supabase/migrations/20261101_superadmin_infrastructure.sql`](../supabase/migrations/20261101_superadmin_infrastructure.sql)
  * [`src/types/index.ts`](../src/types/index.ts)

---

### 🛡️ POL-004: Blindaje Reputacional (Filtro 5★ vs Buzón Privado)
* **Declaración:** Ningún comensal insatisfecho es dirigido hacia Google Maps.
* **Mecanismo:**
  * Calificación 4 o 5 estrellas: Redirección inmediata a Google Reviews.
  * Calificación 1, 2 o 3 estrellas: Captura en buzón privado (`feedback`) con alerta inmediata por WhatsApp/correo al dueño del restaurante para atención interna.
* **Documentos Incidentes:**
  * [`docs/SPEC.md`](./SPEC.md)
  * [`docs/SPEC_PORTAL_SUSCRIPTOR.md`](./SPEC_PORTAL_SUSCRIPTOR.md)
  * [`src/pages/ResolverPage.tsx`](../src/pages/ResolverPage.tsx)

---

### 🌐 POL-005: 100% Idioma Español
* **Declaración:** Toda la documentación oficial, comentarios en código, mensajes de commit en Git, cadenas de interfaz de usuario y respuestas del asistente deben redactarse estrictamente en **idioma español**.
* **Documentos Incidentes:**
  * Todos los archivos en `/docs`
  * Todo el código fuente en `/src`

---

### 🧪 POL-006: Verificación Continua y Cero Regresiones
* **Declaración:** Ningún cambio de código o esquema de base de datos se da por terminado sin superar:
  1. Suite completa de pruebas unitarias (`npm run test`) al 100% en verde.
  2. Verificación estricta del compilador TypeScript (`npx tsc --noEmit`) con 0 errores.
  3. Empaquetado exitoso de producción (`npm run build`).
* **Documentos Incidentes:**
  * [`docs/DEUDA_TECNICA.md`](./DEUDA_TECNICA.md)
  * [`vitest.config.ts`](../vitest.config.ts)

---

## 🔄 Protocolo de Actualización por Nuevas Políticas

Cuando el usuario instruya **"Quedó inamovible"** o **"Vuélvelo política"**:
1. Se le asigna un identificador formal correlativo (`POL-007`, `POL-008`, etc.).
2. Se redacta la directriz con su alcance, reglas y justificación en este archivo.
3. Se ejecuta la **cascada documental** actualizando en simultáneo cada especificación, guía y esquema afectado.
4. Se registra el cambio en el historial de Git con mensaje descriptivo.
