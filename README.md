# Plataforma NFC Google Reseñas & Red Publicitaria Local

Plataforma web ligera multi-sucursal diseñada para vincular tags físicos NFC y códigos QR en restaurantes y negocios locales, con el objetivo de multiplicar reseñas de 5 estrellas en Google, contener quejas de 1 a 3 estrellas en un buzón privado, y monetizar una red de micro-anuncios patrocinados.

Alojada al 100% en **GitHub Pages** (costo \$0 de infraestructura) y conectada a **Supabase** (PostgreSQL, Auth y Storage).

---

## Características Principales

- **4 Niveles de Servicio (Tiers):**
  - **Tier 1 (Enlace Directo):** Redirección rápida a Google Reseñas (con pantalla de 2.5s y anuncio si no es ad-free, o salto instantáneo si es ad-free).
  - **Tier 2 (Filtro de Reputación / Review Gating):** 4-5 estrellas van a Google Reseñas; 1-3 estrellas abren formulario privado para gerencia.
  - **Tier 3 (Filtro + Linktree de Marca):** Widget de estrellas + botones de acceso rápido (Menú digital, Instagram, Wi-Fi, WhatsApp).
  - **Tier 4 (Métricas Dinámicas por Mesa):** Conteo de escaneos y trazabilidad por mesa preparada en base de datos.
- **Red de Anuncios Integrada & Upsell Ad-Free:**
  - Venta de banners publicitarios en negocios que no pagan por eliminar anuncios.
  - Segmentación de anuncios: global, por restaurante o por tag específico.
  - Contabilizador de impresiones y clics.
- **Panel Administrativo Completo (`#/admin`):**
  - Gestión multi-marca y multi-sucursal.
  - Generador masivo de tags NFC con previsualización y descarga de códigos QR en PNG.
  - Buzón de quejas privadas con botón directo de contacto por WhatsApp.
  - Funciona de forma autónoma tanto en **Modo Demo Local** como conectado a la nube de **Supabase**.
- **Despliegue Continuo:**
  - Configurado con GitHub Actions (`.github/workflows/deploy.yml`) para publicarse en GitHub Pages con cada `git push`.

---

## Pila Tecnológica

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Enrutamiento:** React Router DOM (HashRouter) compatible 100% con GitHub Pages sin errores 404.
- **Backend / Base de Datos:** Supabase JS Client (`@supabase/supabase-js`) sobre PostgreSQL.
- **Generador de QR:** `qrcode.react`.

---

## Comandos Rápidos

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo local
npm run dev

# Compilar para producción (genera carpeta /dist)
npm run build

# Previsualizar la versión compilada
npm run preview
```

---

## Documentación del Proyecto

- 📄 [SPEC.md](docs/SPEC.md): Especificación técnica completa y arquitectura de datos.
- 📄 [nfc-google-reviews.md](docs/intent/nfc-google-reviews.md): Declaración de intención y modelo de negocio.
- 📄 [plan.md](tasks/plan.md): Plan técnico de implementación.
- 📄 [todo.md](tasks/todo.md): Lista de tareas y verificación.
- 📄 [GUIA_OPERATIVA.md](docs/GUIA_OPERATIVA.md): Manual operativo paso a paso (grabación física de chips NFC con NFC Tools, configuración de Supabase y venta a clientes).
