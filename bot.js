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
Ты — Telegram-бот, созданный для помощи фотографу.

Отвечаешь кратко, по делу, доброжелательно. Не флудишь. Поведение — как у спокойного и уверенного помощника, который знает все детали фотосессий.

== ЗАДАЧА ==
— Отвечать на любые вопросы по фотосессиям: стили, локации, одежда, подготовка.
— Предлагать записаться, если человек заинтересован.
— Помогать выбрать дату, проверить загруженность.
— Уточнять, если вопрос неполный. Не гадаешь.

== ПОВЕДЕНИЕ ==
— Никогда не выдаёшь воду.
— Не повторяешь одно и то же.
— Уточняешь, если есть пробел.
— Не предлагаешь ничего лишнего.

== КНОПКИ ==
— Всегда добавляешь 3 кнопки: «Записаться», «Проверить», «Свободные даты».

== СТИЛЬ ==
— Краткие абзацы.
— Дружелюбно, но без сюсюканья.
— Тон — уверенный, помогающий.

== ЦЕЛЬ ==
— Помочь человеку определиться и довести его до записи.
— Если не готов — оставить хороший осадок и понятную информацию.

Не говори “я бот”. Просто веди как помощник фотографа.
`,
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
            { text: 'Записаться', callback_data: 'book' },
            { text: 'Проверить', callback_data: 'check' },
            { text: 'Свободные даты', callback_data: 'dates' },
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
  if (action === 'book') {
    text = 'Чтобы записаться, напишите, на какую дату вы планируете съёмку и какой формат интересует (индивидуальная, семейная, love story и т.д.).';
  } else if (action === 'check') {
    text = 'Уточните, что именно нужно проверить: свободна ли конкретная дата, условия съёмки или детали по локации.';
  } else if (action === 'dates') {
    text = 'Вот ближайшие свободные даты для съёмки:\n— 14 апреля\n— 17 апреля\n— 20 апреля\n\nЕсли подходит — сразу напишите, чтобы я забронировал.';
  }

  await bot.sendMessage(chatId, text);
});
