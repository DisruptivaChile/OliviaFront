/**
 * FASE 3 + 4 — Parsear CSV e insertar productos en la BD
 *
 * Prerequisitos:
 *   - Fase 1 completada (columnas en_oferta, precio_original y tipo Botas en BD)
 *   - Fase 2 completada (image-map.json en backend/scripts/)
 *
 * Uso: node backend/scripts/migrate-products.js
 * 
 * El script envuelve todo en una transacción. Si falla → rollback completo.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { parse } = require('csv-parse/sync');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────────────
const CSV_PATH  = 'C:\\Users\\suppo\\Downloads\\calzados-olivia-merino_productos_2026-03-27 (1).csv';
const MAP_PATH  = path.join(__dirname, 'image-map.json');
const EXCLUDED_CATEGORY = 'Amplus joyas de autor';

// IDs de tipos_zapato
const TIPO = { Zapatos: 1, Sandalias: 2, Botines: 3, Botas: 4 };

// IDs de temporadas
const TEMPORADA_PRIMAVERA = 4;

// Mapa talla nombre → talla_id
const TALLA_ID = { '34': 1, '35': 2, '36': 3, '37': 4, '38': 5, '39': 6, '40': 7, '41': 8 };

// ── DB Pool ──────────────────────────────────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'Olivia',
  user:     process.env.DB_USER     || 'olivia_user',
  password: String(process.env.DB_PASSWORD || ''),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convierte caracteres matemáticos unicode a ASCII legible */
function cleanUnicode(str) {
  if (!str) return str;
  return [...str].map(char => {
    const cp = char.codePointAt(0);
    // Mathematical Bold Italic Uppercase: U+1D468–U+1D481 → A-Z
    if (cp >= 0x1D468 && cp <= 0x1D481) return String.fromCharCode(0x41 + (cp - 0x1D468));
    // Mathematical Bold Italic Lowercase: U+1D482–U+1D49B → a-z
    if (cp >= 0x1D482 && cp <= 0x1D49B) return String.fromCharCode(0x61 + (cp - 0x1D482));
    // Mathematical Sans-Serif Bold Italic Uppercase: U+1D63C–U+1D655 → A-Z
    if (cp >= 0x1D63C && cp <= 0x1D655) return String.fromCharCode(0x41 + (cp - 0x1D63C));
    // Mathematical Sans-Serif Bold Italic Lowercase: U+1D656–U+1D66F → a-z
    if (cp >= 0x1D656 && cp <= 0x1D66F) return String.fromCharCode(0x61 + (cp - 0x1D656));
    // Mathematical Bold Uppercase: U+1D400–U+1D419 → A-Z
    if (cp >= 0x1D400 && cp <= 0x1D419) return String.fromCharCode(0x41 + (cp - 0x1D400));
    // Mathematical Bold Lowercase: U+1D41A–U+1D433 → a-z
    if (cp >= 0x1D41A && cp <= 0x1D433) return String.fromCharCode(0x61 + (cp - 0x1D41A));
    return char;
  }).join('');
}

/** Elimina etiquetas HTML y decodifica entidades básicas */
function stripHtml(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, ' ')       // eliminar tags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s{2,}/g, ' ')        // colapsar espacios
    .trim();
}

/** Determina tipo_id a partir de la categoría del producto */
function detectTipo(category) {
  const cat = cleanUnicode(category || '').toLowerCase();
  if (cat.includes('botines')) return TIPO.Botines;
  if (cat.includes('botas'))   return TIPO.Botas;
  if (cat.includes('sandalias') || cat.includes('sandalia')) return TIPO.Sandalias;
  return TIPO.Zapatos;
}

/** Detecta si es "a pedido" por nombre o categoría */
function detectAPedido(name, category) {
  const n = cleanUnicode(name || '').toLowerCase();
  const c = cleanUnicode(category || '').toLowerCase();
  return (
    n.includes('a pedido') ||
    n.includes('pedido') ||
    c.includes('a pedido')
  );
}

/** Detecta si está en oferta y devuelve { enOferta, precioOriginal } */
function detectOferta(name, compareAtPrice) {
  const n = cleanUnicode(name || '').toLowerCase();
  const compareNum = parseFloat((compareAtPrice || '').replace(/[^0-9.]/g, '')) || 0;

  // Si CSV tiene precio original en "Compare at price" → es oferta con precio original real
  if (compareNum > 0) {
    return { enOferta: true, precioOriginal: compareNum };
  }

  // Si nombre indica oferta/descuento/aniversario
  const isOfertaByName = (
    n.includes('oferta') ||
    n.includes('descuento') ||
    n.includes('aniversario')
  );
  return { enOferta: isOfertaByName, precioOriginal: null };
}

/** Detecta si es temporada Primavera (NUEVA TEMPORADA) */
function detectTemporada(category) {
  const c = cleanUnicode(category || '').toLowerCase();
  if (c.includes('nueva temporada')) return TEMPORADA_PRIMAVERA;
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Verificar prerequisitos
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV no encontrado: ${CSV_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(MAP_PATH)) {
    console.error(`❌ image-map.json no encontrado. Ejecuta migrate-images.js primero.`);
    process.exit(1);
  }

  // 2. Cargar datos
  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  const records = parse(csvContent, { columns: true, skip_empty_lines: true, relax_quotes: true });
  const imageMap = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));

  console.log(`📄 CSV: ${records.length} filas`);
  console.log(`🖼️  Mapa de imágenes: ${Object.keys(imageMap).length} URLs`);

  // 3. Contar productos existentes (se saltarán por permalink duplicado)
  const { rows: existentes } = await pool.query('SELECT COUNT(*)::int AS n FROM zapatos WHERE permalink IS NOT NULL');
  if (existentes[0].n > 0) {
    console.log(`ℹ️  BD ya tiene ${existentes[0].n} productos migrados — se saltarán los permalinks duplicados.`);
  }

  // 4. Agrupar filas por Permalink
  const productMap = new Map(); // permalink → [rows]
  for (const row of records) {
    const permalink = (row['Permalink'] || '').trim();
    if (!permalink) continue;
    if (!productMap.has(permalink)) productMap.set(permalink, []);
    productMap.get(permalink).push(row);
  }

  console.log(`📦 Productos únicos en CSV: ${productMap.size}`);

  // 5. Conectar y comenzar transacción
  const client = await pool.connect();
  let insertados = 0;
  let omitidos   = 0;
  let errores    = 0;

  try {
    await client.query('BEGIN');

    for (const [permalink, rows] of productMap) {
      const firstRow = rows[0];

      // 5a. Excluir accesorios
      const category = (firstRow['Categories'] || '').trim();
      if (category.includes(EXCLUDED_CATEGORY)) {
        omitidos++;
        continue;
      }

      // 5b. Extraer datos del producto
      const rawName     = (firstRow['Name'] || '').trim();
      const nombre      = cleanUnicode(rawName).substring(0, 150);
      const descripcion = stripHtml(firstRow['Description'] || '');
      const rawPrice    = (firstRow['Price'] || '0').replace(/[^0-9.]/g, '');
      const precio      = parseFloat(rawPrice) || 0;
      const compareAt   = firstRow['Compare at price'] || '';
      const status      = (firstRow['Status'] || '').toLowerCase();
      const publicado   = status === 'active' || status === 'activo';
      const imagesRaw   = (firstRow['Images'] || '').trim();

      // 5c. Detecciones
      const tipo_id      = detectTipo(category);
      const temporada_id = detectTemporada(category);
      const es_a_pedido  = detectAPedido(rawName, category);
      const { enOferta, precioOriginal } = detectOferta(rawName, compareAt);

      // 5d. Insertar en zapatos (saltar si permalink ya existe)
      const { rows: zapRows } = await client.query(
        `INSERT INTO zapatos
           (nombre, tipo_id, precio, temporada_id, es_a_pedido, publicado, descripcion, en_oferta, precio_original, permalink)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (permalink) DO NOTHING
         RETURNING id`,
        [nombre, tipo_id, precio, temporada_id, es_a_pedido, publicado, descripcion || null, enOferta, precioOriginal, permalink]
      );
      if (!zapRows[0]) {
        omitidos++;
        continue; // permalink ya existía
      }
      const zapato_id = zapRows[0].id;

      // 5e. Insertar imágenes (usando image-map.json)
      if (imagesRaw) {
        const imageUrls = imagesRaw.split(',').map(u => u.trim()).filter(Boolean);
        for (let idx = 0; idx < imageUrls.length; idx++) {
          const originalUrl = imageUrls[idx];
          const cloudinaryUrl = imageMap[originalUrl];
          if (!cloudinaryUrl) {
            console.warn(`   ⚠️  Sin Cloudinary URL para: ${originalUrl}`);
            continue;
          }
          const esPrincipal = idx === 0;
          await client.query(
            `INSERT INTO zapato_imagenes (zapato_id, ruta_imagen, es_principal, orden_display)
             VALUES ($1, $2, $3, $4)`,
            [zapato_id, cloudinaryUrl, esPrincipal, idx]
          );
        }
      }

      // 5f. Insertar tallas (una fila CSV por talla)
      for (const row of rows) {
        const tallaVal = (row['Variant 1 Option Value'] || '').trim();
        const stockVal = parseInt(row['Stock'] || '0', 10);

        if (!tallaVal) continue;
        const talla_id = TALLA_ID[tallaVal];
        if (!talla_id) {
          console.warn(`   ⚠️  Talla desconocida "${tallaVal}" en ${permalink} — omitida`);
          continue;
        }

        await client.query(
          `INSERT INTO zapato_tallas (zapato_id, talla_id, stock)
           VALUES ($1, $2, $3)
           ON CONFLICT (zapato_id, talla_id) DO UPDATE SET stock = EXCLUDED.stock`,
          [zapato_id, talla_id, stockVal]
        );
      }

      insertados++;
      if (insertados % 20 === 0) {
        console.log(`   ✓ ${insertados} productos insertados...`);
      }
    }

    await client.query('COMMIT');

    console.log('\n─────────────────────────────────────────');
    console.log('✅ Migración completada:');
    console.log(`   • Productos insertados : ${insertados}`);
    console.log(`   • Omitidos (ya existían o accesorios): ${omitidos}`);
    console.log(`   • Errores              : ${errores}`);
    console.log('─────────────────────────────────────────');
    console.log('\n🚀 Listo para Fase 5: badge de oferta en el frontend.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error durante la migración — ROLLBACK completo');
    console.error(`   ${err.message}`);
    if (err.detail) console.error(`   Detalle: ${err.detail}`);
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
