# 🍱 Bitácora de Tareas UI/UX Superadministrador (Bento Grid Light)

Este documento registra y da seguimiento a todas las tareas de interfaz preaprobadas por el usuario para la reestructuración completa del panel de Superadministrador en estilo **Bento Grid Light Theme**.

---

## 📌 Estado General del Proyecto Superadmin
* **Estilo Visual:** Bento Box Grid en Modo Claro (Apple & Linear Aesthetic)
* **Paleta:** Superficies blancas puras (`#FFFFFF`), micro-bordes (`#E2E8F0`), fondo luminoso (`#F8FAFC`), acentos ejecutivos (Azul `#2563EB`, Esmeralda `#059669`, Ámbar `#D97706`, Púrpura `#7C3AED`).
* **Enfoque de Negocio:** Dueño/Operador de empresa de Hardware NFC + Plataforma SaaS Multi-Rol (Dirección, Ventas, Marketing, Hardware, Instaladores y Soporte).

---

## 🗂️ Módulos y Tareas Preaprobadas

### 🏷️ Módulo 1: Stock de Hardware, Lotes de Imprenta & Activador In-Situ
| ID | Tarea UI / Componente | Estado | Mockup de Referencia | Infraestructura Backend |
| :--- | :--- | :--- | :--- | :--- |
| **UI-HW-01** | **Bento Cards de Insumos en Bodega:** 3 tarjetas superiores para Chips NTAG vírgenes, Viniles adhesivos impresos y Semáforo de punto de reorden óptimo. | `Preaprobada` | `mockup_bento_tab3_hardware.png` (Fila 1) | Tabla `hardware_inventory` |
| **UI-HW-02** | **Generador de Pliegos para Imprenta:** Interfaz con selector de unidades (100, 250, 500), rango automático de folios (ej. TAG-0501 a TAG-0750) y botón de descarga de vector PDF/SVG con guías de corte y suaje. | `Preaprobada` | `mockup_bento_tab3_hardware.png` (Card Central) | Tabla `print_batches` |
| **UI-HW-03** | **Activador Express en Mesa (In-Situ):** Asistente paso a paso para el instalador (1. Escanear QR del vinil -> 2. Asignar restaurante y mesa -> 3. Grabar chip NFC en 3s). Descuenta stock automáticamente. | `Preaprobada` | `mockup_bento_tab3_hardware.png` (Card Inferior) | RPC `activate_table_tag_in_situ` |
| **UI-HW-04** | **Gestor de Reposición por Desgaste:** Flujo para sustituir tags desgastados por desengrasante o sol, transfiriendo la mesa al nuevo código sin perder trazabilidad. | `Preaprobada` | `mockup_bento_tab4_finanzas.png` (Card Inferior) | RPC `replace_damaged_table_tag` |

---

### 💼 Módulo 2: Ventas & Pipeline Comercial B2B
| ID | Tarea UI / Componente | Estado | Mockup de Referencia | Infraestructura Backend |
| :--- | :--- | :--- | :--- | :--- |
| **UI-VT-01** | **Tablero Kanban Comercial B2B:** 4 columnas Bento con estilo claro (`Contactados`, `Demo de Placa NFC`, `Cotización / Cierre`, `Cerrados este mes`) con tarjetas de prospectos, valor MRR y kit upfront. | `Preaprobada` | `mockup_bento_tab2_ventas.png` (Card Superior) | Tabla `sales_leads` |
| **UI-VT-02** | **Módulo de Win-Back Automatizado:** Panel de monitoreo de campañas de recaptura para restaurantes en riesgo (Día 3 alerta de pérdida de escudo y Día 14 descuento vitalicio). | `Preaprobada` | `mockup_bento_tab2_ventas.png` (Card Izquierda) | Tabla `winback_campaign_logs` |
| **UI-VT-03** | **Métricas de Pauta Local:** Resumen de rendimiento de anunciantes con total de impresiones, clics y tasa de conversión de leads por zona. | `Preaprobada` | `mockup_bento_tab2_ventas.png` (Card Derecha) | Tablas `ads`, `coupons` |

---

### 💵 Módulo 3: Finanzas Reales, Cobranza Stripe/MP & EBITDA
| ID | Tarea UI / Componente | Estado | Mockup de Referencia | Infraestructura Backend |
| :--- | :--- | :--- | :--- | :--- |
| **UI-FN-01** | **Semáforo de Cobranza Mensual:** Lista tabular ejecutiva de restaurantes con estado de cobro en Stripe y Mercado Pago, alerta de fallos de pago y botón de dunning. | `Preaprobada` | `mockup_bento_tab4_finanzas.png` (Card Superior) | `organizations.subscription_status` |
| **UI-FN-02** | **Consola EBITDA en Vivo:** Desglose real entre ingresos brutos (SaaS + Kits de Hardware + Ads) y costos directos (COGS hardware, pasarelas de pago, hosting Supabase). | `Preaprobada` | `mockup_bento_tab1_resumen.png` (Card 1) | API `finances.getFinancialMetrics` |
| **UI-FN-03** | **Liquidación Automática:** Indicador de saldo Stripe listo para dispersión bancaria vía SPEI. | `Preaprobada` | `mockup_bento_tab4_finanzas.png` | Webhook Stripe |

---

### 🏛️ Módulo 4: Centro de Mando Ejecutivo (Resumen Bento)
| ID | Tarea UI / Componente | Estado | Mockup de Referencia | Infraestructura Backend |
| :--- | :--- | :--- | :--- | :--- |
| **UI-RS-01** | **KPI Card Facturación Mensual:** Tarjeta asimétrica Col-Span-5 con barra de progreso dividida por fuente de ingresos. | `Preaprobada` | `mockup_bento_tab1_resumen.png` | Vista agregada |
| **UI-RS-02** | **Mini-Widgets de Stock y Pipeline:** Tarjetas cuadradas de lectura rápida con accesos directos a los módulos operativos. | `Preaprobada` | `mockup_bento_tab1_resumen.png` | `hardware_inventory`, `sales_leads` |
| **UI-RS-03** | **Feed de Eventos en Directo:** Línea de tiempo con pastillas interactivas que reflejan escaneos, pagos recibidos y órdenes corporativas en tiempo real. | `Preaprobada` | `mockup_bento_tab1_resumen.png` | Supabase Realtime |

---

### 🧭 Módulos Existentes en Bento Light (Alineación de Navegación)
| ID | Módulo Existente | Adaptación Bento Light | Ruta Actual |
| :--- | :--- | :--- | :--- |
| **UI-EX-01** | **Restaurantes** | Vista tipo Bento con tarjetas de sucursales, estado de suscripción, logo y acceso rápido al portal. | `/admin/restaurants` |
| **UI-EX-02** | **Tags NFC & QR** | Lista y cuadrícula Bento de placas con indicador de lote físico, mesa asignada y volumen de escaneos. | `/admin/tags` |
| **UI-EX-03** | **Red de Anuncios** | Auditoría visual de banners, anunciantes locales activos y distribución de cupones. | `/admin/ads` |
| **UI-EX-04** | **Cobertura Territorial** | Mapa interactivo de zonas de cobertura metropolitana y densidad de colocación de placas. | `/admin/cobertura` |
| **UI-EX-05** | **Mesa de Ayuda B2B** | Bandeja de tickets de soporte con acción rápida para reemplazo de viniles dañados. | `/admin/soporte` |

---

## 🎨 Galería de Archivos de Bocetos Renderizados
* **Resumen:** `mockup_bento_tab1_resumen.png`
* **Ventas & Pipeline:** `mockup_bento_tab2_ventas.png`
* **Hardware & Imprenta:** `mockup_bento_tab3_hardware.png`
* **Finanzas & Cobranza:** `mockup_bento_tab4_finanzas.png`

