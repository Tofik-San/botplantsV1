require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENAI_API_KEY;

const bot = new TelegramBot(token, { polling: true });

const openai = new OpenAI({
  apiKey: apiKey
});

// System Prompt — вот он
const systemPrompt = {
  role: 'system',
  content: `Ты бот-консультант по растениям. Отвечай кратко, по делу, без научных терминов. Если мало данных — задай вопрос. Не придумывай, не оправдывайся, не говори, что ты ИИ. Говори как человек, который точно знает своё дело.`
};

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        systemPrompt,
        { role: 'user', content: userMessage }
      ],
    });

    const reply = response.choices[0].message.content;
    bot.sendMessage(chatId, reply);

  } catch (error) {
    console.error('GPT error:', error);
    bot.sendMessage(chatId, 'Ошибка при обращении к GPT.');
  }
});
