# Mapa de Ruta (Wayfinder): Sincronización Automática Supabase & GitHub Pages

**Archivo:** `tasks/plan-supabase-cicd.md`  
**Etiqueta:** `wayfinder:map`  
**Estado:** Frontier activo  

---

## 1. Destino (Destination)

Lograr que cada `git push origin main` ejecute un flujo unificado de CI/CD en GitHub Actions que:
1. Despliegue el frontend estático compilado en **GitHub Pages**.
2. Al mismo tiempo y de forma automatizada, sincronice y aplique las definiciones de tablas, funciones RPC y políticas RLS de `supabase/schema.sql` en la base de datos en la nube de **Supabase**, sin intervención manual y sin riesgo de pérdida de datos.

---

## 2. Notas y Preferencias (Notes)

- **Idempotencia:** Los scripts SQL deben poder ejecutarse mil veces consecutivas sin errores (`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS`).
- **Resiliencia:** Si el repositorio aún no tiene configurados los secretos de Supabase (modo demo), el despliegue a GitHub Pages debe continuar sin fallar.
- **Seguridad:** Ninguna contraseña ni URI con credenciales debe quedar registrada en el log de GitHub Actions ni en el historial de Git.

---

## 3. Decisiones Tomadas (Decisions So Far)

- **[Estructura SQL Idempotente](file:///c:/Users/Mickey/Documents/DEV/Google%20Reseñas/supabase/schema.sql):** El archivo `schema.sql` ya fue diseñado con sentencias defensivas (`IF NOT EXISTS`, `REPLACE FUNCTION`) aptas para pipelines continuos.
- **[Separación de Roles](file:///c:/Users/Mickey/Documents/DEV/Google%20Reseñas/SECURITY_MODEL.md):** La clave `anon` se inyecta en el build de Vite para el navegador, mientras que la conexión administrativa a la BD se ejecuta en el runner de GitHub Actions bajo un secreto aislado.

---

## 4. Tickets de Decisión (Frontier)

### Ticket 1 (Research & Design): Método de Conexión en GitHub Actions
- **Pregunta:** ¿Cuál es la forma más limpia y robusta de ejecutar el SQL en Supabase desde GitHub Actions?
- **Opciones:**
  - **Opción A (Recomendada): Runner con Cliente `psql` directo a la URI del Pooler de Supabase.**
    - *Cómo opera:* Usa la imagen o acción estándar de PostgreSQL conectándose a `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`.
    - *Ventaja:* Solo requiere **1 solo secreto** (`SUPABASE_DB_URL`). Es instantáneo (ejecuta en ~2 segundos) y aplica `supabase/schema.sql` de forma directa sin requerir generar access tokens de cuenta en Supabase.
  - **Opción B: Supabase CLI Oficial (`supabase/setup-cli@v1`).**
    - *Cómo opera:* Requiere token de acceso personal de Supabase (`SUPABASE_ACCESS_TOKEN`), vincular proyecto (`supabase link`) y correr `supabase db push`.
    - *Desventaja:* Requiere dividir el SQL en carpetas de migraciones numeradas (`supabase/migrations/20261028_init.sql`) y configurar 3 secretos en lugar de 1.
- **Decisión propuesta:** **Opción A** por simplicidad, velocidad y cero fricción operativa.

---

### Ticket 2 (Configuración): Mapeo de Secretos en GitHub Repository Secrets
- **Pregunta:** ¿Qué secretos exactos necesita GitHub Actions en `Settings -> Secrets -> Actions`?
- **Mapa de Secretos:**
  1. `VITE_SUPABASE_URL`: URL de la API (ej. `https://xyz.supabase.co`) -> Para compilar el frontend.
  2. `VITE_SUPABASE_ANON_KEY`: Clave pública `anon` -> Para compilar el frontend.
  3. `SUPABASE_DB_URL`: URI de conexión a la base de datos PostgreSQL (con contraseña) -> Para que el runner de Actions ejecute `schema.sql`.

---

### Ticket 3 (Workflow): Arquitectura de Jobs en `.github/workflows/deploy.yml`
- **Pregunta:** ¿Deben correr en el mismo Job o en Jobs paralelos/secuenciales?
- **Diseño propuesto:**
  - **Job 1: `sync-database` (Sincronización Supabase):**
    - Se ejecuta solo si el secreto `SUPABASE_DB_URL` está definido (`if: ${{ secrets.SUPABASE_DB_URL != '' }}`).
    - Corre el cliente `psql` para aplicar [supabase/schema.sql](file:///c:/Users/Mickey/Documents/DEV/Google%20Reseñas/supabase/schema.sql).
  - **Job 2: `deploy-pages` (Despliegue GitHub Pages):**
    - Corre en paralelo o después de `sync-database`.
    - Compila React/Vite y publica en GitHub Pages.

---

## 5. Fuera de Alcance (Out of Scope)

- Rollbacks destructivos automáticos (borrado de columnas existentes con `DROP COLUMN` sin confirmación): por seguridad, nunca se eliminarán columnas en caliente en producción; las migraciones siempre deben ser aditivas.
