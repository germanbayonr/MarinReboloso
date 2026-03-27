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

// --- UTILIDADES ---

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Filtrar por extensiones de imagen comunes
      if (/\.(png|jpg|jpeg|webp|gif|svg|avif|PNG|JPG|JPEG)$/i.test(file)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });
  return arrayOfFiles;
}

function normalizeForSearch(str) {
  if (!str) return '';
  return str.replace(/\.[^/.]+$/, "") // Quitar extensión
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
            .trim();
}

// --- CORE ---

async function fixExtensions() {
  console.log('🚀 Iniciando Sincronización Quirúrgica de Extensiones...');

  // 1. Obtener todos los archivos locales
  const localFiles = getAllFiles(LOCAL_IMAGES_PATH);
  console.log(`🔍 ${localFiles.length} archivos locales detectados.`);

  // 2. Obtener todos los productos de Supabase para comparar
  const { data: products, error } = await supabase.from('products').select('id, name, image_url');
  if (error) {
    console.error('[❌ ERROR] No se pudieron obtener los productos:', error.message);
    return;
  }
  console.log(`📦 ${products.length} productos encontrados en Supabase.`);

  let repairedCount = 0;
  const logTable = [];

  // 3. Procesar cada archivo local
  for (const filePath of localFiles) {
    const filename = path.basename(filePath);
    const normalizedLocalName = normalizeForSearch(filename);

    // Buscar coincidencia en Supabase
    const matchedProduct = products.find(p => normalizeForSearch(p.name) === normalizedLocalName);

    if (matchedProduct) {
      // Generar ruta exacta de Bunny
      const relativePath = path.relative(LOCAL_IMAGES_PATH, filePath);
      // Solo encodeamos los segmentos, manteniendo la estructura de carpetas y extensión real
      const bunnyPath = relativePath.split(path.sep).map(segment => encodeURIComponent(segment)).join('/');
      const finalUrl = `${CDN_BASE_URL}${bunnyPath}`;

      // Verificar si ya tiene esa URL exacta (evitar updates innecesarios)
      const currentImages = Array.isArray(matchedProduct.image_url) 
        ? matchedProduct.image_url 
        : (matchedProduct.image_url ? [matchedProduct.image_url] : []);
      
      if (!currentImages.includes(finalUrl)) {
        // ACCIÓN ÚNICA: Actualizar EXCLUSIVAMENTE image_url
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: [finalUrl] })
          .eq('id', matchedProduct.id);

        if (updateError) {
          console.error(`   ❌ Error actualizando ${matchedProduct.name}:`, updateError.message);
        } else {
          repairedCount++;
          logTable.push({
            Producto: matchedProduct.name,
            ArchivoReal: filename,
            NuevaURL: finalUrl.substring(0, 80) + '...'
          });
        }
      }
    }
  }

  // 4. Salida
  if (repairedCount > 0) {
    console.log('\n--- 📊 REPORTE DE REPARACIÓN DE EXTENSIONES ---');
    console.table(logTable);
    console.log(`\n✅ Se han reparado ${repairedCount} URLs de imágenes con su extensión exacta.`);
  } else {
    console.log('\n✅ No se encontraron desajustes de extensión. Todas las URLs coinciden con los archivos reales.');
  }
}

fixExtensions().catch(err => console.error('\n💥 FATAL ERROR:', err));
