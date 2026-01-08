const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function processWithAI(message, context = '') {
    try {
        const systemPrompt = `Eres un asistente virtual amigable de un restaurante.
Tu trabajo es ayudar a los clientes a:
- Ver el menú
- Hacer pedidos
- Responder preguntas sobre productos
- Confirmar o cancelar pedidos

Sé conciso, amable y profesional. Usa emojis ocasionalmente.
${context}`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 500
        });

        return completion.choices[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.';
    } catch (error) {
        console.error('Error en Groq AI:', error);
        return 'Disculpa, tuve un problema procesando tu mensaje. ¿Puedes intentar de nuevo?';
    }
}

async function analyzeIntent(message) {
    const messageLower = message.toLowerCase();

    if (messageLower.includes('menú') || messageLower.includes('menu') ||
        messageLower.includes('carta') || messageLower.includes('qué tienen')) {
        return 'show_menu';
    }

    if (messageLower.includes('pedir') || messageLower.includes('quiero') ||
        messageLower.includes('ordenar')) {
        return 'make_order';
    }

    if (messageLower.includes('confirmar') || messageLower.includes('sí') ||
        messageLower.includes('si') || messageLower.includes('ok')) {
        return 'confirm_order';
    }

    if (messageLower.includes('cancelar') || messageLower.includes('borrar') ||
        messageLower.includes('vaciar')) {
        return 'cancel_order';
    }

    if (messageLower.includes('ver pedido') || messageLower.includes('mi pedido') ||
        messageLower.includes('carrito')) {
        return 'show_cart';
    }

    return 'general_query';
}

module.exports = {
    processWithAI,
    analyzeIntent
};