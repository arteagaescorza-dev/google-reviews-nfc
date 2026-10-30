import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error('❌ Error: SUPABASE_DB_URL no está definido en el archivo .env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    console.log('✅ Conectado a Supabase PostgreSQL');

    console.log('🔄 1. Creando tabla organization_members...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS organization_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(organization_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
    `);

    console.log('🔄 2. Actualizando tabla feedback (columna internal_notes y estado resolved)...');
    await client.query(`
      ALTER TABLE feedback ADD COLUMN IF NOT EXISTS internal_notes TEXT DEFAULT NULL;
      
      -- Actualizar check constraint de status si existe
      DO $$
      BEGIN
        ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_status_check;
        ALTER TABLE feedback ADD CONSTRAINT feedback_status_check CHECK (status IN ('new', 'reviewed', 'contacted', 'resolved'));
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
    `);

    console.log('🔄 3. Creando funciones auxiliares para RLS...');
    await client.query(`
      -- Función para verificar si un usuario es superadministrador
      CREATE OR REPLACE FUNCTION is_superadmin()
      RETURNS BOOLEAN
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      AS $$
        SELECT EXISTS (
          SELECT 1 FROM auth.users 
          WHERE id = auth.uid() 
          AND (
            email = 'arteagaescorza@gmail.com'
            OR (raw_user_meta_data->>'role') = 'superadmin'
          )
        );
      $$;

      -- Función para obtener los IDs de organizaciones a las que pertenece el usuario
      CREATE OR REPLACE FUNCTION get_user_organization_ids()
      RETURNS SETOF UUID
      LANGUAGE sql
      STABLE
      SECURITY DEFINER
      AS $$
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
      $$;
    `);

    console.log('🔄 4. Actualizando políticas RLS...');
    await client.query(`
      ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

      -- Políticas para organization_members
      DROP POLICY IF EXISTS "Superadmin full access to org_members" ON organization_members;
      CREATE POLICY "Superadmin full access to org_members"
      ON organization_members FOR ALL
      TO authenticated
      USING (is_superadmin())
      WITH CHECK (is_superadmin());

      DROP POLICY IF EXISTS "Members can view their own membership" ON organization_members;
      CREATE POLICY "Members can view their own membership"
      ON organization_members FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());

      -- Políticas para organizations
      DROP POLICY IF EXISTS "Admin full access to organizations" ON organizations;
      DROP POLICY IF EXISTS "Superadmin full access to organizations" ON organizations;
      CREATE POLICY "Superadmin full access to organizations"
      ON organizations FOR ALL
      TO authenticated
      USING (is_superadmin())
      WITH CHECK (is_superadmin());

      DROP POLICY IF EXISTS "Members view their organizations" ON organizations;
      CREATE POLICY "Members view their organizations"
      ON organizations FOR SELECT
      TO authenticated
      USING (id IN (SELECT get_user_organization_ids()));

      -- Políticas para restaurants
      DROP POLICY IF EXISTS "Admin full access to restaurants" ON restaurants;
      DROP POLICY IF EXISTS "Superadmin full access to restaurants" ON restaurants;
      CREATE POLICY "Superadmin full access to restaurants"
      ON restaurants FOR ALL
      TO authenticated
      USING (is_superadmin())
      WITH CHECK (is_superadmin());

      DROP POLICY IF EXISTS "Members view their restaurants" ON restaurants;
      CREATE POLICY "Members view their restaurants"
      ON restaurants FOR SELECT
      TO authenticated
      USING (organization_id IN (SELECT get_user_organization_ids()));

      DROP POLICY IF EXISTS "Members update their restaurants" ON restaurants;
      CREATE POLICY "Members update their restaurants"
      ON restaurants FOR UPDATE
      TO authenticated
      USING (organization_id IN (SELECT get_user_organization_ids()))
      WITH CHECK (organization_id IN (SELECT get_user_organization_ids()));

      -- Políticas para feedback
      DROP POLICY IF EXISTS "Admin full access to feedback" ON feedback;
      DROP POLICY IF EXISTS "Superadmin full access to feedback" ON feedback;
      CREATE POLICY "Superadmin full access to feedback"
      ON feedback FOR ALL
      TO authenticated
      USING (is_superadmin())
      WITH CHECK (is_superadmin());

      DROP POLICY IF EXISTS "Members view their feedback" ON feedback;
      CREATE POLICY "Members view their feedback"
      ON feedback FOR SELECT
      TO authenticated
      USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
      ));

      DROP POLICY IF EXISTS "Members update their feedback" ON feedback;
      CREATE POLICY "Members update their feedback"
      ON feedback FOR UPDATE
      TO authenticated
      USING (restaurant_id IN (
        SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
      ))
      WITH CHECK (restaurant_id IN (
        SELECT id FROM restaurants WHERE organization_id IN (SELECT get_user_organization_ids())
      ));
    `);

    console.log('✅ ¡Migración de base de datos y RLS aplicada con éxito!');
  } catch (err) {
    console.error('❌ Error durante la migración:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();

