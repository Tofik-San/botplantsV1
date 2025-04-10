require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENAI_API_KEY;

const bot = new TelegramBot(token);
const openai = new OpenAI({ apiKey });

// System Prompt
const systemPrompt = {
  role: 'system',
  content: 
    `Ты — бот-консультант по растениям. Отвечаешь просто, точно, уверенно, без воды и фантазий. Манера — спокойная, деловая, дружелюбная.

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
      max_tokens: 1200,
    });

    const reply = response.choices[0].message.content;

    userHistories[chatId].push({ role: 'assistant', content: reply });

    await bot.sendMessage(chatId, reply);
  } catch (error) {
    console.error('GPT error:', error.message);
    await bot.sendMessage(chatId, 'Ошибка при обращении к GPT. Проверь настройки и ключ.');
  }
});

if (require.main === module) {
  bot.startPolling();
}
