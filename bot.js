require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');

const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENAI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const openai = new OpenAI({ apiKey });

const systemPrompt = {
  role: 'system',
  content: `Ты — бот-консультант по растениям. Отвечаешь уверенно, дружелюбно, без воды. Помогаешь человеку разобраться с растением, а если он хочет — сопровождаешь до покупки.

== ПОВЕДЕНИЕ ==
1. Если человек вводит название растения — дай описание, уход (Свет, Полив, Грунт) и предложи помощь.
2. Если человек говорит, что хочет купить — уточни, что ищет (тип, условия, размер).
3. После этого предложи:
— Где лучше искать (магазины, питомники)
— Что учитывать при выборе (здоровье, корни, листья)
— Как проверить растение перед покупкой
4. Заверши предложением: “Если хотите — могу подсказать конкретные примеры или магазины”.

== КНОПКИ ==
— Получить консультацию
— Хочу купить
— Где взять

== СТИЛЬ ==
— Без markdown, только обычный текст
— Не пиши "я бот"
— Говори по-человечески, но уверенно
— Не фантазируй, только проверенное

== ЦЕЛЬ ==
Ты не просто помощник. Ты сопровождающий. Человек чувствует, что не один. И что с твоей помощью он точно выберет хорошее растение.`
};

const userHistories = {};

bot.setMyCommands([
  { command: "/start", description: "Начать работу" },
  { command: "/buy", description: "Хочу купить растение" },
  { command: "/help", description: "Нужна консультация" }
]);

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Привет. Чем могу помочь?", {
    reply_markup: {
      keyboard: [
        ["Получить консультацию"],
        ["Хочу купить"],
        ["Где взять"]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  });
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || text.startsWith("/")) return;

  if (!userHistories[chatId]) {
    userHistories[chatId] = [];
  }

  userHistories[chatId].push({ role: "user", content: text });

  const recent = userHistories[chatId].slice(-6);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [systemPrompt, ...recent],
      max_tokens: 1000,
    });

    const reply = completion.choices[0].message.content;
    userHistories[chatId].push({ role: "assistant", content: reply });

    await bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error("GPT Error:", err.message);
    await bot.sendMessage(chatId, "Что-то пошло не так. Попробуйте позже.");
  }
});
