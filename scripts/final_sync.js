const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// Configuración
const LOCAL_BASE_PATH = '/Users/Wincoaching1/Proyectos Desarrollador/MAREBO WEB';
const CDN_BASE_URL = 'https://marebo.b-cdn.net/';
const DEFAULT_PRICE = 25; // 25€

// Carga de variables de entorno manual para evitar dependencias
function loadEnv() {
  const filePath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  });
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey || !stripeSecretKey) {
  console.error('[❌ ERROR] Faltan credenciales en .env.local (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, STRIPE_SECRET_KEY)');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[⚠️ ADVERTENCIA] No se encontró SUPABASE_SERVICE_ROLE_KEY. Se usará la clave ANON, lo cual podría fallar si las políticas de RLS no permiten actualizaciones.');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const stripe = new Stripe(stripeSecretKey);

/**
 * Normaliza el nombre del archivo para matching
 */
function normalizeName(filename) {
  // 1. Quitar extensión y pasar a minúsculas
  let name = filename.replace(/\.[^/.]+$/, "").toLowerCase();
  
  // 2. Quitar acentos/tildes
  name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // 3. Quitar palabras clave como 'copia', 'copy'
  name = name.replace(/[-_ ]*copia/g, "").replace(/[-_ ]*copy/g, "");
  
  // 4. Quitar números finales (ej: ' 2', ' 3', '2', '3')
  // Solo quitamos números si van precedidos de espacio o están al final
  name = name.replace(/\s+\d+$/g, "").replace(/\d+$/g, "");
  
  return name.trim();
}

/**
 * Determina si es la imagen principal (sin números en el nombre original)
 */
function isMainImage(filename) {
  const base = filename.replace(/\.[^/.]+$/, "");
  // Si no contiene números al final del nombre base, es la principal
  return !(/\s+\d+$/.test(base) || /\d+$/.test(base));
}

/**
 * Lee archivos recursivamente
 */
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

async function runSync() {
  console.log('🚀 Iniciando Sincronización Final (Supabase Array + Stripe)...');

  const files = getAllFiles(LOCAL_BASE_PATH);
  console.log(`🔍 Encontrados ${files.length} archivos locales.`);

  // Agrupar imágenes por nombre normalizado
  const groups = new Map();
  files.forEach(filePath => {
    const filename = path.basename(filePath);
    const normalized = normalizeName(filename);
    const relativePath = path.relative(LOCAL_BASE_PATH, filePath);
    const urlSegments = relativePath.split(path.sep).map(s => encodeURIComponent(s));
    const bunnyUrl = `${CDN_BASE_URL}${urlSegments.join('/')}`;
    
    if (!groups.has(normalized)) {
      groups.set(normalized, []);
    }
    
    groups.get(normalized).push({
      original: filename,
      url: bunnyUrl,
      isMain: isMainImage(filename)
    });
  });

  // Ordenar grupos: la principal primero
  for (const [name, imgs] of groups.entries()) {
    imgs.sort((a, b) => {
      if (a.isMain && !b.isMain) return -1;
      if (!a.isMain && b.isMain) return 1;
      return a.original.localeCompare(b.original);
    });
  }

  // Obtener productos actuales de Supabase
  const { data: existingProducts, error: fetchError } = await supabase
    .from('products')
    .select('id, name, image_url');

  if (fetchError) {
    console.error('[❌ ERROR] Error al obtener productos:', fetchError);
    return;
  }

  const stats = {
    updated: 0,
    created: 0,
    ignored: 0
  };

  // Mapear productos existentes por nombre normalizado para búsqueda rápida
  const productMap = new Map();
  existingProducts.forEach(p => {
    productMap.set(normalizeName(p.name), p);
  });

  for (const [normName, imgs] of groups.entries()) {
    const urls = imgs.map(i => i.url);
    const existing = productMap.get(normName);

    if (existing) {
      // ACTUALIZAR PRODUCTO EXISTENTE
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_url: urls })
        .eq('id', existing.id);

      if (updateError) {
        console.error(`[❌ ERROR] Error actualizando ${existing.name}:`, updateError.message);
      } else {
        console.log(`[📸 GALERÍA] Actualizada galería para: ${existing.name} (${urls.length} fotos)`);
        stats.updated++;
      }
    } else {
      // CREAR PRODUCTO HUÉRFANO
      console.log(`[✨ HUÉRFANO] Creando nuevo producto para: ${normName}`);
      
      try {
        // 1. Crear en Stripe
        const displayName = normName.charAt(0).toUpperCase() + normName.slice(1);
        const stripeProduct = await stripe.products.create({
          name: displayName,
          images: [urls[0]], // Stripe solo acepta una imagen principal
          default_price_data: {
            currency: 'eur',
            unit_amount: DEFAULT_PRICE * 100,
          },
        });

        // 2. Insertar en Supabase
        const { error: insertError } = await supabase
          .from('products')
          .insert([{
            name: displayName,
            image_url: urls,
            price: DEFAULT_PRICE,
            stripe_product_id: stripeProduct.id,
            stripe_price_id: stripeProduct.default_price,
            category: 'accesorios' // Categoría por defecto
          }]);

        if (insertError) {
          console.error(`[❌ ERROR] Error insertando ${displayName} en Supabase:`, insertError.message);
        } else {
          console.log(`[🆕 CREADO] Producto ${displayName} creado en Stripe y Supabase.`);
          stats.created++;
        }
      } catch (stripeErr) {
        console.error(`[❌ ERROR STRIPE] ${normName}:`, stripeErr.message);
      }
    }
  }

  console.log('\n--- RESUMEN FINAL ---');
  console.log(`✅ Productos actualizados con galería: ${stats.updated}`);
  console.log(`🆕 Nuevos productos creados: ${stats.created}`);
  console.log(`⚪ Archivos procesados: ${files.length}`);
  console.log('----------------------');
}

runSync();
