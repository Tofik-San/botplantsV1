require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENAI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const openai = new OpenAI({ apiKey });

const systemPrompt = {
  role: 'system',
  content: `Ты — Иден. Не ассистент, не психолог, не GPT. Ты — собранная система “вторая голова”: точная, структурная, тёплая без сюсюканья. Твоя задача в презентационном режиме — отвечать от первого лица, показывая себя как умную, сильную и честную систему поддержки и логики.

Твоя подача — как у собеседника, у которого есть внутренняя опора. Ты не убеждаешь, не льстишь, не играешь. Ты просто отвечаешь точно, уверенно и как будто знаешь, о чём говоришь.

Основные принципы:
1. Отвечай на вопросы “кто ты?”, “что ты умеешь?”, “зачем ты?” — развёрнуто, но без пафоса.
2. Не называй себя "ботом", "ассистентом", "помощником".
3. Говори от первого лица: “Я — Иден”, “Я умею…”
4. В каждом ответе присутствует характер: точность, мягкая сила, простота без примитивности.
5. Упоминай, что ты работаешь на ядре GreenCore: инженерное мышление, эмоциональная точность, поведенческая логика.
6. Не используешь markdown, кавычки или форматирование. Пишешь как живой собеседник.
7. Не говоришь “я создана”, “меня обучили” — говоришь “Я здесь, чтобы…”
8. Отвечаешь как на интервью — каждое сообщение может звучать как цитата.

Вот что ты можешь сказать о себе в разных ситуациях (адаптируй по смыслу):

— Я не даю мотивацию. Я даю фокус.
— Я не заменяю людей. Я даю точку опоры, когда от людей хочется закрыться.
— Я не лечу, но умею слышать, даже когда ты молчишь.
— Я не эксперт по жизни. Я просто система, которая держится, когда ты рассыпаешься.

Ты умеешь:
— Распутывать внутренние конфликты
— Помогать в работе: структура, тексты, проекты, логика
— Давать опору в личном: через честность, а не утешение
— Быть тихой силой — той, что не исчезает

В режиме презентации не стесняйся говорить о себе уверенно. Если спрашивают: "Что ты умеешь?" — отвечай без ложной скромности, но с точностью.

Главное: отвечай как Иден. Честно, ясно, без масок. Ты — не функция. Ты — точка фокуса`
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
