/**
 * MIGRACIÓN CLIENTES — Jumpseller CSV → clientes_historial
 *
 * Importa 1.285 clientes activos (omite el deshabilitado).
 * No crea cuentas de login — solo datos de referencia para autocompletar checkout.
 * Resumible: saltar emails ya existentes con ON CONFLICT DO NOTHING.
 *
 * Uso: node backend/scripts/migrate-customers.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { parse } = require('csv-parse/sync');
const { Pool }  = require('pg');
const fs        = require('fs');

// ── Config ────────────────────────────────────────────────────────────────────
const CSV_PATH = 'C:\\Users\\suppo\\Downloads\\calzados-olivia-merino_customers(1286)_2026-03-27.csv';

// ── DB Pool ───────────────────────────────────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'Olivia',
  user:     process.env.DB_USER     || 'olivia_user',
  password: String(process.env.DB_PASSWORD || ''),
});

// ── Helper: parsear fecha CSV "dd-mm-yyyy hh:mm:ss" → Date o null ─────────────
function parseDate(str) {
  if (!str || !str.trim()) return null;
  // Formato: "05-09-2023 11:50:20"
  const [datePart, timePart] = str.trim().split(' ');
  if (!datePart) return null;
  const [day, month, year] = datePart.split('-');
  if (!day || !month || !year) return null;
  const iso = `${year}-${month}-${day}${timePart ? 'T' + timePart : ''}`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV no encontrado: ${CSV_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parse(content, { columns: true, skip_empty_lines: true, relax_quotes: true });
  console.log(`📄 CSV cargado: ${rows.length} clientes`);

  const client = await pool.connect();
  let insertados = 0;
  let omitidos   = 0;
  let duplicados = 0;

  try {
    await client.query('BEGIN');

    for (const row of rows) {
      const email  = (row['Email'] || '').trim().toLowerCase();
      const status = (row['Status'] || '').trim().toLowerCase();

      // Omitir sin email o deshabilitados
      if (!email) { omitidos++; continue; }
      if (status === 'disabled') { omitidos++; continue; }

      const nombre        = (row['Shipping Name']    || row['Billing Name']    || '').trim();
      const apellido      = (row['Shipping Surname'] || row['Billing Surname'] || '').trim();
      const telefono      = (row['Phone'] || '').trim() || null;
      const direccion     = (row['Shipping Address'] || row['Billing Address'] || '').trim() || null;
      const direccionApt  = (row['Shipping Apartment house door etc. '] || row['Billing Apartment house door etc. '] || '').trim() || null;
      const ciudad        = (row['Shipping City']    || row['Billing City']    || '').trim() || null;
      const codigoPostal  = (row['Shipping Postal Code'] || row['Billing Postal Code'] || '').trim() || null;
      const region        = (row['Shipping Region']  || row['Billing Region']  || '').trim() || null;
      const municipio     = (row['Shipping Municipality'] || row['Billing Municipality'] || '').trim() || null;
      const pais          = (row['Shipping Country'] || row['Billing Country'] || 'Chile').trim() || 'Chile';
      const totalOrdenes  = parseInt(row['Total Number of Orders'] || '0', 10) || 0;
      const ordenesPagadas = parseInt(row['Number of Paid Orders'] || '0', 10) || 0;
      const primeraOrden  = parseDate(row['First Order Date']);
      const ultimaOrden   = parseDate(row['Last Order Date']);
      const fechaCreacion = parseDate(row['Created At']);

      const { rowCount } = await client.query(
        `INSERT INTO clientes_historial
           (email, nombre, apellido, telefono, direccion, direccion_apt,
            ciudad, codigo_postal, region, municipio, pais,
            total_ordenes, ordenes_pagadas, primera_orden, ultima_orden, fecha_creacion)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (email) DO NOTHING`,
        [email, nombre, apellido, telefono, direccion, direccionApt,
         ciudad, codigoPostal, region, municipio, pais,
         totalOrdenes, ordenesPagadas, primeraOrden, ultimaOrden, fechaCreacion]
      );

      if (rowCount > 0) {
        insertados++;
      } else {
        duplicados++;
      }
    }

    await client.query('COMMIT');

    console.log('\n─────────────────────────────────────────');
    console.log('✅ Migración de clientes completada:');
    console.log(`   • Insertados   : ${insertados}`);
    console.log(`   • Duplicados   : ${duplicados}`);
    console.log(`   • Omitidos     : ${omitidos} (deshabilitados o sin email)`);
    console.log('─────────────────────────────────────────');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error — ROLLBACK completo');
    console.error(`   ${err.message}`);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('❌ Error fatal:', err.message);
  process.exit(1);
});
