const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// --- CONFIGURACIÓN ---
const LOCAL_BASE_PATH = '/Users/Wincoaching1/Proyectos Desarrollador/MAREBO WEB';
const CDN_BASE_URL = 'https://marebo.b-cdn.net/';
const DEFAULT_PRICE = 25; // 25€

// Carga de variables de entorno manual
function loadEnv() {
  const filePath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(filePath)) {
    console.error(`[❌ ERROR] No se encontró el archivo .env.local en ${filePath}`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  console.log('--- DEBUG ENV LOAD (Detailed) ---');
  const lines = content.split(/\r?\n/);
  console.log(`Total lines: ${lines.length}`);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      console.log(`Line ${index + 1}: Skip (Empty or Comment)`);
      return;
    }
    console.log(`Line ${index + 1}: [${line}]`);
    const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
      console.log(`  MATCHED -> Key: [${key}], Value Length: ${value.length}`);
    } else {
      console.log(`  FAILED MATCH`);
    }
  });
  console.log('--- END DEBUG ---');
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nwpjxibuaxclzogatfcl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53cGp4aWJ1YXhjbHpvZ2F0ZmNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjU4NjQzMiwiZXhwIjoyMDg4MTYyNDMyfQ.v2aYJCpDkLw7q3d4R3UrNCVvmcIxhEsryrf7iL8Vuio';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey || !stripeSecretKey) {
  console.error('[❌ ERROR] Faltan credenciales en .env.local');
  console.log('Valores detectados:');
  console.log('URL:', supabaseUrl ? 'OK' : 'MISSING');
  console.log('KEY:', supabaseKey ? 'OK' : 'MISSING');
  console.log('STRIPE:', stripeSecretKey ? 'OK' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const stripe = new Stripe(stripeSecretKey);

// --- UTILIDADES ---

function normalizeName(filename) {
  // 1. Quitar extensión y pasar a minúsculas
  let name = filename.replace(/\.[^/.]+$/, "").toLowerCase();
  // 2. Quitar acentos/tildes
  name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // 3. Quitar palabras clave irrelevantes
  name = name.replace(/[-_ ]*(copia|copy|web|editada|final)/g, "");
  // 4. Quitar números finales precedidos de espacio o guion
  name = name.replace(/[-_ ]+\d+$/g, "").replace(/\d+$/g, "");
  return name.trim();
}

function isMainImage(filename) {
  const base = filename.replace(/\.[^/.]+$/, "");
  return !(/[-_ ]+\d+$/.test(base) || /\d+$/.test(base));
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

async function fetchAllStripeProducts() {
  let products = [];
  let hasMore = true;
  let startingAfter = undefined;

  process.stdout.write('📥 Descargando productos de Stripe...');
  while (hasMore) {
    const response = await stripe.products.list({ 
      limit: 100, 
      starting_after: startingAfter,
      active: true 
    });
    products.push(...response.data);
    hasMore = response.has_more;
    if (hasMore) startingAfter = response.data[response.data.length - 1].id;
    process.stdout.write('.');
  }
  console.log(`\n✅ ${products.length} productos obtenidos de Stripe.`);
  return products;
}

async function smartAuditSync() {
  console.log('🚀 Iniciando Auditoría y Sincronización Triple...');

  // 1. Obtener datos de todas las fuentes
  const stripeProducts = await fetchAllStripeProducts();
  const { data: supabaseProducts, error: sbError } = await supabase.from('products').select('*');
  if (sbError) throw sbError;
  
  const localFiles = getAllFiles(LOCAL_BASE_PATH);
  console.log(`🔍 ${localFiles.length} archivos locales detectados.`);

  // 2. Mapear datos para búsqueda rápida
  const stripeMap = new Map(); // normalizado -> stripeProduct
  stripeProducts.forEach(p => {
    stripeMap.set(normalizeName(p.name), p);
  });

  const supabaseMap = new Map(); // normalizado -> supabaseProduct
  supabaseProducts.forEach(p => {
    supabaseMap.set(normalizeName(p.name), p);
  });

  // 3. Agrupar imágenes locales por nombre normalizado
  const localGroups = new Map();
  localFiles.forEach(filePath => {
    const filename = path.basename(filePath);
    const norm = normalizeName(filename);
    const relPath = path.relative(LOCAL_BASE_PATH, filePath);
    const url = `${CDN_BASE_URL}${relPath.split(path.sep).map(s => encodeURIComponent(s)).join('/')}`;
    
    if (!localGroups.has(norm)) localGroups.set(norm, []);
    localGroups.get(norm).push({ filename, url, isMain: isMainImage(filename) });
  });

  // Ordenar: Principal primero
  for (const [_, imgs] of localGroups.entries()) {
    imgs.sort((a, b) => (a.isMain === b.isMain ? 0 : a.isMain ? -1 : 1));
  }

  const stats = { linked: 0, variantsAdded: 0, created: 0 };

  // 4. Procesar cada grupo local
  for (const [normName, imgs] of localGroups.entries()) {
    const urls = imgs.map(i => i.url);
    const stripeP = stripeMap.get(normName);
    const supabaseP = supabaseMap.get(normName);

    const displayName = stripeP ? stripeP.name : normName.charAt(0).toUpperCase() + normName.slice(1);

    if (stripeP && !supabaseP) {
      // CASO 1: Existe en Stripe pero NO en Supabase (Vincular)
      console.log(`🔗 [VINCULAR] ${displayName} (Stripe ID: ${stripeP.id})`);
      const { error: insErr } = await supabase.from('products').insert([{
        name: displayName,
        image_url: urls,
        price: DEFAULT_PRICE, // Por defecto si no lo tenemos
        stripe_product_id: stripeP.id,
        stripe_price_id: stripeP.default_price,
        category: 'accesorios'
      }]);
      if (insErr) console.error(`   ❌ Error vinculando: ${insErr.message}`);
      else stats.linked++;

    } else if (stripeP && supabaseP) {
      // CASO 2: Existe en ambos (Actualizar galería)
      const { error: updErr } = await supabase.from('products').update({
        image_url: urls
      }).eq('id', supabaseP.id);
      
      if (updErr) console.error(`   ❌ Error actualizando galería de ${displayName}: ${updErr.message}`);
      else {
        // console.log(`📸 [GALERÍA] ${displayName} (${urls.length} fotos)`);
        stats.variantsAdded++;
      }

    } else if (!stripeP && !supabaseP) {
      // CASO 3: No existe en ninguna parte (Crear totalmente nuevo)
      console.log(`✨ [NUEVO] Creando ${displayName} en Stripe y Supabase...`);
      try {
        const newStripeP = await stripe.products.create({
          name: displayName,
          images: [urls[0]],
          default_price_data: { currency: 'eur', unit_amount: DEFAULT_PRICE * 100 }
        });

        const { error: insErr } = await supabase.from('products').insert([{
          name: displayName,
          image_url: urls,
          price: DEFAULT_PRICE,
          stripe_product_id: newStripeP.id,
          stripe_price_id: newStripeP.default_price,
          category: 'accesorios'
        }]);
        if (insErr) console.error(`   ❌ Error insertando nuevo: ${insErr.message}`);
        else stats.created++;
      } catch (e) {
        console.error(`   ❌ Error Stripe: ${e.message}`);
      }
    }
  }

  console.log('\n--- 📊 REPORTE FINAL DE AUDITORÍA ---');
  console.log(`✅ ${stats.linked} productos vinculados (ya existían en Stripe y ahora están en la web)`);
  console.log(`📸 ${stats.variantsAdded} productos actualizados con sus variantes/galería`);
  console.log(`✨ ${stats.created} productos totalmente nuevos creados`);
  console.log('-------------------------------------');
}

smartAuditSync().catch(err => console.error('\n💥 FATAL ERROR:', err));
