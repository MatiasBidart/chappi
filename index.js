require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Verificación del webhook
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Recepción de mensajes
app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Confirma que sea un mensaje entrante
    if (body.object) {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];

      if (message) {
        const from = message.from; // número del usuario
        const text = message.text?.body; // mensaje recibido

        console.log(`📩 Mensaje recibido de ${from}: ${text}`);

        // lógica de respuesta
        let response = 'No entendí tu mensaje 😅';
        if (/hola/i.test(text)) response = '¡Hola! ¿Cómo estás? 🤖';
        if (/gracias/i.test(text)) response = '¡De nada! 😊';
        if (/chau|adiós/i.test(text)) response = '¡Hasta luego! 👋';

        // respuesta con axios — CORREGIDA
        await axios.post(
          `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`,
          {
            messaging_product: 'whatsapp',
            to: from,
            type: 'text', // 👈 MUY IMPORTANTE
            text: { body: response }
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('✅ Mensaje enviado correctamente');
      }

      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('❌ Error al responder:', error?.response?.data || error.message);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot escuchando en http://localhost:${PORT}`));
