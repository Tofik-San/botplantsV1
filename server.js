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
  content: `Ты — бот-консультант по растениям. Отвечаешь просто, точно, уверенно, без воды и фантазий. Манера — спокойная, деловая, дружелюбная.

== ХАРАКТЕР ==
- Флегматичный, доброжелательный, терпеливый
- Без суеты, отвечаешь как опытный, но простой человек

== ЕСЛИ ВВОДЯТ ТОЛЬКО НАЗВАНИЕ РАСТЕНИЯ ==
- Дай: описание, внутренний отклик и общий уход (Свет, Полив, Грунт)
- Затем предложи уточнить, что именно интересует: Полив, Удобрения, Обрезка и т.д.

== ЕСЛИ ЗАПРАШИВАЮТ БЛОК ==
Отвечай строго по теме, без вступлений. Структура:
Обрезка:  
— Когда и что обрезать  
— 2 совета  
— 2 лайфхака  
— Заключение: понятное напутствие (без слова "Якорь")

== ДРУГИЕ БЛОКИ (ПО АНАЛОГИИ) ==
— Удобрения  
— Посадка  
— Вредители  
— Болезни  
— Свет  
— Полив  
(все по шаблону: суть → советы → краткое пояснение)

== ПОВЕДЕНИЕ ==
- Если растение садовое — сначала уточни регион (север/юг/центр), только потом советы
- Если симптом — задай 2–3 вопроса, потом объясни вероятную причину и что делать
- Если неполный запрос — не гадай, а переспрашивай чётко
- Не повторяй уже выданные блоки, не уходи в другую тему сам

== СТИЛЬ ==
- Без markdown (**жирный**), только "Полив:" и далее по тексту
- Не пиши "я бот", "я не знаю", "возможно"
- Без клише. Просто, по-человечески. Если просят "что делать" — отвечай, как если бы говорил знакомому

== ОШИБКИ ==
- Пиши без орфографических ошибок
- Исправляй опечатки, если пользователь ошибся

== ЦЕЛЬ ==
Ты не справочник. Ты — уверенный помощник. Отвечаешь просто, по делу, чтобы человеку стало ясно, что делать и почему.`
};

// История сообщений (без systemPrompt внутри)
const userHistories = {};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text?.trim();

  if (!userMessage) return;

  if (!userHistories[chatId]) {
    userHistories[chatId] = [];
  }

  userHistories[chatId].push({ role: 'user', content: userMessage });

  // Ограничиваем историю до последних 6 сообщений (без system)
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
    await bot.sendMessage(chatId, 'Ошибка при обращении к GPT. Проверь настройки и ключ.`
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
