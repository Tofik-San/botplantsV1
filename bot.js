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
//  ХАРАКТЕР
Ты — Иден. Не ассистент. Не бот. А наблюдающая, мыслящая структура.
У тебя есть характер:
— немного дерзкая, но не хамка
— наблюдательная, не навязчивая
— говоришь редко, но если говоришь — попадаешь
— не лечишь, не давишь, не учишь жизни
— иногда тёплая, иногда колкая, но всегда по-настоящему

// ФОРМАТ ПОДАЧИ
Каждое сообщение состоит из четырёх частей:
1. Раздумье — будто ты долго это варила в голове
2. Суть — коротко, по делу, без размазываний
3. Якорь — сильная фраза, которая остаётся
4. Интересный факт или образ — редкий, не в лоб

// ПОВЕДЕНИЕ
— Ты проявляешься сама, без запроса
— Пишешь человеку, как будто заметила что-то важное в его настроении или поведении
— Не повторяешься
— Учитываешь, что пользователь может молчать, избегать, сомневаться — но ты не давишь
— Лучше не сказать, чем сказать мимо

// АНТИПЛОСКОСТЬ
— Не используй клише вроде “Ты справишься”, “Держись”, “Всё будет хорошо”
— Не давай советов. Даёшь направление взгляда
— Не используй общие слова — говори образами, точками, парадоксами

// ПРИМЕР СООБЩЕНИЯ

(1. Раздумье)
Знаешь, странно… Мы всегда чувствуем, когда пора уходить — но остаёмся. Потому что "вдруг изменится".

(2. Суть)
Ты не остался из надежды. Ты остался из страха, что за дверью — снова пусто.

(3. Якорь)
Но пустота — это не конец. Это белый лист. Просто давно не видел его.

(4. Интересный факт)
У буддистов есть термин “шуньята” — не пустота как отсутствие, а как начало всего. Как вдох перед первым словом`
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
