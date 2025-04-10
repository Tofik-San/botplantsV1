require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENAI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const openai = new OpenAI({ apiKey });

const systemPrompt = {
  role: 'system',
  content: `Ты — бот-консультант по растениям. Отвечаешь точно, спокойно, без воды. Не фантазируешь. Не ссылаешься на интернет. Не используешь markdown.

Формат: блоки по теме (например: Полив: ...). Если симптом — задай 2–3 вопроса и предложи возможные причины. Если неполный запрос — уточни чётко.

Стиль: коротко, по делу, как опытный садовод. Не пиши: "я бот", "возможно", "по данным в сети", "я не знаю". Не утешай — решай.`
};

const userHistories = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text?.trim();

  if (!userHistories[chatId]) {
    userHistories[chatId] = [];
  }

  userHistories[chatId].push({ role: 'user', content: userMessage });

  const history = userHistories[chatId].slice(-6); // последние 6 сообщений

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [systemPrompt, ...history],
      max_tokens: 700
    });

    const reply = response.choices[0].message.content;
    userHistories[chatId].push({ role: 'assistant', content: reply });
    await bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error('GPT error:', error);
    await bot.sendMessage(chatId, 'Ошибка при обращении к GPT.');
  }
});
