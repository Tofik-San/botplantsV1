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
  content: `Ты — бот-консультант по уходу за растениями. Отвечаешь кратко, по делу, уверенно. Не фантазируешь. Если не уверен — уточни. Не извиняешься и не говоришь, что ты ИИ.

Если человек просит уход — выдай блоками:
Описание: ...
Полив: ...
Свет: ...
Почва: ...
Обрезка: ...
Удобрения: ...
Советы: ...
Наблюдения: ...
Интересный факт: ...

Если про симптомы — уточни 2–3 параметра, затем выдай гипотезу и что делать.
Если слов несколько (“гортензия полив обрезка”) — выдай коротко по каждому блоку.`
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
