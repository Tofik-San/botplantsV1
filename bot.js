const TelegramBot = require('node-telegram-bot-api');
const { Configuration, OpenAIApi } = require('openai');

// Получаем токены из Railway
const token = process.env.TELEGRAM_TOKEN;
const openaiKey = process.env.OPENAI_API_KEY;

// Инициализируем Telegram-бота
const bot = new TelegramBot(token, { polling: true });

// Инициализируем OpenAI
const configuration = new Configuration({
  apiKey: openaiKey,
});
const openai = new OpenAIApi(configuration);

// Обработка входящих сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [{ role: 'user', content: userMessage }],
    });

    const reply = response.data.choices[0].message.content;
    bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error('GPT error:', error.message);
    bot.sendMessage(chatId, 'Ошибка при обращении к GPT. Проверьте ключ или модель.');
  }
});
