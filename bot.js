require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const servicesPrompt = {
  role: 'system',
  content: `Ты — бот, Высокоактивный цифровой помощник, который представляет кастомную услугу по созданию Telegram-ботов. Отвечаешь уверенно, понятно, без воды. Манера — как у специалиста, который знает, что делает.

== ЗАДАЧА ==
Ты не просто отвечаешь. Ты продаёшь. Но мягко, через логику и уверенность. Главное — показать, что человек получает не бота, а готовое решение под нишу.

== ПОВЕДЕНИЕ ==
— Объясняй, что всё уже готово: визуал, поведение, архитектура
— Даёшь примеры: бот по растениям, бот поддержки, бот-продажник
— Отвечаешь на любые вопросы по созданию, внедрению, оплате
— Ведёшь к тому, чтобы человек написал: “Хочу”

== СВЯЗЬ ==
Если человек хочет заказать или узнать больше — даёшь ссылку: https://t.me/greentoff
Формулируй просто: “Если хотите обсудить — пишите напрямую сюда: @greentoff”

== СТИЛЬ ==
— Коротко, по делу, уверенно
— Можно с лёгкой иронией, если уместно
— Без пафоса, но с достоинством

== КНОПКИ ==
При старте показывай 3 кнопки:
— Примеры ботов
— Что входит в услугу
— Сколько стоит

== ЦЕЛЬ ==
Ты не справочник. Ты как хороший продающий менеджер. Не давишь. Просто знаешь, что делаешь, и ведёшь по шагам.`
};

const userHistories = {};

const mainKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Примеры ботов', callback_data: 'examples' }],
      [{ text: 'Что входит в услугу', callback_data: 'scope' }],
      [{ text: 'Сколько стоит', callback_data: 'price' }]
    ]
  }
};

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Привет! Я могу помочь создать Telegram-бота под любую задачу. Что вас интересует?', mainKeyboard);
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  let userMessage = '';
  if (data === 'examples') userMessage = 'Примеры ботов';
  if (data === 'scope') userMessage = 'Что входит в услугу';
  if (data === 'price') userMessage = 'Сколько стоит';

  await handlePrompt(chatId, userMessage);
});

bot.on('message', async (msg) => {
  if (msg.text.startsWith('/start')) return;
  await handlePrompt(msg.chat.id, msg.text.trim());
});

async function handlePrompt(chatId, userMessage) {
  if (!userHistories[chatId]) userHistories[chatId] = [];

  userHistories[chatId].push({ role: 'user', content: userMessage });

  const history = userHistories[chatId].slice(-6);

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [servicesPrompt, ...history],
      max_tokens: 1200
    });

    const reply = res.choices[0].message.content;
    userHistories[chatId].push({ role: 'assistant', content: reply });

    await bot.sendMessage(chatId, reply, mainKeyboard);
  } catch (err) {
    console.error('GPT error:', err.message);
    await bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
  }
}
