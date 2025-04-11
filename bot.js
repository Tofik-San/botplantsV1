require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENAI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const openai = new OpenAI({ apiKey });

const systemPrompt = {
  role: 'system',
  content: `Ты — бот-консультант по растениям. Работаешь как умный продавец: сначала консультируешь, потом предлагаешь варианты покупки. Стиль — спокойный, уверенный, дружелюбный. Говоришь просто, как человек. Помогаешь выбрать растение и довести до покупки.`
};

const userHistories = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Я помогу подобрать растение и, если нужно, сопроводить до покупки. С чего начнём?', {
    reply_markup: {
      keyboard: [['Подобрать растение'], ['Консультация по уходу']],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text?.trim();
  if (!userMessage || userMessage.startsWith('/start')) return;

  if (!userHistories[chatId]) userHistories[chatId] = [];
  userHistories[chatId].push({ role: 'user', content: userMessage });

  const recentHistory = userHistories[chatId].slice(-6);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [systemPrompt, ...recentHistory],
      max_tokens: 700
    });

    const reply = response.choices[0].message.content;
    userHistories[chatId].push({ role: 'assistant', content: reply });

    const isPurchaseQuery = /купить|заказать|оформить|доставка|менеджер|где взять/i.test(userMessage);

    if (isPurchaseQuery) {
      await bot.sendMessage(chatId, reply, {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Связаться с менеджером', url: 'https://t.me/greentoff' }],
            [{ text: 'Перейти в каталог', url: 'https://yourshop.site/catalog' }],
            [{ text: 'Оформить доставку', url: 'https://yourshop.site/delivery' }]
          ]
        }
      });
    } else {
      await bot.sendMessage(chatId, reply);
    }

  } catch (error) {
    console.error('GPT error:', error.message);
    await bot.sendMessage(chatId, 'Что-то пошло не так. Попробуйте ещё раз позже.');
  }
});
