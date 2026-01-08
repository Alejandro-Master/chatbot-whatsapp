const { getOrCreateUser, saveConversation, getConversationHistory } = require('./supabase');
const { sendMessage } = require('./whatsappClient');
const { processWithAI, analyzeIntent } = require('./aiProcessor');
const { getAllProducts, searchProducts, formatMenuMessage } = require('./menuDatabase');
const orderManager = require('./orderManager');
const { downloadMedia, processImage, transcribeAudio } = require('./multimediaHandler');

async function handleIncomingMessage(message) {
    try {
        const from = message.from;
        const messageId = message.id;

        const user = await getOrCreateUser(from);

        let messageText = '';
        let messageType = message.type;

        if (messageType === 'text') {
            messageText = message.text.body;
        } else if (messageType === 'image') {
            const media = await downloadMedia(message.image.id);
            if (media) {
                const description = await processImage(media.data);
                messageText = `[Imagen recibida: ${description}]`;
                await sendMessage(from, `📸 Vi tu imagen: ${description}`);
            }
        } else if (messageType === 'audio') {
            const media = await downloadMedia(message.audio.id);
            if (media) {
                const transcription = await transcribeAudio(media.data);
                if (transcription) {
                    messageText = transcription;
                    await sendMessage(from, `🎤 Entendí: "${transcription}"`);
                }
            }
        } else {
            await sendMessage(from, 'Formato no soportado. Envía texto, imagen o audio.');
            return;
        }

        await saveConversation(user.id, messageText, 'user');

        const intent = await analyzeIntent(messageText);
        let response = '';

        switch (intent) {
            case 'show_menu':
                const products = await getAllProducts();
                response = formatMenuMessage(products);
                break;

            case 'make_order':
                const searchQuery = messageText.replace(/pedir|quiero|ordenar/gi, '').trim();
                const foundProducts = await searchProducts(searchQuery);

                if (foundProducts.length > 0) {
                    const product = foundProducts[0];
                    orderManager.addItem(user.id, product);
                    const order = orderManager.getOrder(user.id);
                    response = `✅ Agregado: ${product.name} ($${product.price})\n\n${orderManager.formatOrderSummary(order)}`;
                } else {
                    response = '❌ No encontré ese producto. Escribe *menú* para ver opciones.';
                }
                break;

            case 'show_cart':
                const currentOrder = orderManager.getOrder(user.id);
                response = orderManager.formatOrderSummary(currentOrder);
                break;

            case 'confirm_order':
                const result = await orderManager.confirmOrder(user.id);
                if (result.success) {
                    response = `🎉 *¡Pedido confirmado!*\n\nNúmero: #${result.order.id}\nTotal: $${result.order.total}\n\n¡Gracias por tu compra!`;
                } else {
                    response = `❌ ${result.message}`;
                }
                break;

            case 'cancel_order':
                orderManager.clearOrder(user.id);
                response = '🗑️ Pedido cancelado. ¿En qué más puedo ayudarte?';
                break;

            case 'general_query':
                const history = await getConversationHistory(user.id, 5);
                const context = history.map(h => `${h.sender}: ${h.message}`).join('\n');
                response = await processWithAI(messageText, context);
                break;

            default:
                response = '¡Hola! 👋 Escribe *menú* para ver opciones o pregúntame lo que necesites.';
        }

        await sendMessage(from, response);
        await saveConversation(user.id, response, 'bot');

    } catch (error) {
        console.error('Error manejando mensaje:', error);
        await sendMessage(message.from, 'Disculpa, ocurrió un error. Intenta de nuevo.');
    }
}

module.exports = {
    handleIncomingMessage
};