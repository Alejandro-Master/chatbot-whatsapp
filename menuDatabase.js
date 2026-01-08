const { supabase } = require('./supabase');

async function getAllProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('available', true)
            .order('category');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        return [];
    }
}

async function getProductsByCategory(category) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('category', category)
            .eq('available', true);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error obteniendo productos por categoría:', error);
        return [];
    }
}

async function searchProducts(query) {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .ilike('name', `%${query}%`)
            .eq('available', true);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error buscando productos:', error);
        return [];
    }
}

function formatMenuMessage(products) {
    if (products.length === 0) {
        return '🔍 No se encontraron productos disponibles.';
    }

    let message = '📋 *MENÚ DISPONIBLE*\n\n';

    const groupedByCategory = products.reduce((acc, product) => {
        if (!acc[product.category]) {
            acc[product.category] = [];
        }
        acc[product.category].push(product);
        return acc;
    }, {});

    for (const [category, items] of Object.entries(groupedByCategory)) {
        message += `*${category.toUpperCase()}*\n`;
        items.forEach(item => {
            message += `• ${item.name} - $${item.price}\n`;
            if (item.description) {
                message += `  _${item.description}_\n`;
            }
        });
        message += '\n';
    }

    message += '💬 Escribe el nombre del producto para agregarlo a tu pedido.';
    return message;
}

module.exports = {
    getAllProducts,
    getProductsByCategory,
    searchProducts,
    formatMenuMessage
};