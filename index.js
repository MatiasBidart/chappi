require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// 👉 Verificación inicial de Webhook (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('✅ Webhook verificado');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 👉 Lógica principal del bot (POST)
app.post('/webhook', async (req, res) => {
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];

  if (message) {
    const from = message.from; // Número del usuario
    const text = message.text?.body;

    // 🧠 Tu lógica básica
    let response = 'No entendí tu mensaje 😅';
    if (/hola/i.test(text)) response = '¡Hola! ¿Cómo estás? 🤖';
    if (/gracias/i.test(text)) response = '¡De nada! 😊';
    if (/chau|adiós/i.test(text)) response = '¡Hasta luego! 👋';

    // 👉 Enviar respuesta
    await axios.post(
      `https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: from,
        text: { body: response }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  res.sendStatus(200);
});

// 👉 Arranca el servidor
app.listen(process.env.PORT, () => {
  console.log(`🚀 Bot escuchando en http://localhost:${process.env.PORT}`);
});
