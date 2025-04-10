require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 8080;

// Express нужен Railway, чтобы контейнер не выключался
app.get('/', (req, res) => {
  res.send('Ассистент Грин работает');
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Telegram + GPT
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemPrompt = {
  role: 'system',
  content: `Ты — бот-консультант по растениям. Отвечаешь просто, по делу, без воды... (вставь свой промт)`
};

const userHistories = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text?.trim();
  if (!userMessage) return;

  if (!userHistories[chatId]) userHistories[chatId] = [systemPrompt];
  userHistories[chatId].push({ role: 'user', content: userMessage });

  if (userHistories[chatId].length > 8) {
    userHistories[chatId] = [systemPrompt].concat(userHistories[chatId].slice(-6));
  }

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: userHistories[chatId],
      max_tokens: 400
    });

    const reply = res.choices[0].message.content;
    userHistories[chatId].push({ role: 'assistant', content: reply });
    await bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error('GPT error:', err.message);
    await bot.sendMessage(chatId, 'Ошибка. Проверь настройки.');
  }
});
