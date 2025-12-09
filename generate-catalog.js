const fs = require('fs');
const path = require('path');

const folderPath = path.join(__dirname, 'marmitas nomeadas');
const outputPath = path.join(folderPath, 'marmitas.json');

// Category mapping — returns ARRAY of categories (multi-category support)
function inferCategories(filename) {
    const lower = filename.toLowerCase();
    const categories = [];

    // Protein categories
    if (lower.includes('carne') || lower.includes('lagarto') || lower.includes('patinho') || 
        lower.includes('picadinho') || lower.includes('pernil') || lower.includes('feijoada') || 
        lower.includes('panqueca de carne') || lower.includes('virado')) {
        categories.push('Carne');
    }
    
    if (lower.includes('frango') || lower.includes('galinha') || lower.includes('bobo')) {
        categories.push('Frango');
    }
    
    if (lower.includes('peixe') || lower.includes('bacalhau') || lower.includes('salmão')) {
        categories.push('Peixe');
    }
    
    if (lower.includes('camarão') || lower.includes('risoto de camarão')) {
        categories.push('Frutos do Mar');
    }

    // Base/Side categories
    if (lower.includes('risoto')) {
        categories.push('Arroz');
    }
    
    if (lower.includes('lasanha') || lower.includes('macarrão') || lower.includes('panqueca')) {
        categories.push('Macarrão');
    }
    
    if (lower.includes('batata doce') || lower.includes('batata')) {
        categories.push('Batata');
    }
    
    if (lower.includes('berinjela')) {
        categories.push('Berinjela');
    }
    
    if (lower.includes('legume') || lower.includes('espinafre') || lower.includes('brócolis')) {
        categories.push('Legumes');
    }
    
    if (lower.includes('baião')) {
        categories.push('Arroz');
    }

    // Dietary categories
    if (lower.includes('vegetariano') || lower.includes('espinafre') || lower.includes('legumes')) {
        if (!categories.includes('Vegetariano')) categories.push('Vegetariano');
    }

    // Preparation method
    if (lower.includes('grelhado') || lower.includes('assado')) {
        categories.push('Grelhado');
    }

    // Default if no categories found
    if (categories.length === 0) {
        categories.push('Carne');
    }

    // Remove duplicates and return
    return [...new Set(categories)];
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
        const categories = inferCategories(filename);
        return {
            id: `m${index + 1}`,
            name: name,
            description: `Deliciosa refeição caseira: ${name}. Feita com ingredientes frescos e de alta qualidade.`,
            categories: categories,
            image: filename
        };
    });
    
    // Write JSON file
    fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 4));
    
    console.log(`✅ Catalog generated successfully!`);
    console.log(`📁 File: ${outputPath}`);
    console.log(`📊 Total dishes: ${catalog.length}`);
    
    // Collect all unique categories
    const allCategories = [...new Set(catalog.flatMap(c => c.categories))].sort();
    console.log(`📂 Categories found: ${allCategories.join(', ')}`);
    
    // Show category breakdown
    allCategories.forEach(cat => {
        const count = catalog.filter(c => c.categories.includes(cat)).length;
        console.log(`   • ${cat}: ${count}`);
    });
} catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
}
