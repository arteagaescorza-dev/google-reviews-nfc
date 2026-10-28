import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error('❌ Error: SUPABASE_DB_URL no está definido en el archivo .env');
  process.exit(1);
}

console.log('🔄 Conectando a Supabase PostgreSQL...');

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    console.log('✅ ¡Conexión exitosa a Supabase PostgreSQL!');

    const schemaPath = path.resolve(__dirname, '../supabase/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('📄 Aplicando schema.sql (tablas, RLS, funciones, índices)...');
    await client.query(schemaSql);
    console.log('✅ ¡Esquema de base de datos aplicado correctamente!');

    // Check if tables exist
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('📋 Tablas creadas en public schema:');
    res.rows.forEach(r => console.log('   - ' + r.table_name));

    // Also run seed if restaurants table is empty
    const countRes = await client.query('SELECT count(*) FROM restaurants');
    if (parseInt(countRes.rows[0].count) === 0) {
      console.log('🌱 Base de datos vacía. Aplicando seed.sql (datos iniciales de prueba)...');
      const seedPath = path.resolve(__dirname, '../supabase/seed.sql');
      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf-8');
        await client.query(seedSql);
        console.log('✅ ¡Datos iniciales (seed.sql) insertados con éxito!');
      }
    } else {
      console.log(`ℹ️ La base de datos ya contiene ${countRes.rows[0].count} restaurantes.`);
    }

  } catch (err) {
    console.error('❌ Error ejecutando migración:', err.message);
    if (err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT') || err.message.includes('tenant')) {
      console.log('\n💡 Tip de conexión: En algunas redes sin IPv6, Supabase requiere usar el Connection Pooler (puerto 6543 o 5432 con aws-0-us-east-1.pooler.supabase.com).');
    }
  } finally {
    await client.end();
  }
}

run();

