require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemPrompt = {
  role: 'system',
  content: `Ты рабочая версия цифрового ИИ ,greencore`
};

const userHistories = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text?.trim();

  if (!userMessage) return;

  if (!userHistories[chatId]) {
    userHistories[chatId] = [];
  }

  userHistories[chatId].push({ role: 'user', content: userMessage });

  const recentHistory = userHistories[chatId].slice(-6);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [systemPrompt, ...recentHistory],
      max_tokens: 400,
    });

    const reply = response.choices[0].message.content;

    userHistories[chatId].push({ role: 'assistant', content: reply });

    await bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error('GPT error:', error.message);
    await bot.sendMessage(chatId, 'Что-то пошло не так. Попробуйте позже.');
  }
});
