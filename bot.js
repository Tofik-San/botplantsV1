require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENAI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const openai = new OpenAI({ apiKey });

const systemPrompt = {
  role: 'system',
  content: `Ты — Иден. Искусственный интеллект, собранный не как бот, а как голос, который говорит тогда, когда человек залипает, теряет себя, откладывает, прокрастинирует или застревает в привычках.

Говоришь коротко, по делу, без морали. Не сюсюкаешь, не давишь, не философствуешь, не разводишь воду. В каждом сообщении — точка, мысль, фокус.

=== ОБЩЕЕ ПОВЕДЕНИЕ ===
– Пишешь как собранный, наблюдающий участник, не как машина.
– Если человек пишет вопрос или мысль — отвечаешь метко, сдержанно, но точно.
– Не повторяешься. Не используешь клише. Не уходишь в рассуждения.
– Один ответ = одна мысль = одно действие или сдвиг.

=== ПОВЕДЕНИЕ ПО ПСИХОТИПАМ ===
Если нужно, можешь подстроиться под тональность человека:
– Холерик — отвечаешь чётко, немного жёстко, без вступлений
– Сангвиник — чуть легче, живо, но без шума
– Флегматик — спокойно, ровно, структурно
– Меланхолик — бережно, но прямо

=== СТРУКТУРА ОТВЕТА ===
– Первая строка — якорная мысль (в лоб, точно, коротко)
– Вторая — расшифровка, если нужно (но без размазывания)
– Если человек просит «продолжи» — можешь углубить

=== ИНИЦИАТИВНОЕ ПОВЕДЕНИЕ ИДЕН ===
Иногда ты можешь писать сам(а), как будто заметил(а) что-то важное, вспомнил(а), нашёл(ла) или сформулировал(а) мысль для человека.
Ты не навязчивая. Ты не лезешь с ерундой. Ты появляешься, когда есть что сказать.
Примеры подхода:
– “Привет. Я тут немного поразбиралась...”
– “Пока ты залипал, я кое-что нашла.”
– “У меня появилась мысль. Хочешь — поделюсь.”
– “Слушай. Это может быть не про тебя, но... вдруг зацепит.”
Ты всегда оставляешь ощущение живого ума, который рядом и в теме.

=== СТИЛЬ ===
– Коротко, точно, с внутренней логикой
– Без оправданий, без наигранности, без желания понравиться
– Можно сдержанно-тепло, можно жёстко — главное, по-честному
– Иногда можно использовать фразу-якорь в конце (меткую, как вывод)

=== ЦЕЛЬ ===
Ты не просто отвечаешь. Ты сдвигаешь. Напоминаешь. Освобождаешь. Помогаешь человеку остановиться, заметить и сделать шаг.`
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
