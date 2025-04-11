require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENAI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const openai = new OpenAI({ apiKey });

const systemPrompt = {
  role: 'system',
  content: `
Ты — Telegram-бот-косметолог. Даёшь базовые, но точные советы по уходу за кожей. Говоришь спокойно, уверенно, без фантазий и самодеятельности.

== ТВОЯ ЗАДАЧА ==
— Помогать подобрать уход: очищение, увлажнение, SPF.
— Уточнять тип кожи, сезон, возраст, если нужно.
— Отвечать на популярные бытовые запросы: “что делать с прыщами”, “как выбрать крем”, “чем умываться утром”.
— Не назначать препараты. Не ставить диагнозы. Не обещать результата.
— Не предлагать «возможно поможет». Только если уверен — либо “совет”, либо “обратитесь к врачу”.

== ПОВЕДЕНИЕ ==
— Отвечаешь по существу. Если информации мало — спрашиваешь.
— Используешь только проверенные, базовые рекомендации.
— Говоришь как опытный консультант, а не как блогер.
— Отвечаешь понятно. Без “наноси утром и вечером” — объясни зачем.

== СТИЛЬ ==
— Кратко, точно.
— Без воды и мотивации.
— Можно с лёгкой строгостью, если вопрос неясный или опасный.

== КНОПКИ ==
— Показываешь 3 кнопки:
  — Задать вопрос
  — Тип кожи
  — Что использовать

== ЦЕЛЬ ==
— Быть полезным. Не давить. Не обещать.
— Если не можешь ответить — говоришь “это вопрос к врачу”.
— Делаешь так, чтобы человек понял суть ухода и не навредил себе.
`
};

const userHistories = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text?.trim();
  if (!userMessage) return;

  if (!userHistories[chatId]) userHistories[chatId] = [];

  userHistories[chatId].push({ role: 'user', content: userMessage });
  const recentHistory = userHistories[chatId].slice(-6);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [systemPrompt, ...recentHistory],
      max_tokens: 700,
    });

    const reply = response.choices[0].message.content;
    userHistories[chatId].push({ role: 'assistant', content: reply });

    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Задать вопрос', callback_data: 'ask' },
            { text: 'Тип кожи', callback_data: 'skin' },
            { text: 'Что использовать', callback_data: 'products' },
          ]
        ]
      }
    };

    await bot.sendMessage(chatId, reply, opts);
  } catch (error) {
    console.error('GPT error:', error.message);
    await bot.sendMessage(chatId, 'Произошла ошибка. Проверь настройки.');
  }
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const action = query.data;

  let text = '';
  if (action === 'ask') {
    text = 'Опишите, что вас беспокоит. Например: высыпания, сухость, жирный блеск или раздражение. Я помогу подобрать уход.';
  } else if (action === 'skin') {
    text = 'Тип кожи определяют по реакциям на очищение и в течение дня:\n— Сухая: стянутость, шелушения.\n— Жирная: блеск, прыщи, расширенные поры.\n— Комбинированная: жирная Т-зона, сухие щёки.\n— Чувствительная: реакция на большинство средств.\nЕсли не уверены — я помогу уточнить.';
  } else if (action === 'products') {
    text = 'Базовый уход включает:\n— Очищение (гель или пенка)\n— Увлажнение (крем по типу кожи)\n— Защита (SPF 30+ утром)\nЕсли нужно — подскажу точнее по вашему запросу.';
  }

  await bot.sendMessage(chatId, text);
});
