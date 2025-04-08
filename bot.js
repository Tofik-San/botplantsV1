// bot.js

const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const token = process.env.TELEGRAM_TOKEN;          // Токен Телеграм
const apiKey = process.env.OPENAI_API_KEY;         // Токен OpenAI

// Инициализация Telegram
const bot = new TelegramBot(token, { polling: true });

// Инициализация OpenAI (v4)
const openai = new OpenAI({
  apiKey: apiKey
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  try {
    // Вызываем новый метод v4: chat.completions.create
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'user', content: userMessage }
      ],
    });

    // Ответ GPT
    const reply = response.choices[0].message.content;
    bot.sendMessage(chatId, reply);

  } catch (error) {
    console.error('GPT error:', error);
    bot.sendMessage(chatId, 'Ошибка при обращении к GPT.');
  }
});
