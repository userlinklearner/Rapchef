const fs = require('fs');
const path = require('path');

const folderPath = path.join(__dirname, 'marmitas nomeadas');
const outputPath = path.join(folderPath, 'marmitas.json');

// Provided mapping for names/descriptions/categories
const providedData = [
    { name: 'Bobó de Frango', description: 'Frango desfiado em creme de mandioca, cremoso e bem temperado.', protein: 'frango', base: 'pure' },
    { name: 'Filé de Frango com Arroz Integral e Brócolis', description: 'Filé de frango grelhado com arroz integral e brócolis.', protein: 'frango', base: 'arroz' },
    { name: 'Frango em Cubos com Batata-Doce', description: 'Cubos de frango suculentos acompanhados de batata-doce macia.', protein: 'frango', base: 'batata' },
    { name: 'Panqueca de Frango', description: 'Panqueca recheada com frango desfiado e molho suave.', protein: 'frango', base: 'macarrao' },
    { name: 'Parmegiana de Frango', description: 'Filé de frango empanado com molho de tomate e queijo gratinado.', protein: 'frango', base: 'macarrao' },
    { name: 'Risoto de Frango', description: 'Arroz cremoso preparado com frango desfiado.', protein: 'frango', base: 'arroz' },
    { name: 'Estrogonofe de Frango', description: 'Frango em cubos ao molho cremoso clássico.', protein: 'frango', base: 'arroz' },
    { name: 'Escondidinho de Frango', description: 'Frango desfiado coberto com purê cremoso e gratinado.', protein: 'frango', base: 'pure' },
    { name: 'Escondidinho de Carne-Seca', description: 'Carne-seca desfiada com purê cremoso e gratinado.', protein: 'carne', base: 'pure' },
    { name: 'Feijoada', description: 'Feijão preto com carnes selecionadas, sabor tradicional.', protein: 'carne', base: 'arroz' },
    { name: 'Lagarto Recheado ao Molho', description: 'Lagarto recheado servido com molho encorpado.', protein: 'carne', base: 'pure' },
    { name: 'Patinho Moído com Batata-Doce', description: 'Patinho moído bem temperado com batata-doce.', protein: 'carne', base: 'batata' },
    { name: 'Pernil Refogado', description: 'Pernil suculento refogado lentamente.', protein: 'carne', base: 'arroz' },
    { name: 'Picadinho de Carne', description: 'Cubos de carne macios com molho caseiro.', protein: 'carne', base: 'arroz' },
    { name: 'Virado à Paulista', description: 'Carne servida com preparo tradicional paulista.', protein: 'carne', base: 'arroz' },
    { name: 'Bife à Rolê', description: 'Bife recheado cozido lentamente em molho saboroso.', protein: 'carne', base: 'arroz' },
    { name: 'Carne-Seca', description: 'Carne-seca dessalgada e preparada de forma tradicional.', protein: 'carne', base: 'arroz' },
    { name: 'Estrogonofe de Carne', description: 'Carne em tiras ao molho cremoso clássico.', protein: 'carne', base: 'arroz' },
    { name: 'Parmegiana de Carne', description: 'Carne empanada com molho de tomate e queijo gratinado.', protein: 'carne', base: 'macarrao' },
    { name: 'Panqueca de Carne', description: 'Panqueca recheada com carne moída bem temperada.', protein: 'carne', base: 'macarrao' },
    { name: 'Bacalhau Gratinado', description: 'Bacalhau desfiado com creme e cobertura gratinada.', protein: 'peixe', base: 'pure' },
    { name: 'Peixe ao Molho de Camarão', description: 'Filé de peixe servido com molho cremoso de camarão.', protein: 'peixe', base: 'arroz' },
    { name: 'Peixe Grelhado com Purê de Mandioquinha', description: 'Peixe grelhado com purê leve de mandioquinha.', protein: 'peixe', base: 'pure' },
    { name: 'Risoto de Camarão', description: 'Arroz cremoso preparado com camarões selecionados.', protein: 'peixe', base: 'arroz' },
    { name: 'Lasanha de Espinafre', description: 'Lasanha leve com espinafre e molho suave.', protein: 'vegetariano', base: 'macarrao' },
    { name: 'Lasanha de Legumes', description: 'Lasanha recheada com legumes frescos.', protein: 'vegetariano', base: 'macarrao' },
    { name: 'Lasanha de Berinjela', description: 'Camadas de berinjela com molho e queijo gratinado.', protein: 'vegetariano', base: 'macarrao' },
    { name: 'Lasanha 4 Queijos com Brócolis', description: 'Lasanha cremosa de quatro queijos com brócolis.', protein: 'vegetariano', base: 'macarrao' },
    { name: 'Panqueca de Palmito', description: 'Panqueca recheada com palmito ao molho leve.', protein: 'vegetariano', base: 'macarrao' },
    // explicit overrides with display names
    { id: 'escond frango', name: 'escond frango', displayName: 'Escondidinho de Frango', description: 'Frango desfiado coberto com purê cremoso.', protein: 'frango', base: 'pure' },
    { id: 'estrog carne', name: 'estrog carne', displayName: 'Estrogonofe de Carne', description: 'Carne em tiras ao molho cremoso clássico.', protein: 'carne', base: 'arroz' },
    { id: 'estrog frango', name: 'estrog frango', displayName: 'Estrogonofe de Frango', description: 'Frango em cubos ao molho cremoso clássico.', protein: 'frango', base: 'arroz' },
    { id: 'lasanha berinjela', name: 'lasanha berinjela', displayName: 'Lasanha de Berinjela', description: 'Lasanha de berinjela com molho e queijo.', protein: 'vegetariano', base: 'macarrao' },
    { id: 'panqueca palmito', name: 'panqueca palmito', displayName: 'Panqueca de Palmito', description: 'Panqueca recheada com palmito ao molho leve.', protein: 'vegetariano', base: 'macarrao' },
    { id: 'parme carne', name: 'parme carne', displayName: 'Parmegiana de Carne', description: 'Carne empanada com molho de tomate e queijo gratinado.', protein: 'carne', base: 'macarrao' },
    { id: 'risoto calabresa', name: 'risoto calabresa', displayName: 'Risoto de Calabresa', description: 'Risoto cremoso com calabresa dourada.', protein: 'porco', base: 'arroz' },
    { id: 'baiao de dois', name: 'Baião de Dois', displayName: 'Baião de Dois', description: 'Arroz com feijão, queijo e carne-seca em preparo cremoso.', protein: 'carne', base: 'arroz' },
    { id: 'file de frango arroz integral e brocolis', name: 'Filé de frango,arroz integral e brócolis', displayName: 'Filé de Frango com Arroz Integral e Brócolis', description: 'Filé de frango grelhado com arroz integral e brócolis.', protein: 'frango', base: 'arroz' },
    { id: 'frango em cubos e batata doce', name: 'Frango em cubos e Batata Doce', displayName: 'Frango em Cubos com Batata-Doce', description: 'Cubos de frango suculentos com batata-doce macia.', protein: 'frango', base: 'batata' },
    { id: 'lasanha bolonhesa', name: 'Lasanha Bolonhesa', displayName: 'Lasanha Bolonhesa', description: 'Lasanha clássica com molho bolonhesa e queijo gratinado.', protein: 'carne', base: 'macarrao' },
    { id: 'lasanha de 4queijos e brocolis', name: 'Lasanha de 4Queijos e brócolis', displayName: 'Lasanha 4 Queijos com Brócolis', description: 'Lasanha cremosa de quatro queijos com brócolis.', protein: 'vegetariano', base: 'macarrao' },
    { id: 'macarrao integral com almondegas', name: 'Macarrão Integral com Almôndegas', displayName: 'Macarrão Integral com Almôndegas', description: 'Macarrão integral servido com almôndegas ao molho.', protein: 'carne', base: 'macarrao' },
    { id: 'patinho moido e batata doce', name: 'Patinho moido e Batata Doce', displayName: 'Patinho Moído com Batata-Doce', description: 'Patinho moído bem temperado com batata-doce.', protein: 'carne', base: 'batata' }
];

function slugify(text) {
    return (text || '')
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

function normalizeCategory(cat) {
    const s = slugify(cat || '').replace(/-/g, ' ');
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const providedBySlug = providedData.reduce((acc, item) => {
    const keys = [
        slugify(item.name),
        item.displayName ? slugify(item.displayName) : null,
        item.id ? slugify(item.id) : null
    ].filter(Boolean);
    keys.forEach(k => { acc[k] = item; });
    return acc;
}, {});

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
        const rawName = extractName(filename);
        const slug = slugify(rawName);
        const fileSlug = slugify(filename.replace(/\.(jpg|jpeg|png)$/i, ''));
        const mapped = providedBySlug[fileSlug] || providedBySlug[slug];

        const name = mapped?.displayName || mapped?.name || rawName;
        const description = mapped?.description || '';
        const categoriesRaw = mapped
            ? [mapped.protein, mapped.base, ...inferCategories(filename)].filter(Boolean)
            : inferCategories(filename);
        const categories = [...new Set(categoriesRaw.map(normalizeCategory).filter(Boolean))];

        return {
            id: `m${index + 1}`,
            name,
            description,
            categories,
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
