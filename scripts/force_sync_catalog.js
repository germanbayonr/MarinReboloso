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
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey || !stripeSecretKey) {
  console.error('[❌ ERROR] Faltan credenciales en .env.local');
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

function cleanDisplayName(filename) {
  let name = filename.replace(/\.[^/.]+$/, "");
  name = name.replace(/[-_ ]*(copia|copy|web|editada|final)/gi, "");
  name = name.replace(/[-_ ]+\d+$/g, "").replace(/\d+$/g, "");
  return name.trim();
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

function detectCollection(filePath) {
  const normalized = filePath.toLowerCase();
  if (normalized.includes('descara')) return 'descara';
  if (normalized.includes('corales')) return 'corales';
  if (normalized.includes('filipa')) return 'filipa';
  if (normalized.includes('marebo')) return 'marebo';
  return 'marebo'; // Default
}

function detectCategory(filename) {
  const n = filename.toLowerCase();
  if (n.includes('manton')) return 'mantones';
  if (n.includes('collar') || n.includes('gargantilla')) return 'collares';
  if (n.includes('pulsera') || n.includes('brazalete')) return 'pulseras';
  if (n.includes('bolso') || n.includes('clutch')) return 'bolsos';
  if (n.includes('peinecillo')) return 'peinecillos';
  if (n.includes('broche')) return 'broches';
  return 'pendientes'; // Default
}

// --- CORE ---

async function fetchAllStripeProducts() {
  let products = [];
  let hasMore = true;
  let startingAfter = undefined;

  while (hasMore) {
    const response = await stripe.products.list({ 
      limit: 100, 
      starting_after: startingAfter,
      active: true 
    });
    products.push(...response.data);
    hasMore = response.has_more;
    if (hasMore) startingAfter = response.data[response.data.length - 1].id;
  }
  return products;
}

async function forceSyncCatalog() {
  console.log('🚀 Iniciando Auditoría y Creación Masiva...');

  // 1. Obtener datos de todas las fuentes
  const stripeProducts = await fetchAllStripeProducts();
  const { data: supabaseProducts, error: sbError } = await supabase.from('products').select('name, id');
  if (sbError) throw sbError;
  
  const localFiles = getAllFiles(LOCAL_BASE_PATH);
  console.log(`🔍 ${localFiles.length} archivos locales detectados.`);

  // Mapear Supabase por nombre normalizado
  const supabaseSet = new Set(supabaseProducts.map(p => normalizeName(p.name)));
  
  // Mapear Stripe por nombre normalizado
  const stripeMap = new Map();
  stripeProducts.forEach(p => {
    stripeMap.set(normalizeName(p.name), p);
  });

  const rescued = [];

  // 2. Filtrar archivos que NO están en Supabase
  const missingInSupabase = new Map(); // normalizado -> fileData
  
  localFiles.forEach(filePath => {
    const filename = path.basename(filePath);
    const norm = normalizeName(filename);
    
    // Solo procesamos archivos que NO están en Supabase
    if (!supabaseSet.has(norm)) {
      // Ignorar archivos que no son imágenes reales de producto (ej: InstaX, capturas)
      // Pero permitimos Magnolia, Aurora, Bloom que mencionaste
      const isProduct = !norm.startsWith('insta') && !norm.startsWith('whatsapp') && !norm.startsWith('captura');
      
      if (isProduct) {
        if (!missingInSupabase.has(norm)) {
          missingInSupabase.set(norm, {
            filePath,
            filename,
            norm,
            displayName: cleanDisplayName(filename)
          });
        }
      }
    }
  });

  console.log(`💡 Detectados ${missingInSupabase.size} productos faltantes en la web.`);

  // 3. Procesar cada producto faltante
  for (const [normName, data] of missingInSupabase.entries()) {
    try {
      const relPath = path.relative(LOCAL_BASE_PATH, data.filePath);
      // Normalización crítica de la URL: solo encodeamos los segmentos del path
      const url = `${CDN_BASE_URL}${relPath.split(path.sep).map(s => encodeURIComponent(s)).join('/')}`;
      
      // Para la DB queremos la URL final que Bunny entienda, que es la encodeada
      // Pero si el usuario pidió decodeURIComponent para evitar dobles encodings, 
      // lo aplicamos con cuidado. Bunny prefiere espacios como %20.
      const finalUrl = url; // Mantenemos la URL encodeada para compatibilidad total con CDNs

      let stripeP = stripeMap.get(normName);
      let stripeProductId, stripePriceId;

      if (stripeP) {
        // PASO B: Existe en Stripe
        stripeProductId = stripeP.id;
        stripePriceId = stripeP.default_price;
      } else {
        // PASO C: No existe en Stripe, crear
        const newStripeP = await stripe.products.create({
          name: data.displayName,
          images: [finalUrl],
          default_price_data: { currency: 'eur', unit_amount: DEFAULT_PRICE * 100 }
        });
        stripeProductId = newStripeP.id;
        stripePriceId = newStripeP.default_price;
      }

      // PASO D: Inserción en Supabase
      const { error: insErr } = await supabase.from('products').insert([{
        name: data.displayName,
        image_url: [finalUrl],
        price: DEFAULT_PRICE,
        stripe_product_id: stripeProductId,
        stripe_price_id: stripePriceId,
        collection: detectCollection(data.filePath),
        category: detectCategory(data.filename),
        is_new_arrival: false
      }]);

      if (insErr) {
        console.error(`   ❌ Error insertando ${data.displayName}: ${insErr.message}`);
      } else {
        rescued.push({
          Nombre: data.displayName,
          Coleccion: detectCollection(data.filePath),
          Categoria: detectCategory(data.filename),
          StripeID: stripeProductId
        });
      }
    } catch (e) {
      console.error(`   ❌ Error procesando ${data.displayName}: ${e.message}`);
    }
  }

  if (rescued.length > 0) {
    console.log('\n--- 📊 PRODUCTOS RESCATADOS Y SUBIDOS A LA WEB ---');
    console.table(rescued);
    console.log(`✅ Total rescatados: ${rescued.length}`);
  } else {
    console.log('\n✅ No se encontraron productos faltantes. El catálogo está sincronizado.');
  }
}

forceSyncCatalog().catch(err => console.error('\n💥 FATAL ERROR:', err));
