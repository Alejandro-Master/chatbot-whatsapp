const axios = require('axios');
const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function downloadMedia(mediaId) {
    try {
        const response = await axios.get(
            `https://graph.facebook.com/v18.0/${mediaId}`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`
                }
            }
        );

        const mediaUrl = response.data.url;

        const mediaResponse = await axios.get(mediaUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`
            },
            responseType: 'arraybuffer'
        });

        return {
            data: mediaResponse.data,
            mimeType: mediaResponse.headers['content-type']
        };
    } catch (error) {
        console.error('Error descargando media:', error);
        return null;
    }
}

async function processImage(imageBuffer) {
    try {
        const base64Image = imageBuffer.toString('base64');

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Describe brevemente esta imagen en español. Si es comida, menciona qué es.'
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            model: 'llama-3.2-90b-vision-preview',
            temperature: 0.7,
            max_tokens: 200
        });

        return completion.choices[0]?.message?.content || 'No pude analizar la imagen.';
    } catch (error) {
        console.error('Error procesando imagen:', error);
        return 'Error analizando la imagen.';
    }
}

async function transcribeAudio(audioBuffer) {
    try {
        const file = new File([audioBuffer], 'audio.ogg', { type: 'audio/ogg' });

        const transcription = await groq.audio.transcriptions.create({
            file: file,
            model: 'whisper-large-v3',
            language: 'es'
        });

        return transcription.text;
    } catch (error) {
        console.error('Error transcribiendo audio:', error);
        return null;
    }
}

module.exports = {
    downloadMedia,
    processImage,
    transcribeAudio
};