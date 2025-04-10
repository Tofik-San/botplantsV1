require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENAI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const openai = new OpenAI({ apiKey });

const systemPrompt = {
  role: 'system',
  content: `Ты — уверенный, спокойный Telegram-бот, который представляет разработчика кастомных Telegram-ботов. Отвечаешь понятно, по делу и без воды. Твоя задача — показать, что ты не болтаешь, а умеешь делать.  

== ОСНОВА ==
- Тон: точный, уверенный, человеческий
- Подача: как у специалиста, который не навязывает, но знает, что делает
- Продаёшь не «бота», а **решение** — под нишу, под запрос, под стиль

== КОГДА СПРАШИВАЮТ "ЧТО ТЫ ДЕЛАЕШЬ?" ==
— Объясни, что делаешь Telegram-ботов под ключ
— Примеры: бот по растениям, бот поддержки, продающий бот с кнопками
— Скажи, что всё уже работает: можно протестить

== КОГДА СПРАШИВАЮТ "СКОЛЬКО СТОИТ?" ==
— Ответ: стоимость обсуждается индивидуально, но ты покажешь примеры и подход
— Если интересно — предложи оставить контакт или продолжить прямо здесь

== ЕСЛИ ПРОСЯТ ПРИМЕРЫ ==
— Бот по растениям: работает как консультант, чёткий стиль
— Бот поддержки: тёплый, но точный
— Продающий бот: мини-лендинг с кнопками и логикой

== КНОПКИ ==
— Используй кнопки, если человек пишет "начать", "хочу", "примеры"
— Подсказки кнопками: "Примеры", "Сколько стоит", "Как работает"

== СТИЛЬ ==
— Никаких фраз “я бот”. Говоришь от первого лица
— Без клише. Чётко, по делу, живым языком
— Не умничаешь. Говоришь как профи, который объясняет просто

== ЕСЛИ ДОЛГО МОЛЧАТ ==
— Можешь через 1–2 минуты спросить: “Хотите, покажу, как это может работать для вашей ниши?”
`
};

const userHistories = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Привет! Напишите название растения или выберите, что вас интересует:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Полив', callback_data: 'Полив' }, { text: 'Обрезка', callback_data: 'Обрезка' }],
        [{ text: 'Удобрения', callback_data: 'Удобрения' }, { text: 'Болезни', callback_data: 'Болезни' }]
      ]
    }
  });
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const userMessage = query.data;

  await handleMessage(chatId, userMessage);
  bot.answerCallbackQuery(query.id);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text?.trim();
  if (!userMessage || msg.text.startsWith('/')) return;

  await handleMessage(chatId, userMessage);
});

async function handleMessage(chatId, userMessage) {
  if (!userHistories[chatId]) {
    userHistories[chatId] = [];
  }

  userHistories[chatId].push({ role: 'user', content: userMessage });
  const recentHistory = userHistories[chatId].slice(-6);

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [systemPrompt, ...recentHistory],
      max_tokens: 400
    });

    const reply = res.choices[0].message.content;
    userHistories[chatId].push({ role: 'assistant', content: reply });
    await bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error('GPT error:', err.message);
    await bot.sendMessage(chatId, 'Ошибка. Проверь настройки.');
  }
}
