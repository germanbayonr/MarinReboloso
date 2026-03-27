const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// --- CONFIGURACIÓN ---
const LOCAL_IMAGES_PATH = '/Users/Wincoaching1/Proyectos Desarrollador/MAREBO WEB';
const CDN_BASE_URL = 'https://marebo.b-cdn.net/';

// Carga manual de variables de entorno desde .env.local
function loadEnv() {
  const filePath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[❌ ERROR] Faltan credenciales de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- UTILIDADES DE LIMPIEZA (FUZZY MATCHING) ---

function fuzzyClean(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
    .replace(/\.[^/.]+$/, "") // Quitar extensión si existe
    .replace(/[^a-z]/g, "") // ELIMINAR TODO LO QUE NO SEA LETRA (números, espacios, guiones, símbolos)
    .replace(/copia|copy|web|editada|final|whatsapp|image/gi, "") // Quitar ruido de palabras comunes
    .trim();
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      if (/\.(png|jpg|jpeg|webp|gif|svg|avif|PNG|JPG|JPEG)$/i.test(file)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });
  return arrayOfFiles;
}

// --- CORE ---

async function smartImageLinker() {
  console.log('🚀 Iniciando Smart Image Linker (Fuzzy Matching)...');

  // 1. Obtener productos de Supabase
  const { data: products, error } = await supabase.from('products').select('id, name, image_url');
  if (error) throw error;
  console.log(`📦 ${products.length} productos en Supabase.`);

  // 2. Escanear archivos locales
  const localFiles = getAllFiles(LOCAL_IMAGES_PATH);
  console.log(`🔍 ${localFiles.length} archivos en el repositorio de Bunny.`);

  // 3. Crear Mapa de Productos por nombre fuzzy
  const productFuzzyMap = new Map();
  products.forEach(p => {
    const cleaned = fuzzyClean(p.name);
    if (cleaned) {
      if (!productFuzzyMap.has(cleaned)) {
        productFuzzyMap.set(cleaned, { id: p.id, name: p.name, urls: [] });
      }
    }
  });

  // 4. Emparejar archivos con productos (Variantes)
  localFiles.forEach(filePath => {
    const filename = path.basename(filePath);
    const cleanedFile = fuzzyClean(filename);
    
    // Verificamos si este archivo "limpio" coincide con algún producto "limpio"
    if (productFuzzyMap.has(cleanedFile)) {
      const relPath = path.relative(LOCAL_IMAGES_PATH, filePath);
      // Solo encodeamos los segmentos del path para la URL final de Bunny
      const bunnyPath = relPath.split(path.sep).map(s => encodeURIComponent(s)).join('/');
      const finalUrl = `${CDN_BASE_URL}${bunnyPath}`;
      
      productFuzzyMap.get(cleanedFile).urls.push(finalUrl);
    }
  });

  // 5. Ejecutar UPDATES (Tierra Quemada)
  console.log('\n--- 📊 ACTUALIZACIÓN DE CATÁLOGO ---');
  let totalUpdated = 0;
  const updateTable = [];

  for (const [fuzzyName, data] of productFuzzyMap.entries()) {
    if (data.urls.length > 0) {
      // Eliminamos duplicados si existen
      const uniqueUrls = Array.from(new Set(data.urls));
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: uniqueUrls })
        .eq('id', data.id);

      if (updateError) {
        console.error(`   ❌ Error en ${data.name}:`, updateError.message);
      } else {
        totalUpdated++;
        updateTable.push({
          Producto: data.name,
          Fuzzy: fuzzyName,
          Variantes: uniqueUrls.length
        });
      }
    }
  }

  if (updateTable.length > 0) {
    console.table(updateTable.slice(0, 20)); // Mostrar los primeros 20 para el log
    if (updateTable.length > 20) console.log(`... y ${updateTable.length - 20} productos más.`);
    console.log(`\n✅ Sincronización completa. ${totalUpdated} productos actualizados con sus variantes.`);
  } else {
    console.log('\n✅ No se encontraron nuevos matches. El catálogo ya está optimizado.');
  }
}

smartImageLinker().catch(err => console.error('\n💥 FATAL ERROR:', err));
