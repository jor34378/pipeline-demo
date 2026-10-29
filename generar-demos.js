const fs = require('fs');
const path = require('path');

// 📌 1. DATOS EXTRAÍDOS DE GOOGLE MAPS
// (Podés pegar acá directo los locales que vas buscando)
const localesExtraidos = [
    {
        nombre: "3030 Barber - barberia",
        direccion: "Cuenca 3553, Caseros",
        rating: "4.8",
        reseñas: "73",
        telefono: "01124036205"
    },
    {
        nombre: "Dominican BarberShop Caseros",
        direccion: "Av. San Martín 1234, Caseros",
        rating: "4.8",
        reseñas: "196",
        telefono: "0111559430000"
    },
    {
        nombre: "R. I. Barber Shop",
        direccion: "Urquiza 2345, Caseros",
        rating: "5.0",
        reseñas: "65",
        telefono: "01140270263"
    }
];

// 📂 Crear directorio para guardar datos limpios e información en JSON
const dirSalida = path.join(__dirname, 'output-demos');
if (!fs.existsSync(dirSalida)) {
    fs.mkdirSync(dirSalida, { recursive: true });
}

// 📌 2. GUARDAR LOS DATOS LIMPIOS EN UN JSON
fs.writeFileSync(
    path.join(dirSalida, 'datos-locales.json'), 
    JSON.stringify(localesExtraidos, null, 2)
);
console.log("✅ Datos limpios guardados en: /output-demos/datos-locales.json");

// 📌 3. LEER PLANTILLA HTML
const plantilla = fs.readFileSync(path.join(__dirname, 'plantilla-base.html'), 'utf8');

// 📌 4. GENERAR DEMO PARA CADA NEGOCIO
localesExtraidos.forEach(local => {
    // Normalizar slug para la carpeta (ej. "3030-barber-barberia")
    const slug = local.nombre
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    // Limpiar teléfono para WhatsApp (reemplaza prefijos si hace falta)
    const telClean = local.telefono.replace(/[^0-9]/g, '');

    // Reemplazar campos en la plantilla
    let htmlCompilado = plantilla
        .replace(/{{NOMBRE_NEGOCIO}}/g, local.nombre)
        .replace(/{{DIRECCION}}/g, local.direccion)
        .replace(/{{RATING}}/g, local.rating)
        .replace(/{{RESEÑAS}}/g, local.reseñas)
        .replace(/{{TELEFONO_CLEAN}}/g, telClean)
        .replace(/{{NOMBRE_ENCODED}}/g, encodeURIComponent(local.nombre));

    // Crear carpeta individual por negocio
    const carpetaNegocio = path.join(dirSalida, slug);
    if (!fs.existsSync(carpetaNegocio)) {
        fs.mkdirSync(carpetaNegocio, { recursive: true });
    }

    // Guardar index.html
    fs.writeFileSync(path.join(carpetaNegocio, 'index.html'), htmlCompilado);
    console.log(`🚀 Demo creada para: ${local.nombre} -> /output-demos/${slug}/index.html`);
});

console.log("\n✨ ¡Proceso terminado! Ya tenés todas las webs listas para subir o previsualizar.");