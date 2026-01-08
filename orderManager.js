const { supabase } = require('./supabase');

class OrderManager {
    constructor() {
        this.activeOrders = new Map();
    }

    createOrder(userId) {
        this.activeOrders.set(userId, {
            items: [],
            total: 0
        });
    }

    addItem(userId, product, quantity = 1) {
        if (!this.activeOrders.has(userId)) {
            this.createOrder(userId);
        }

        const order = this.activeOrders.get(userId);
        const existingItem = order.items.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            order.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity
            });
        }

        order.total = order.items.reduce((sum, item) =>
            sum + (item.price * item.quantity), 0
        );

        return order;
    }

    removeItem(userId, productId) {
        if (!this.activeOrders.has(userId)) return null;

        const order = this.activeOrders.get(userId);
        order.items = order.items.filter(item => item.id !== productId);
        order.total = order.items.reduce((sum, item) =>
            sum + (item.price * item.quantity), 0
        );

        return order;
    }

    getOrder(userId) {
        return this.activeOrders.get(userId) || null;
    }

    async confirmOrder(userId) {
        const order = this.activeOrders.get(userId);
        if (!order || order.items.length === 0) {
            return { success: false, message: 'No hay productos en el pedido' };
        }

        try {
            const { data, error } = await supabase
                .from('orders')
                .insert([{
                    user_id: userId,
                    items: order.items,
                    total: order.total,
                    status: 'confirmed'
                }])
                .select()
                .single();

            if (error) throw error;

            this.activeOrders.delete(userId);
            return { success: true, order: data };
        } catch (error) {
            console.error('Error confirmando pedido:', error);
            return { success: false, message: 'Error al confirmar pedido' };
        }
    }

    clearOrder(userId) {
        this.activeOrders.delete(userId);
    }

    formatOrderSummary(order) {
        if (!order || order.items.length === 0) {
            return '🛒 Tu carrito está vacío.';
        }

        let message = '🛒 *TU PEDIDO*\n\n';
        order.items.forEach(item => {
            message += `• ${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}\n`;
        });
        message += `\n💰 *TOTAL: $${order.total.toFixed(2)}*\n\n`;
        message += 'Responde *CONFIRMAR* para completar tu pedido\n';
        message += 'o *CANCELAR* para vaciar el carrito.';
        return message;
    }
}

module.exports = new OrderManager();