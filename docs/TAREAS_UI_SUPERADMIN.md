# Bitacora de Tareas UI/UX Superadministrador (Bento Grid Light)

Este documento registra y da seguimiento a todas las tareas de interfaz preaprobadas por el usuario para la reestructuracion completa del panel de Superadministrador en estilo **Bento Grid Light Theme**.

---

## Estado General del Proyecto Superadmin
* **Estilo Visual:** Bento Box Grid en Modo Claro (Apple & Linear Aesthetic)
* **Paleta:** Superficies blancas puras (`#FFFFFF`), micro-bordes (`#E2E8F0`), fondo luminoso (`#F8FAFC`), acentos ejecutivos (Azul `#2563EB`, Esmeralda `#059669`, Ambar `#D97706`, Purpura `#7C3AED`).
* **Enfoque de Negocio:** Dueño/Operador de empresa de Hardware NFC + Plataforma SaaS Multi-Rol (Direccion, Ventas, Marketing, Hardware, Instaladores y Soporte).
* **Iconografia (POL-007):** Repositorio oficial de iconos vectoriales `lucide-react`. Sin uso de emojis en vistas ni documentos.

---

## Modulos y Tareas Preaprobadas

### Modulo 1: Stock de Hardware, Lotes de Imprenta y Activador In-Situ
| ID | Tarea UI / Componente | Estado | Mockup de Referencia | Infraestructura Backend |
| :--- | :--- | :--- | :--- | :--- |
| **UI-HW-01** | **Bento Cards de Insumos en Bodega:** 3 tarjetas superiores para Chips NTAG virgenes, Viniles adhesivos impresos y Semaforo de punto de reorden optimo. | `Implementada y Verificada` | `mockup_bento_tab3_hardware.png` (Fila 1) | Tabla `hardware_inventory` |
| **UI-HW-02** | **Generador de Pliegos para Imprenta:** Interfaz con selector de unidades (100, 250, 500), rango automatico de folios (ej. TAG-0501 a TAG-0750) y boton de descarga de vector PDF/SVG con guias de corte y suaje circular. | `Implementada y Verificada` | `mockup_bento_tab3_hardware.png` (Card Central) | Tabla `print_batches` |
| **UI-HW-03** | **Activador Express en Mesa (In-Situ):** Asistente paso a paso para el instalador (1. Escanear QR del vinil -> 2. Asignar restaurante y mesa -> 3. Grabar chip NFC en 3s). Descuenta stock automaticamente. | `Implementada y Verificada` | `mockup_bento_tab3_hardware.png` (Card Inferior) | RPC `activate_table_tag_in_situ` |
| **UI-HW-04** | **Gestor de Reposicion por Desgaste:** Flujo para sustituir tags desgastados por desengrasante o sol, transfiriendo la mesa al nuevo codigo sin perder trazabilidad. | `Implementada y Verificada` | `mockup_bento_tab4_finanzas.png` (Card Inferior) | RPC `replace_damaged_table_tag` |

---

### Modulo 2: Ventas y Pipeline Comercial B2B
| ID | Tarea UI / Componente | Estado | Mockup de Referencia | Infraestructura Backend |
| :--- | :--- | :--- | :--- | :--- |
| **UI-VT-01** | **Tablero Kanban Comercial B2B:** 4 columnas Bento con estilo claro (`Contactados`, `Demo de Placa NFC`, `Cotizacion / Cierre`, `Cerrados este mes`) con tarjetas de prospectos, valor MRR y kit upfront. | `Implementada y Verificada` | `mockup_bento_tab2_ventas.png` (Card Superior) | Tabla `sales_leads` |
| **UI-VT-02** | **Modulo de Win-Back Automatizado:** Panel de monitoreo de campañas de recaptura para restaurantes en riesgo (Dia 3 alerta de perdida de escudo y Dia 14 descuento vitalicio). | `Implementada y Verificada` | `mockup_bento_tab2_ventas.png` (Card Izquierda) | Tabla `winback_campaign_logs` |
| **UI-VT-03** | **Metricas de Pauta Local:** Resumen de rendimiento de anunciantes con total de impresiones, clics y tasa de conversion de leads por zona. | `Implementada y Verificada` | `mockup_bento_tab2_ventas.png` (Card Derecha) | Tablas `ads`, `coupons` |

---

### Modulo 3: Finanzas Reales, Cobranza Stripe/MP y EBITDA
| ID | Tarea UI / Componente | Estado | Mockup de Referencia | Infraestructura Backend |
| :--- | :--- | :--- | :--- | :--- |
| **UI-FN-01** | **Semaforo de Cobranza Mensual:** Lista tabular ejecutiva de restaurantes con estado de cobro en Stripe y Mercado Pago, alerta de fallos de pago y boton de dunning. | `Implementada y Verificada` | `mockup_bento_tab4_finanzas.png` (Card Superior) | `organizations.subscription_status` |
| **UI-FN-02** | **Consola EBITDA en Vivo:** Desglose real entre ingresos brutos (SaaS + Kits de Hardware + Ads) y costos directos (COGS hardware, pasarelas de pago, hosting Supabase). | `Implementada y Verificada` | `mockup_bento_tab1_resumen.png` (Card 1) | API `finances.getFinancialMetrics` |
| **UI-FN-03** | **Liquidacion Automatica:** Indicador de saldo Stripe listo para dispersion bancaria via SPEI. | `Implementada y Verificada` | `mockup_bento_tab4_finanzas.png` | Webhook Stripe |

---

### Modulo 4: Centro de Mando Ejecutivo (Resumen Bento)
| ID | Tarea UI / Componente | Estado | Mockup de Referencia | Infraestructura Backend |
| :--- | :--- | :--- | :--- | :--- |
| **UI-RS-01** | **KPI Card Facturacion Mensual:** Tarjeta asimetrica Col-Span-5 con barra de progreso dividida por fuente de ingresos. | `Implementada y Verificada` | `mockup_bento_tab1_resumen.png` | Vista agregada |
| **UI-RS-02** | **Mini-Widgets de Stock y Pipeline:** Tarjetas cuadradas de lectura rapida con accesos directos a los modulos operativos. | `Implementada y Verificada` | `mockup_bento_tab1_resumen.png` | `hardware_inventory`, `sales_leads` |
| **UI-RS-03** | **Feed de Eventos en Directo:** Linea de tiempo con pastillas interactivas que reflejan escaneos, pagos recibidos y ordenes corporativas en tiempo real. | `Implementada y Verificada` | `mockup_bento_tab1_resumen.png` | Supabase Realtime |

---

### Modulos Existentes en Bento Light (Alineacion de Navegacion)
| ID | Modulo Existente | Adaptacion Bento Light | Ruta Actual | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **UI-EX-01** | **Directorio Jerárquico en Árbol + Asistente de Alta en 3 Pasos (Organización -> Marca -> Sucursal -> Panel de Control)** | Formato tabular jerárquico (Nivel 1: Organización Matriz con Datos Fiscales -> Nivel 2: Marcas Comerciales `organization_brands` con logo cuadrado 1:1 y catálogo universal de giros `business_verticals` con buscador y alta en vivo -> Nivel 3: Sucursales Físicas supeditadas a la marca con selector de Tier y botón directo a Quejas -> Nivel 4: Panel de Control Operativo por Categorías con Switches Prendido/Apagado, selector de rol de personal y Tabla de Gerentes de la Organización `organization_managers` con asignación por sucursal). | `/admin/restaurants` | `Implementada y Verificada` |
| **UI-EX-02** | **Tags NFC y QR** | Lista y cuadricula Bento de placas con indicador de lote fisico, mesa asignada y volumen de escaneos. | `/admin/tags` | `Alineada` |
| **UI-EX-03** | **Red de Anuncios** | Auditoria visual de banners, anunciantes locales activos y distribucion de cupones. | `/admin/ads` | `Pendiente Bento v2` |
| **UI-EX-04** | **Cobertura Territorial** | Mapa interactivo de zonas de cobertura metropolitana y densidad de colocacion de placas. | `/admin/cobertura` | `Alineada` |
| **UI-EX-05** | **Mesa de Ayuda B2B** | Bandeja de tickets de soporte con accion rapida para reemplazo de viniles dañados. | `/admin/soporte` | `Pendiente Bento v2` |

---

## Galeria de Archivos de Bocetos Renderizados
* **Resumen:** `mockup_bento_tab1_resumen.png`
* **Ventas y Pipeline:** `mockup_bento_tab2_ventas.png`
* **Hardware e Imprenta:** `mockup_bento_tab3_hardware.png`
* **Finanzas y Cobranza:** `mockup_bento_tab4_finanzas.png`


---

## Directiva de Conmutacion para IA (AI Task Switcher)

* **Ambito de Trabajo:** FULLSTACK (Consola Superadmin Bento Grid Light)
* **Documento Rector:** `docs/TAREAS_UI_SUPERADMIN.md`
* **Politicas Inamovibles Aplicables:**
  * `POL-001` (Zero-Custody financiero en consumos de restaurantes).
  * `POL-002` (Diseno Bento Grid en Light Theme).
  * `POL-003` (Trazabilidad fisica de hardware, chips NTAG y viniles 3M).
  * `POL-005` (100% idioma español en código, UI y comentarios).
  * `POL-006` (Cero regresiones, suite Vitest y TypeScript strict).
  * `POL-007` (Prohibicion de emojis, uso de `lucide-react`).
  * `POL-008` (Ciclo cerrado de 8 pasos: cambio -> consulta -> conmuta -> plan -> confirmacion -> implementacion -> validacion -> commit).
* **Archivos Impactados:**
  * Frontend: `src/pages/AdminTagsPage.tsx`, `src/pages/AdminDashboardPage.tsx`, `src/pages/AdminFinancesPage.tsx`, `src/components/admin/AdminLayout.tsx`.
  * Backend: `supabase/migrations/20261101_superadmin_infrastructure.sql`, RPCs `activate_table_tag_in_situ`, `replace_damaged_table_tag`, tablas `hardware_inventory`, `print_batches`, `sales_leads`.
* **Secuencia de Ejecucion:**
  1. Conmutar al modulo especifico solicitado (ej. Modulo 1: Hardware).
  2. Presentar plan detallado de implementacion al usuario.
  3. Esperar confirmacion expresa del usuario.
  4. Implementar componentes frontend y llamadas API.
  5. Ejecutar tests automatizados (`npm run test`) y verificacion de tipos.
  6. Presentar resultado al usuario para validacion en pantalla.
  7. Al recibir validacion, actualizar documentacion y hacer commit en Git.
