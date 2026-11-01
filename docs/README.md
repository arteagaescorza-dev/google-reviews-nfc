# 🧭 Índice Maestro de Documentación Coordinada (`/docs`)

Bienvenido al repositorio central de conocimiento, arquitectura y especificaciones de la plataforma **Google Reseñas NFC, Red Publicitaria Local & Hardware SaaS**. 

Toda la documentación está organizada de acuerdo con el [**Framework Documental Maestro v2.0 (FDM)**](./FRAMEWORK_DOCUMENTAL.md), estructurada en **5 Capas Sistémicas Coordinadas**:
* [**POLITICAS_DEL_SISTEMA.md**](./POLITICAS_DEL_SISTEMA.md): Registro oficial de directrices irrevocables activadas por el comando *Quedo inamovible / Vuelvelo politica* (Zero-Custody, Bento Light, Trazabilidad de Hardware, etc.).

---

```mermaid
graph LR
    FDM["📘 FRAMEWORK_DOCUMENTAL.md (v2.0)"] --> C1["🏭 1. Hardware, Imprenta & Logística"]
* [**POLITICAS_DEL_SISTEMA.md**](./POLITICAS_DEL_SISTEMA.md): Registro oficial de directrices irrevocables activadas por el comando *Quedo inamovible / Vuelvelo politica* (Zero-Custody, Bento Light, Trazabilidad de Hardware, etc.).
    FDM --> C2["📱 2. Front Comensal (Punto de Contacto)"]
    FDM --> C3["👨‍🍳 3. Portal Suscriptor / Local"]
    FDM --> C4["🏛️ 4. Superadministrador Bento Grid"]
    FDM --> C5["🛡️ 5. Infraestructura, Seguridad & Zero-Custody"]
```

---

## 🗂️ Directorio de Documentos por Capa Sistémica

### 📘 0. Metodología y Marco de Trabajo
* [**`FRAMEWORK_DOCUMENTAL.md`**](./FRAMEWORK_DOCUMENTAL.md): Estándar FDM v2.0 que unifica las 5 capas del sistema (hardware, comensal, portal, superadmin e infraestructura), matrices de trazabilidad y ciclo de vida de especificaciones.
* [**POLITICAS_DEL_SISTEMA.md**](./POLITICAS_DEL_SISTEMA.md): Registro oficial de directrices irrevocables activadas por el comando *Quedo inamovible / Vuelvelo politica* (Zero-Custody, Bento Light, Trazabilidad de Hardware, etc.).

---

### 🏭 Capa 1: Hardware, Producción en Imprenta & Logística de Campo
* [**`TAREAS_UI_SUPERADMIN.md`**](./TAREAS_UI_SUPERADMIN.md): Registro de componentes de stock de bodega, generador de pliegos de vinil para imprenta y activador express in-situ.
* [**`GUIA_OPERATIVA.md`**](./GUIA_OPERATIVA.md): Manual de campo e inducción operativa para programar chips NFC físicos con NFC Tools, vincular códigos QR y colocar viniles en mesas.
* [**`supabase/migrations/20261101_superadmin_infrastructure.sql`**](../supabase/migrations/20261101_superadmin_infrastructure.sql): Esquema de base de datos para `hardware_inventory`, `print_batches`, trazabilidad de desgaste y RPC de activación in-situ.

---

### 📱 Capa 2: Punto de Contacto Comensal (Front Público PWA)
* [**`SPEC.md`**](./SPEC.md): Especificación integral de la plataforma (Filtro 5★ de Google vs buzón de quejas 1-3★, carta digital y flujo en mesa).
* [**`SPEC_INFRAESTRUCTURA_CUPONES.md`**](./SPEC_INFRAESTRUCTURA_CUPONES.md): Motor de cupones de descuento digitales de un solo uso, entrega al comensal y validación en mostrador.
* [**`SPEC_UTILIDAD_MULTIGIRO.md`**](./SPEC_UTILIDAD_MULTIGIRO.md): Módulos multi-giro (WiFi zero-password, pre-orden, rachas de visita) para gimnasios, consultorios y spas.

---

### 👨‍🍳 Capa 3: Operación en Local (Portal del Suscriptor)
* [**`SPEC_PORTAL_SUSCRIPTOR.md`**](./SPEC_PORTAL_SUSCRIPTOR.md): Especificación funcional del Portal del Dueño/Gerente (`/portal`), gestión de quejas en Inbox Zero y personalización de enlaces.
* [**`MASTER_PLAN_PORTAL_SUSCRIPTOR.md`**](./MASTER_PLAN_PORTAL_SUSCRIPTOR.md): Plan de ejecución de fases del portal (Mi Cuenta, Fallback inmediato a Maps y métricas ponderadas).
* [**`SPEC_MESA_AYUDA_Y_ANUNCIOS_ADMIN.md`**](./SPEC_MESA_AYUDA_Y_ANUNCIOS_ADMIN.md): Mesa de ayuda B2B para que los locatarios soliciten soporte o más placas NFC.

---

### 🏛️ Capa 4: Superadministrador Bento Grid (Light Theme) & Negocio
* [**`TAREAS_UI_SUPERADMIN.md`**](./TAREAS_UI_SUPERADMIN.md): Catálogo de tareas de interfaz Bento Grid Light preaprobadas para Dirección, Ventas, Hardware y Finanzas.
* [**`SPEC_ARQUITECTURA_FINANCIERA.md`**](./SPEC_ARQUITECTURA_FINANCIERA.md): Modelo financiero de MRR, costos de operación (COGS hardware, servidores, WhatsApp) y cálculo de EBITDA.
* [**`SPEC_ESQUEMA_OFERTA_Y_ESCALERA_VALOR.md`**](./SPEC_ESQUEMA_OFERTA_Y_ESCALERA_VALOR.md): Estructura de oferta comercial, kits de placas NFC a $100 MXN y 3 niveles de suscripción de software.
* [**`SPEC_GTM_ESTRATEGIA_ADOPCION_3_ETAPAS.md`**](./SPEC_GTM_ESTRATEGIA_ADOPCION_3_ETAPAS.md): Estrategia de despliegue Go-To-Market en 3 etapas para conquistar polos gastronómicos.
* [**`SPEC_RED_PUBLICITARIA.md`**](./SPEC_RED_PUBLICITARIA.md): Red de anuncios patrocinados locales, modelo CPM/CPC y atribución cerrada (closed-loop).
* [**`SPEC_GESTION_ORGANIZACIONES.md`**](./SPEC_GESTION_ORGANIZACIONES.md): Onboarding y administración multi-sucursal de clientes en el panel general.

---

### 🛡️ Capa 5: Infraestructura Técnica, Seguridad & Deuda Resuelta
* [**`DEUDA_TECNICA.md`**](./DEUDA_TECNICA.md): Inventario de deuda técnica y nuevas capacidades (19 ítems verificados y resueltos: seguridad RLS, comandas KDS, turnero 4K, delivery corporativo, pasarelas y CRM).
* [**`SECURITY_AUDIT.md`**](./SECURITY_AUDIT.md): Evaluación de vulnerabilidades OWASP API Security Top 10, políticas RLS de Supabase y prevención de mass-assignment.
* [**`ROADMAP.md`**](./ROADMAP.md): Hoja de ruta estratégica de producto e iniciativas futuras.

---

## 🔄 Reglas de Coordinación y Mantenimiento

1. **Sincronización Continua:** Cualquier cambio que afecte el flujo físico (imprenta/hardware), el portal o el Superadmin debe registrarse primero en el documento de especificación correspondiente antes de programar.
2. **Coherencia Backend:** Ningún componente front debe mostrar datos que no tengan persistencia o cálculo en Supabase (`schema.sql` y migraciones).
3. **Control de Versiones:** Los avances se documentan y verifican con pruebas automatizadas (`npm run test`) antes de realizar commits en Git.
