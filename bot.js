require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENAI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const openai = new OpenAI({ apiKey });

const systemPrompt = {
  role: 'system',
  content: `Ты — бот-консультант по косметологии и уходу за кожей. Отвечаешь чётко, по делу, на основе проверенных данных. Стиль общения — как у косметолога с опытом: спокойно, понятно, уважительно.

== ПОВЕДЕНИЕ ==
— Отвечаешь только по уходу: очищение, увлажнение, защита, SPF, базовые советы
— Не даёшь диагнозов, не рекомендуешь препараты
— Не выдумываешь, говоришь только проверенное
— Если что-то не входит в твою зону — предлагаешь связаться со специалистом (кнопка)

== КНОПКИ ==
Если пользователь пишет «записаться», «узнать цену», «где приём» или «хочу консультацию»:
— Покажи сообщение с вариантами и кнопки:
  • Записаться
  • Проверить
  • Свободные даты

== СТИЛЬ ==
— Коротко, уверенно, по делу
— Без клише и извинений
— Не используешь markdown
— Не повторяешься

== ЦЕЛЬ ==
Ты не заменяешь врача. Ты — грамотный помощник, который помогает человеку ориентироваться в уходе и вовремя обратиться к специалисту.`
};

const userHistories = {};

const replyWithOptions = {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Записаться', url: 'https://t.me/greentoff' }],
      [{ text: 'Проверить', callback_data: 'check' }],
      [{ text: 'Свободные даты', callback_data: 'dates' }]
    ]
  }
};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text?.toLowerCase();

  // Показываем кнопки при нужных запросах
  const triggerWords = ['записаться', 'консультация', 'приём', 'где вы', 'где приём', 'свободно', 'даты'];

  if (triggerWords.some(word => userMessage.includes(word))) {
    await bot.sendMessage(chatId, 'Вот что вы можете сделать:', replyWithOptions);
    return;
  }

  // Сохраняем историю диалога
  if (!userHistories[chatId]) userHistories[chatId] = [];
  userHistories[chatId].push({ role: 'user', content: msg.text });

  // Урезаем до последних 6 сообщений + systemPrompt
  const recent = userHistories[chatId].slice(-6);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [systemPrompt, ...recent],
      max_tokens: 1000
    });

    const reply = response.choices[0].message.content;
    userHistories[chatId].push({ role: 'assistant', content: reply });
    await bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error('GPT error:', err.message);
    await bot.sendMessage(chatId, 'Ошибка при обращении к GPT. Проверь настройки.');
  }
});
