/**
 * FASE 2 — Migración de imágenes: Jumpseller CDN → Cloudinary
 * 
 * Lee el CSV, extrae todas las URLs de imágenes de productos (excluyendo accesorios),
 * las sube a Cloudinary y guarda el mapa en image-map.json para usar en Fase 3/4.
 * 
 * Uso: node backend/scripts/migrate-images.js
 * 
 * El script es resumible: si se interrumpe, releerá image-map.json y saltará URLs ya subidas.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { parse } = require('csv-parse/sync');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────────────
const CSV_PATH = 'C:\\Users\\suppo\\Downloads\\calzados-olivia-merino_productos_2026-03-27 (1).csv';
const MAP_PATH = path.join(__dirname, 'image-map.json');
const EXCLUDED_CATEGORY = 'Amplus joyas de autor';
const CLOUDINARY_FOLDER = 'olivia-merino/productos';
const SAVE_EVERY = 10; // Guardar el mapa cada N uploads (resumen de progreso)

// ── Cloudinary ───────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function urlToPublicId(url) {
  // Extraer nombre de archivo sin extensión para usar como public_id
  try {
    const parsed = new URL(url);
    const basename = path.basename(parsed.pathname).replace(/\.[^.]+$/, '');
    // Limpiar caracteres que Cloudinary no acepta
    return basename.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 80);
  } catch {
    return `product_${Date.now()}`;
  }
}

function saveMap(map) {
  fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 2), 'utf8');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Leer CSV
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ No se encontró el CSV en: ${CSV_PATH}`);
    process.exit(1);
  }
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const records = parse(content, { columns: true, skip_empty_lines: true, relax_quotes: true });
  console.log(`📄 CSV cargado: ${records.length} filas`);

  // 2. Recolectar URLs únicas (excluir accesorios)
  const imageUrls = new Set();
  let skippedAccessory = 0;

  for (const row of records) {
    const cat = (row['Categories'] || '').trim();
    if (cat.includes(EXCLUDED_CATEGORY)) {
      skippedAccessory++;
      continue;
    }
    const images = (row['Images'] || '').trim();
    if (!images) continue;
    images.split(',').map(u => u.trim()).filter(Boolean).forEach(u => imageUrls.add(u));
  }

  console.log(`🖼️  URLs únicas a migrar: ${imageUrls.size} (${skippedAccessory} filas de accesorios ignoradas)`);

  // 3. Cargar mapa existente (para reanudar si fue interrumpido)
  let imageMap = {};
  if (fs.existsSync(MAP_PATH)) {
    imageMap = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
    const alreadyDone = Object.keys(imageMap).length;
    if (alreadyDone > 0) {
      console.log(`♻️  Reanudando: ${alreadyDone} imágenes ya migradas anteriormente`);
    }
  }

  // 4. Subir imágenes a Cloudinary
  const urlArray = [...imageUrls];
  const total = urlArray.length;
  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < urlArray.length; i++) {
    const url = urlArray[i];

    // Ya existe en el mapa → saltar
    if (imageMap[url]) {
      skipped++;
      continue;
    }

    const publicId = urlToPublicId(url);

    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: CLOUDINARY_FOLDER,
        public_id: publicId,
        overwrite: false,
        resource_type: 'image',
      });

      imageMap[url] = result.secure_url;
      uploaded++;
      console.log(`[${i + 1}/${total}] ✓ ${publicId}`);
    } catch (err) {
      errors++;
      // Si el public_id ya existe en Cloudinary, intentar buscar la URL existente
      if (err.http_code === 409 || (err.message && err.message.includes('already exists'))) {
        // Cloudinary retorna la URL existente si overwrite=false y hay conflicto de nombre
        // Intentar obtenerla
        try {
          const info = await cloudinary.api.resource(`${CLOUDINARY_FOLDER}/${publicId}`);
          imageMap[url] = info.secure_url;
          uploaded++;
          console.log(`[${i + 1}/${total}] ♻️  Ya existía en Cloudinary: ${publicId}`);
        } catch {
          console.error(`[${i + 1}/${total}] ❌ Error (y no se pudo recuperar): ${url} — ${err.message}`);
        }
      } else {
        console.error(`[${i + 1}/${total}] ❌ Error: ${url} — ${err.message}`);
      }
    }

    // Guardar mapa cada SAVE_EVERY operaciones
    if ((uploaded + errors) % SAVE_EVERY === 0 && (uploaded + errors) > 0) {
      saveMap(imageMap);
      console.log(`   💾 Mapa guardado (${Object.keys(imageMap).length} entradas)`);
    }
  }

  // 5. Guardar mapa final
  saveMap(imageMap);

  console.log('\n─────────────────────────────────────────');
  console.log(`✅ Migración completada:`);
  console.log(`   • Subidas nuevas : ${uploaded}`);
  console.log(`   • Ya existían    : ${skipped}`);
  console.log(`   • Errores        : ${errors}`);
  console.log(`   • Mapa guardado  : ${MAP_PATH}`);
  console.log('─────────────────────────────────────────');

  if (errors > 0) {
    console.log('\n⚠️  Hay errores. Vuelve a correr el script para reintentar las URLs fallidas.');
    console.log('   Las imágenes exitosas ya están guardadas y se saltarán en el próximo intento.');
  } else {
    console.log('\n🚀 Listo para Fase 3/4: correr migrate-products.js');
  }
}

main().catch(err => {
  console.error('❌ Error fatal:', err.message);
  process.exit(1);
});
