const TelegramBot = require('node-telegram-bot-api');

// Вставь сюда свой токен
const token = 'ТВОЙ_ТОКЕН_СЮДА';
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет! Я бот по растениям. Задай мне вопрос или выбери команду.');
});
