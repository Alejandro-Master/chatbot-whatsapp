const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const { handleIncomingMessage } = require('./messageHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Verificación del webhook (GET)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        console.log('✅ Webhook verificado');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Recepción de mensajes (POST)
app.post('/webhook', async (req, res) => {
    try {
        const body = req.body;

        if (body.object === 'whatsapp_business_account') {
            const entries = body.entry;

            for (const entry of entries) {
                const changes = entry.changes;

                for (const change of changes) {
                    if (change.field === 'messages') {
                        const messages = change.value.messages;

                        if (messages) {
                            for (const message of messages) {
                                console.log('📨 Mensaje recibido:', message);
                                await handleIncomingMessage(message);
                            }
                        }
                    }
                }
            }

            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('❌ Error en webhook:', error);
        res.sendStatus(500);
    }
});

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: '🤖 Chatbot WhatsApp funcionando',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌐 URL local: http://localhost:${PORT}`);
});