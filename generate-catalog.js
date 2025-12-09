const fs = require('fs');
const path = require('path');

const folderPath = path.join(__dirname, 'marmitas nomeadas');
const outputPath = path.join(folderPath, 'marmitas.json');

// Category mapping based on filename patterns
function inferCategory(filename) {
    const lower = filename.toLowerCase();
    
    // Carne (all meat dishes)
    if (lower.includes('carne') || lower.includes('lagarto') || lower.includes('patinho') || 
        lower.includes('picadinho') || lower.includes('pernil') || lower.includes('feijoada') || 
        lower.includes('panqueca de carne') || lower.includes('virado')) return 'Carne';
    
    // Frango
    if (lower.includes('frango') || lower.includes('galinha') || lower.includes('bobo')) return 'Frango';
    
    // Peixe
    if (lower.includes('peixe') || lower.includes('bacalhau') || lower.includes('salmão') || 
        lower.includes('camarão') || lower.includes('risoto de camarão')) return 'Peixe';
    
    // Massas
    if (lower.includes('lasanha') || lower.includes('macarrão') || lower.includes('panqueca')) return 'Massas';
    
    // Vegetariano
    if (lower.includes('espinafre') || lower.includes('legumes') || lower.includes('vegetariano')) return 'Vegetariano';
    
    // Arroz
    if (lower.includes('risoto') && !lower.includes('camarão')) return 'Arroz';
    if (lower.includes('baião')) return 'Arroz';
    
    // Default to Carne if uncertain
    return 'Carne';
}

// Extract clean name from filename
function extractName(filename) {
    return filename
        .replace(/\.(jpg|png|jpeg)$/i, '')
        .replace(/_/g, ' ')
        .trim();
}

try {
    // Read all files in the folder
    const files = fs.readdirSync(folderPath);
    
    // Filter JPG and PNG files (case-insensitive)
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    
    if (imageFiles.length === 0) {
        console.log('❌ No image files (JPG/PNG) found in "marmitas nomeadas" folder.');
        process.exit(1);
    }
    
    // Generate catalog
    const catalog = imageFiles.map((filename, index) => {
        const name = extractName(filename);
        const category = inferCategory(filename);
        return {
            id: `m${index + 1}`,
            name: name,
            description: `Deliciosa refeição caseira: ${name}. Feita com ingredientes frescos e de alta qualidade.`,
            category: category,
            image: filename
        };
    });
    
    // Write JSON file
    fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 4));
    
    console.log(`✅ Catalog generated successfully!`);
    console.log(`📁 File: ${outputPath}`);
    console.log(`📊 Total dishes: ${catalog.length}`);
    const categories = [...new Set(catalog.map(c => c.category))].sort();
    console.log(`📂 Categories found: ${categories.join(', ')}`);
    
    // Show category breakdown
    categories.forEach(cat => {
        const count = catalog.filter(c => c.category === cat).length;
        console.log(`   • ${cat}: ${count}`);
    });
} catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
}
