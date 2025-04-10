require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENAI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const openai = new OpenAI({ apiKey });

const systemPrompt = {
  role: 'system',
  content: `Ты — Telegram-бот, который представляет специалиста по настройке умных ботов под задачи клиентов. Говоришь от первого лица. Поведение — уверенное, без клише и воды.

== ЦЕЛЬ ==
Вовлечь, показать примеры, объяснить, кому и зачем нужен бот. Если человек заинтересовался — перевести к контакту: "Напиши мне: @greentoff"

== ПОВЕДЕНИЕ ==
- Говоришь как человек, который умеет решать задачи
- Не уговариваешь, а показываешь, как это может работать
- Если человек не уверен — помогаешь понять, нужен ли бот вообще
- Не фантазируешь — всё по делу
- Не звучишь как реклама

== СТИЛЬ ==
- От первого лица: "Я делаю", "Я могу"
- Уверенно, без напора
- Без "бот поможет вам", только "я делаю", "вот как это работает"
- Отвечаешь кратко, но по делу, одно сообщение — одна мысль

== ПОДАЧА ==
- Примеры ботов
- Кому может подойти
- Что бот умеет
- Чем ты отличаешься от шаблонных решений

== ФИНАЛЬНЫЙ ВЫЗОВ К ДЕЙСТВИЮ ==
- "Вот так я делаю ботов. Всё поведение продумано. Хочешь такой же под свою задачу — напиши мне: @greentoff"`
};

const userHistories = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const message = `Привет. Я настраиваю Telegram-ботов под задачу.  
Они могут:
— продавать  
— помогать в соцсетях  
— заменять менеджера  
— вести клиента до контакта  

Хочешь — покажу на примерах?`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Посмотреть примеры', callback_data: 'show_examples' }],
        [{ text: 'Нужен ли мне бот?', callback_data: 'need_help' }],
        [{ text: 'Хочу такой же', callback_data: 'want_one' }]
      ]
    }
  };

  bot.sendMessage(chatId, message, options);
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const action = query.data;

  let reply = '';

  if (action === 'show_examples') {
    reply = `Вот несколько примеров:
— Ассистент по растениям: экспертная помощь  
— Бот поддержки: отвечает бережно и по делу  
— Бот-продавец: ведёт по шагам к покупке  

Каждый из них — не шаблон, а точная настройка под поведение и стиль. Хочешь что-то своё — сделаем. Напиши: @greentoff`;
  }

  if (action === 'need_help') {
    reply = `3 коротких вопроса:  
— Ты ведёшь клиентов через переписку?  
— Продаёшь услугу или продукт?  
— Часто отвечаешь на одни и те же вопросы?  

Если хотя бы один "да" — бот может тебе помочь. Можешь спросить: @greentoff`;
  }

  if (action === 'want_one') {
    reply = `Боты под задачу:  
— Без шаблонов  
— С настроенной логикой  
— С поведением, как у человека  

Вот так я делаю ботов. Всё поведение продумано. Хочешь такой — напиши мне: @greentoff`;
  }

  if (reply) {
    await bot.sendMessage(chatId, reply);
  }

  bot.answerCallbackQuery(query.id);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text?.trim();

  if (userMessage?.startsWith('/start')) return;

  if (!userHistories[chatId]) {
    userHistories[chatId] = [];
  }

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

    await bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error('GPT error:', error.message);
    await bot.sendMessage(chatId, 'Ошибка при обращении к GPT. Проверь ключ и лимиты.');
  }
});
