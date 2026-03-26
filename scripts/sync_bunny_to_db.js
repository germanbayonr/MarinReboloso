const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuración de rutas y variables
const LOCAL_BASE_PATH = '/Users/Wincoaching1/Proyectos Desarrollador/MAREBO WEB';
const CDN_BASE_URL = 'https://marebo.b-cdn.net/';
const ENV_PATH = path.join(process.cwd(), '.env.local');

// Función simple para cargar variables de entorno desde .env.local sin dependencias externas
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`[❌ ERROR] No se encontró el archivo .env.local en ${filePath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

loadEnv(ENV_PATH);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('[❌ ERROR] Faltan las credenciales de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Lee recursivamente todos los archivos de un directorio
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Solo nos interesan archivos de imagen
      if (/\.(png|jpg|jpeg|webp|gif|svg|avif|png|PNG|JPG|JPEG)$/i.test(file)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

async function sync() {
  console.log('🚀 Iniciando sincronización de imágenes a Bunny.net...');
  console.log(`📂 Ruta local: ${LOCAL_BASE_PATH}`);
  
  if (!fs.existsSync(LOCAL_BASE_PATH)) {
    console.error(`[❌ ERROR] La ruta local no existe: ${LOCAL_BASE_PATH}`);
    return;
  }

  const allFiles = getAllFiles(LOCAL_BASE_PATH);
  console.log(`🔍 Se han encontrado ${allFiles.length} imágenes locales.`);

  let updatedCount = 0;
  let orphanCount = 0;
  let errorCount = 0;

  for (const filePath of allFiles) {
    // 1. Obtener ruta relativa desde LOCAL_BASE_PATH
    const relativePath = path.relative(LOCAL_BASE_PATH, filePath);
    
    // 2. Generar URL de Bunny (codificando cada segmento para evitar problemas con espacios)
    const urlSegments = relativePath.split(path.sep).map(segment => encodeURIComponent(segment));
    const bunnyUrl = `${CDN_BASE_URL}${urlSegments.join('/')}`;

    // 3. Extraer el nombre del producto (sin extensión)
    const fileName = path.basename(filePath);
    const productName = fileName.replace(/\.[^/.]+$/, "");

    try {
      // 4. Buscar en la base de datos (ILIKE para ser insensitivo a mayúsculas/minúsculas)
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name')
        .ilike('name', productName)
        .limit(1);

      if (error) throw error;

      if (products && products.length > 0) {
        const product = products[0];
        
        // 5. Realizar UPDATE del campo image_url
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: bunnyUrl })
          .eq('id', product.id);

        if (updateError) throw updateError;

        console.log(`[✅ ACTUALIZADO] ${product.name} -> ${bunnyUrl}`);
        updatedCount++;
      } else {
        console.warn(`[⚠️ HUÉRFANO] No existe producto en DB para el archivo: ${fileName} (Buscado como: "${productName}")`);
        orphanCount++;
      }
    } catch (err) {
      console.error(`[❌ ERROR] Procesando ${fileName}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n--- Resumen de Sincronización ---');
  console.log(`✅ Actualizados: ${updatedCount}`);
  console.log(`⚠️ Huérfanos: ${orphanCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log('---------------------------------');
}

sync();
