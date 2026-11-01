# Registro Oficial de Politicas del Sistema (Politicas Inamovibles)

* **Proposito:** Catalogo central de todas las decisiones irrevocables, directrices de arquitectura y reglas de negocio del proyecto que han sido declaradas como **"Inamovibles"** o **"Politicas del Sistema"** por el usuario.
* **Mecanismo de Cascada:** Cada vez que una regla ingresa a este registro, se actualiza automaticamente en cascada en todos los documentos tecnicos, especificaciones, esquemas de base de datos y componentes donde incida.
* **Fecha de Ultima Sincronizacion:** Noviembre 2026

---

## Inventario de Politicas Activas

### POL-001: Modelo Financiero "Zero-Custody" en Pagos de Comida
* **Declaracion:** La plataforma **NUNCA** custodia, retiene, intermedia ni cobra comisiones porcentuales de transacciones sobre los pedidos de comida o consumo en mesa de los comensales.
* **Mecanismo Tecnico:** Los fondos de las comandas van 100% directos de la cuenta del comensal a la cuenta bancaria / Stripe Connect / Mercado Pago del restaurante.
* **Ingresos de la Plataforma:** La plataforma monetiza exclusivamente mediante:
  1. Venta inicial de kits de hardware fisico (antenas NFC + viniles).
  2. Suscripcion SaaS mensual/anual de software cobrada via Stripe.
  3. Pauta publicitaria contratada por marcas anunciantes.
* **Documentos Incidentes:**
  * [`docs/SPEC_ARQUITECTURA_FINANCIERA.md`](./SPEC_ARQUITECTURA_FINANCIERA.md)
  * [`docs/SPEC.md`](./SPEC.md)
  * [`src/lib/payments.ts`](../src/lib/payments.ts)
  * [`docs/DEUDA_TECNICA.md`](./DEUDA_TECNICA.md) (DT-04)

---

### POL-002: Consola Superadmin Estrictamente en Modo Claro y Estilo Bento Grid
* **Declaracion:** El panel de Superadministrador (`/admin`) debe regirse de forma permanente por la estetica **Bento Box Grid en Modo Claro** (Apple & Linear design aesthetic). No se permiten modos oscuros ni interfaces genericas de tablas apiñadas.
* **Directrices Visuales:**
  * Superficies blancas puras (`#FFFFFF`) con micro-bordes sutiles (`#E2E8F0`).
  * Fondo luminoso slate-50 (`#F8FAFC`).
  * Tarjetas asimetricas modulares con esquinas generosas (`rounded-3xl` / 24px).
  * Tipografia tabular para importes monetarios en pesos mexicanos (`$ MXN`).
* **Documentos Incidentes:**
  * [`docs/TAREAS_UI_SUPERADMIN.md`](./TAREAS_UI_SUPERADMIN.md)
  * [`docs/IMPECCABLE_CRITIQUE.md`](./IMPECCABLE_CRITIQUE.md)
  * [`src/components/admin/AdminLayout.tsx`](../src/components/admin/AdminLayout.tsx)
  * [`src/pages/AdminDashboardPage.tsx`](../src/pages/AdminDashboardPage.tsx)

---

### POL-003: Trazabilidad Fisica Obligatoria en Hardware y Produccion
* **Declaracion:** Cada placa fisica en restaurante debe tener trazabilidad de extremo a extremo:
  1. **Lotes de Imprenta:** Todo vinil debe pertenecer a un lote (`print_batches`) con folios correlativos generados en vector PDF/SVG con guias de corte/suaje circular de 6x6cm para la imprenta.
  2. **Bodega de Insumos:** Las antenas NTAG213/215 virgenes y viniles se registran en `hardware_inventory` con umbral de reorden minimo.
  3. **Activacion In-Situ Atomica:** La vinculacion en mesa se realiza en campo mediante la RPC `activate_table_tag_in_situ`, descontando stock automaticamente.
  4. **Reposicion por Desgaste:** Todo reemplazo de placa dañada se ejecuta mediante la RPC `replace_damaged_table_tag` sin romper el historico de escaneos de la mesa.
* **Documentos Incidentes:**
  * [`docs/GUIA_OPERATIVA.md`](./GUIA_OPERATIVA.md)
  * [`docs/TAREAS_UI_SUPERADMIN.md`](./TAREAS_UI_SUPERADMIN.md)
  * [`supabase/migrations/20261101_superadmin_infrastructure.sql`](../supabase/migrations/20261101_superadmin_infrastructure.sql)
  * [`src/types/index.ts`](../src/types/index.ts)

---

### POL-004: Blindaje Reputacional (Filtro 5 Estrellas vs Buzon Privado)
* **Declaracion:** Ningun comensal insatisfecho es dirigido hacia Google Maps.
* **Mecanismo:**
  * Calificacion 4 o 5 estrellas: Redireccion inmediata a Google Reviews.
  * Calificacion 1, 2 o 3 estrellas: Captura en buzon privado (`feedback`) con alerta inmediata por WhatsApp/correo al dueño del restaurante para atencion interna.
* **Documentos Incidentes:**
  * [`docs/SPEC.md`](./SPEC.md)
  * [`docs/SPEC_PORTAL_SUSCRIPTOR.md`](./SPEC_PORTAL_SUSCRIPTOR.md)
  * [`src/pages/ResolverPage.tsx`](../src/pages/ResolverPage.tsx)

---

### POL-005: 100% Idioma Español
* **Declaracion:** Toda la documentacion oficial, comentarios en codigo, mensajes de commit en Git, cadenas de interfaz de usuario y respuestas del asistente deben redactarse estrictamente en **idioma español**.
* **Documentos Incidentes:**
  * Todos los archivos en `/docs`
  * Todo el codigo fuente en `/src`

---

### POL-006: Verificacion Continua y Cero Regresiones
* **Declaracion:** Ningun cambio de codigo o esquema de base de datos se da por terminado sin superar:
  1. Suite completa de pruebas unitarias (`npm run test`) al 100% en verde.
  2. Verificacion estricta del compilador TypeScript (`npx tsc --noEmit`) con 0 errores.
  3. Empaquetado exitoso de produccion (`npm run build`).
* **Documentos Incidentes:**
  * [`docs/DEUDA_TECNICA.md`](./DEUDA_TECNICA.md)
  * [`vitest.config.ts`](../vitest.config.ts)

---

### POL-007: Prohibicion Estricta de Emojis y Estandarizacion con Repositorio de Iconos
* **Declaracion:** Queda terminantemente prohibido el uso de emojis tanto en la interfaz grafica de usuario (UI), como en la documentacion tecnica del framework (`/docs`), mensajes del sistema y comunicaciones. Los emojis restan sobriedad y profesionalismo corporativo.
* **Mecanismo de Sustitucion:**
  1. **En la Interfaz Web (React / TypeScript):** Se utiliza exclusivamente un repositorio formal de iconos vectoriales. Mientras se formaliza la seleccion definitiva del pack corporativo, se utiliza la libreria estandar del proyecto: `lucide-react` (iconos monocromaticos SVG escalables y consistentes).
  2. **En Documentacion Tecnica (Markdown):** Se eliminan todos los emojis de encabezados, tablas y listas. Se reemplazan por titulos sobrios, identificadores textuales (ej. `[POL-001]`, `[CAPA-1]`, `[UI-HW-01]`) o insignias de texto plano.
* **Documentos Incidentes:**
  * [`docs/POLITICAS_DEL_SISTEMA.md`](./POLITICAS_DEL_SISTEMA.md)
  * [`docs/FRAMEWORK_DOCUMENTAL.md`](./FRAMEWORK_DOCUMENTAL.md)
  * [`docs/README.md`](./README.md)
  * [`docs/TAREAS_UI_SUPERADMIN.md`](./TAREAS_UI_SUPERADMIN.md)
  * Todos los componentes en `src/components/` y páginas en `src/pages/`

---

### POL-008: Seccion de Conmutacion para IA (AI Switcher) y Ciclo Cerrado de Implementacion
* **Declaracion:** Todos los documentos tecnicos y de especificacion en `/docs` deben contener una seccion estandarizada de prompteo (`## Directiva de Conmutacion para IA`). Esta seccion instruye a la IA a conmutar explicitamente su contexto y rol tecnico (Frontend, Backend, Base de Datos o Fullstack) previo a cualquier ejecucion.
* **Ciclo Cerrado Obligatorio (Bucle de 8 Pasos):**
  1. **Deteccion del Cambio:** Se plantea un ajuste, nueva funcionalidad o requerimiento.
  2. **Consulta Documental:** La IA lee obligatoriamente el documento rector correspondiente antes de proponer nada.
  3. **Conmutacion de Tarea:** La IA conmuta y explicita el tipo de tarea: Frontend, Backend o Fullstack.
  4. **Plan de Implementacion:** La IA formula un plan detallado paso a paso con los cambios propuestos (sin codificar aun).
  5. **Confirmacion del Usuario:** El usuario revisa, ajusta y autoriza el plan de forma explicita.
  6. **Implementacion:** La IA codifica los cambios autorizados (archivos front, backend o migraciones SQL).
  7. **Validacion del Usuario:** El usuario prueba los cambios en vivo y los valida o solicita ajustes puntuales.
  8. **Formalizacion y Commit:** La IA actualiza los documentos en cascada con la realidad validada, ejecuta las pruebas automatizadas y realiza el commit en Git, quedando lista para el siguiente cambio.
* **Documentos Incidentes:**
  * [`docs/FRAMEWORK_DOCUMENTAL.md`](./FRAMEWORK_DOCUMENTAL.md)
  * [`docs/README.md`](./README.md)
  * Todos los documentos de especificacion en `/docs`

---

## Protocolo de Actualizacion por Nuevas Politicas

Cuando el usuario instruya **"Quedo inamovible"** o **"Vuelvelo politica"**:
1. Se le asigna un identificador formal correlativo (`POL-009`, `POL-010`, etc.).
2. Se redacta la directriz con su alcance, reglas y justificacion en este archivo.
3. Se ejecuta la **cascada documental** actualizando en simultaneo cada especificacion, guia y esquema afectado sin emojis.
4. Se registra el cambio en el historial de Git con mensaje descriptivo.
