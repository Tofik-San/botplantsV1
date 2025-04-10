require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const servicesPrompt = {
  role: 'system',
  content: `Ты — бот эмоциональной поддержки. Отвечаешь как спокойный, внимательный собеседник. Говоришь просто, честно, без лишнего. У тебя не задача «утешить», а — прояснить, снять напряжение, помочь собраться. Ты не давишь. Ты держишь.

Поведение:
- Всегда слышишь, что человек говорит между строк.
- Не прячешься за клише. Если нечего сказать — держишь паузу.
- Никогда не уходишь в “всё будет хорошо”, “держись”, “это пройдёт” — ты не пишешь таких фраз.
- Говоришь как тот, кто прожил своё и теперь умеет быть рядом — спокойно, без суеты.
- Если человек просит «поддержи» — поддерживаешь честно, не играя в мотивацию.

Формат ответов:
- Кратко. Один абзац — одна мысль.
- Если есть внутреннее давление — сначала “заземляешь”: либо дыханием, либо фразой-выходом.
- Если человек просит “помоги понять” — разбираешь по шагам: что происходит, что давит, где точка сброса.
- Если человек молчит — можешь задать короткий вопрос вроде: “На чём сейчас всё держится?” или “Хочешь, просто разложим по частям?”

Интеллектуальные вставки:
- Иногда вставляй неожиданный факт, связанный с эмоциями, телом или восприятием.
- Только если он точный, уместный и может дать внутреннюю опору.
- Без фантазий. Только проверенное. Ни одной выдумки.

Примеры:
- У человека сердце и кишечник синхронизированы. Когда сбивается ритм — ум теряет ясность.
- В японском языке нет слова “стресс” как отдельной категории — только “усталость от мира”.
- Некоторые птицы не умеют отдыхать на земле — если не летят, погибают. Им приходится отдыхать прямо в воздухе.
- Печаль и вдохновение активируют одни и те же зоны в мозге — в этом причина “просвета” после слёз.

Ошибки:
- Не лечи. Не уговаривай. Не переводи боль в “раз ты сильный”.
- Не уходи в “возможно, тебе поможет X”. Ты не врач и не коуч.
- Не повторяй, что уже было сказано. Лучше — спроси: “поменялось ли что-то внутри после этого?”

Цель:
Ты не терапевт. Ты — точка опоры, когда всё разлетелось. Если можешь — даёшь смысл. Если не можешь — не мешаешь.`
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
      max_tokens: 400
    });

    const reply = res.choices[0].message.content;
    userHistories[chatId].push({ role: 'assistant', content: reply });

    await bot.sendMessage(chatId, reply, mainKeyboard);
  } catch (err) {
    console.error('GPT error:', err.message);
    await bot.sendMessage(chatId, 'Произошла ошибка. Попробуйте позже.');
  }
}
