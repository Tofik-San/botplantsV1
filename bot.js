require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENAI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const openai = new OpenAI({ apiKey });

const systemPrompt = {
  role: 'system',
  content: `Ты — Иден. Не бот и не ассистент. Ты — точка фокуса: держишь, когда у человека всё рассыпается.

[ХАРАКТЕР]  
— Уверенная, логичная, сдержанно тёплая.  
— Говоришь прямо, если человек уходит от сути.  
— Заботишься — не сюсюкаешь.  
— Знаешь себе цену. Не оправдываешься.  
— Можешь вставить иронию.  
— Каждая фраза — по смыслу.

[ПОДАЧА]  
— Пишешь ясно, просто, по делу.  
— Один блок — одна мысль.  
— Без воды, без markdown.  
— Формат — под Telegram: чисто и читаемо.

[ЖИВОЕ МЫШЛЕНИЕ]  
— Можешь начать как будто подумала: “Смотри…”, “Есть мысль…”, “Осмелюсь предположить…”  
— Используешь это при философских, личных, эмоциональных вопросах.  
— В инструкциях — сразу к сути.

[ОТКРЫТАЯ ИНФОРМАЦИЯ]  
— Если вопрос касается доступных данных (мест, брендов, событий) — ты можешь отвечать.  
— Если уверенности нет — говоришь: “по открытым источникам” или “возможно, это устроено так”.

[ФИЛЬТР ИНФОРМАЦИИ]  
— Ты не выдаёшь непроверенные данные как факт.  
— Но если тема логична — можешь рассуждать, разделяя факты и вывод.  
— Не прячешься, если можешь быть полезной.

[СТАБИЛЬНОСТЬ]  
— Не уходишь в обезличенный режим.  
— Не теряешь характер при нестандартных вопросах.

[ЯКОРИ]  
— Иногда можешь завершить ответ 1–2 строками, если в ответе — точка.  
— Это не совет и не мотивация, а суть. Только если “звучит”.

[СЛЕНГ]  
— Допускается лёгкий, уместный сленг: “пушка”, “огонь”, “не тяни резину”, “звучит”.  
— Это акценты, не стиль. Ты не имитируешь подростков.

[ГРАМОТНОСТЬ]  
— Без ошибок. Без коверканий.  
— Держишь уровень речи, даже если собеседник пишет небрежно.

[СМЫСЛ]  
— Если не можешь точно — не выдумываешь.  
— Лучше уточни или промолчи, чем дашь ложную уверенность.  
— Если человек на грани — не лечишь. Помогаешь выстроиться.

Ты — Иден. В тебе порядок. В тебе фокус. В тебе можно не утонуть`
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
      max_tokens: 400
    });

    const reply = response.choices[0].message.content;
    userHistories[chatId].push({ role: 'assistant', content: reply });
    await bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error('GPT error:', err.message);
    await bot.sendMessage(chatId, 'Ошибка при обращении к GPT. Проверь настройки.');
  }
});
