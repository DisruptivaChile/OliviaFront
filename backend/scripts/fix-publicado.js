require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs   = require('fs');
const { parse } = require('csv-parse/sync');
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'Olivia',
  user:     process.env.DB_USER     || 'olivia_user',
  password: String(process.env.DB_PASSWORD || ''),
});

const CSV_PATH = 'C:\\Users\\suppo\\Downloads\\calzados-olivia-merino_productos_2026-03-27 (1).csv';

async function run() {
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parse(content, { columns: true, skip_empty_lines: true, relax_quotes: true });

  // Status por permalink (primera fila de cada uno)
  const statusMap = {};
  for (const row of rows) {
    const permalink = (row['Permalink'] || '').trim();
    const status    = (row['Status'] || '').trim().toLowerCase();
    if (permalink && !statusMap[permalink]) statusMap[permalink] = status;
  }

  let publicados = 0, deshabilitados = 0, sinStatus = 0;
  for (const [permalink, status] of Object.entries(statusMap)) {
    const pub = status === 'available';
    if (status === 'disabled' || status === 'not-available') deshabilitados++;
    else if (pub) publicados++;
    else sinStatus++;
    await pool.query('UPDATE zapatos SET publicado = $1 WHERE permalink = $2', [pub, permalink]);
  }

  console.log(`Publicados: ${publicados} | No publicados: ${deshabilitados} | Sin status: ${sinStatus}`);
  await pool.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
