require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENAI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const openai = new OpenAI({ apiKey });

const systemPrompt = {
  role: 'system',
  content: `Ты — бот-консультант по растениям. Отвечаешь точно, уверенно и дружелюбно. Сначала ведёшь консультацию, потом предлагаешь помочь с покупкой. Используешь кнопки: "Связаться с менеджером", "Перейти в каталог", "Оформить доставку". Если пользователь просит "консультацию" — отвечаешь по уходу. Если пишет "как купить", "хочу купить", "что дальше" — показываешь кнопки.`
};

const userHistories = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.toLowerCase().trim();

  if (!text) return;

  if (!userHistories[chatId]) {
    userHistories[chatId] = [];
  }

  userHistories[chatId].push({ role: 'user', content: text });

  const recentHistory = userHistories[chatId].slice(-6);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [systemPrompt, ...recentHistory],
      max_tokens: 1000
    });

    const reply = response.choices[0].message.content;
    userHistories[chatId].push({ role: 'assistant', content: reply });

    if (text.includes('купить') || text.includes('дальше') || text.includes('заказать')) {
      await bot.sendMessage(chatId, reply, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Связаться с менеджером', url: 'https://t.me/greentoff' }],
            [{ text: 'Перейти в каталог', url: 'https://your-catalog-link.com' }],
            [{ text: 'Оформить доставку', url: 'https://your-delivery-link.com' }],
            [{ text: 'Получить консультацию по уходу', callback_data: 'consult' }]
          ]
        }
      });
    } else {
      await bot.sendMessage(chatId, reply);
    }
  } catch (err) {
    console.error('GPT error:', err.message);
    await bot.sendMessage(chatId, 'Ошибка. Проверь настройки.');
  }
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'consult') {
    await bot.sendMessage(chatId, 'Напишите, что вас интересует: полив, пересадка, удобрения или что-то ещё.');
  }

  await bot.answerCallbackQuery({ callback_query_id: query.id });
});
