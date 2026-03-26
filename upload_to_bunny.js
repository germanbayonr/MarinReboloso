const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// --- CONFIGURACIÓN ---
const STORAGE_ZONE_NAME = 'marebo';
const ACCESS_KEY = 'aec94d08-d1ee-4c88-a1ee97752b3b-f13a-4301';

// RUTA CORREGIDA PARA MAC (Sin la C:/)
const LOCAL_BASE_PATH = '/Users/Wincoaching1/Proyectos Desarrollador/MAREBO WEB';
// --- FIN CONFIGURACIÓN ---

async function getFiles(dir) {
    let results = [];
    const list = await fs.readdir(dir, { withFileTypes: true });
    for (const file of list) {
        const fullPath = path.resolve(dir, file.name);
        if (file.isDirectory()) {
            results = results.concat(await getFiles(fullPath));
        } else {
            // Ignoramos archivos ocultos de Mac (.DS_Store)
            if (!file.name.startsWith('.')) {
                results.push(fullPath);
            }
        }
    }
    return results;
}

async function run() {
    console.log("🔍 Verificando ruta en tu Mac: ", LOCAL_BASE_PATH);

    try {
        await fs.access(LOCAL_BASE_PATH);
    } catch (e) {
        console.error(`❌ ERROR: No encuentro la carpeta. ¿Estás seguro de que se llama 'MAREBO WEB'?`);
        return;
    }

    try {
        const files = await getFiles(LOCAL_BASE_PATH);
        console.log(`📁 Encontrados ${files.length} archivos. Iniciando subida a Bunny...`);

        for (const filePath of files) {
            // Mantiene la estructura de carpetas (ej: accesorios/foto.png)
            const relativePath = path.relative(LOCAL_BASE_PATH, filePath);
            const bunnyPath = relativePath.split(path.sep).join('/'); 
            const url = `https://storage.bunnycdn.com/${STORAGE_ZONE_NAME}/${bunnyPath}`;
            
            console.log(`⏳ Subiendo: ${bunnyPath}...`);
            
            const fileStream = await fs.readFile(filePath);
            
            await axios.put(url, fileStream, {
                headers: {
                    'AccessKey': ACCESS_KEY,
                    'Content-Type': 'application/octet-stream'
                }
            });
            console.log(`   ✔️  Éxito.`);
        }
        
        console.log('🏁 ¡TODAS LAS FOTOS SUBIDAS A BUNNY.NET CON ÉXITO!');
        
    } catch (error) {
        console.error('❌ ERROR DURANTE LA SUBIDA:');
        console.error(error.response ? error.response.data : error.message);
    }
}

// ESTA ES LA LÍNEA MÁGICA QUE FALTABA PARA QUE ARRANQUE
run();