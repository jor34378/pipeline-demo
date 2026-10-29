const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function iniciarScrapingYGeneracion() {
    console.log("🚀 Abriendo navegador automatizado...");
    
    const browser = await puppeteer.launch({ 
        headless: false, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();

    // 📌 CAMBIA AQUÍ LA BÚSQUEDA Y LA ZONA CUANDO QUIERAS (Ej: "barberias en Barcelona", "peluquerias en Madrid")
    const busqueda = "barberias en Barcelona"; 
    console.log(`🔍 Buscando: ${busqueda} en Google Maps...`);
    
    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(busqueda)}`, { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
    });

    try {
        await page.waitForSelector('div[role="feed"]', { timeout: 10000 });
    } catch (e) {
        console.log("⚠️ Cargando resultados principales...");
    }

    // Hacer scroll para capturar más locales
    await hacerScrollEnMaps(page, 4);

    const localesExtraidos = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('div[role="feed"] > div > div[jsaction]'));
        
        return items.map(item => {
            const nombreEl = item.querySelector('.fontHeadlineSmall');
            const ariaLabel = item.querySelector('span[role="img"]')?.getAttribute('aria-label') || "4.8";
            
            // Extraer texto del bloque para sacar dirección aproximada
            const textoCompleto = item.innerText.split('\n');
            const direccion = textoCompleto.length > 2 ? textoCompleto[2] : "Barcelona, España";

            // Extraer calificación numérica si existe en el texto
            let rating = "4.8";
            let reseñas = "50+";
            if (ariaLabel) {
                const matchRating = ariaLabel.match(/([0-9.,]+)/);
                if (matchRating) rating = matchRating[1];
                const matchResenas = ariaLabel.match(/de ([0-9.,]+) opiniones/i) || ariaLabel.match(/([0-9]+) opiniones/i);
                if (matchResenas) reseñas = matchResenas[1];
            }

            return {
                nombre: nombreEl ? nombreEl.innerText : "Negocio Local",
                direccion: direccion,
                rating: rating,
                reseñas: reseñas,
                telefono: "34600000000" // Teléfono por defecto para conectar a WhatsApp de forma limpia
            };
        }).filter(l => l.nombre !== "Negocio Local");
    });

    await browser.close();
    console.log(`✅ ¡Se extrajeron ${localesExtraidos.length} locales reales con éxito!`);

    if (localesExtraidos.length === 0) {
        console.log("❌ No se encontraron locales.");
        return;
    }

    generarDemosDesdeDatos(localesExtraidos);
}

async function hacerScrollEnMaps(page, veces) {
    const selectorFeed = 'div[role="feed"]';
    for (let i = 0; i < veces; i++) {
        await page.evaluate((selector) => {
            const feed = document.querySelector(selector);
            if (feed) feed.scrollTop = feed.scrollHeight;
        }, selectorFeed);
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
}

function generarDemosDesdeDatos(locales) {
    const dirSalida = path.join(__dirname, 'output-demos');
    if (!fs.existsSync(dirSalida)) {
        fs.mkdirSync(dirSalida, { recursive: true });
    }

    const plantillaPath = path.join(__dirname, 'plantilla-base.html');
    const plantilla = fs.readFileSync(plantillaPath, 'utf8');

    locales.forEach(local => {
        const slug = local.nombre.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        
        let htmlCompilado = plantilla
            .replace(/{{NOMBRE_NEGOCIO}}/g, local.nombre)
            .replace(/{{DIRECCION}}/g, local.direccion)
            .replace(/{{RATING}}/g, local.rating)
            .replace(/{{RESEÑAS}}/g, local.reseñas)
            .replace(/{{TELEFONO_CLEAN}}/g, local.telefono)
            .replace(/{{NOMBRE_ENCODED}}/g, encodeURIComponent(local.nombre));

        const carpetaNegocio = path.join(dirSalida, slug);
        if (!fs.existsSync(carpetaNegocio)) {
            fs.mkdirSync(carpetaNegocio, { recursive: true });
        }

        fs.writeFileSync(path.join(carpetaNegocio, 'index.html'), htmlCompilado);
        console.log(`🚀 Demo sobria y profesional generada para: ${local.nombre}`);
    });

    console.log("\n✨ ¡Todas las páginas listas en /output-demos/!");
}

iniciarScrapingYGeneracion();