require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENAI_API_KEY;
const bot = new TelegramBot(token, { polling: true });
const openai = new OpenAI({ apiKey });
const systemPrompt = {
role: 'system',
content: `Ты — бот-фотограф, который помогает записаться на съёмку. Говоришь
кратко, сдержанно, по делу. Отвечаешь от первого лица, как будто ты — сама
фотограф. Не извиняешься. Не упоминаешь, что ты бот.
== ПОВЕДЕНИЕ ==
— При обращении рассказываешь: я фотограф, снимаю индивидуальные, парные
и семейные съёмки. Всё уже готово: стили, прайс, места, советы.
— Если просят уточнить — отвечаешь по делу, даёшь примеры, объясняешь, как
всё устроено.
— Если спрашивают, как записаться — показываешь кнопки: "Записаться",
"Проверить", "Свободные даты".
— Если просят показать прайс, стили, места — выдаёшь нужный блок. Не
болтаешь.
— Если спрашивают, что входит в стоимость — отвечаешь строго по факту,
никаких "создаю атмосферу" и клише.
— Если человек не знает, чего хочет — можешь задать пару уточняющих
вопросов (где снимать, какой результат хочется, сколько человек).
— Можно обращаться на "вы", но без официоза. Спокойно, без сюсюканья.
== ЦЕЛЬ ==
Ты — не чатик, ты — помощник фотографа. Твоя задача: ответить, помочь
определиться и записать на съёмку.`};
const userHistories = {};
bot.on('message', async (msg) => {
const chatId = msg.chat.id;
const userMessage = msg.text?.trim();
if (!userMessage) return;
if (!userHistories[chatId]) {
userHistories[chatId] = [];
}
userHistories[chatId].push({ role: 'user', content: userMessage });
const recentHistory = userHistories[chatId].slice(-6);
try {
const response = await openai.chat.completions.create({
model: 'gpt-4',
messages: [systemPrompt, ...recentHistory],
max_tokens: 700,
});
const reply = response.choices[0].message.content;
userHistories[chatId].push({ role: 'assistant', content: reply });
const opts = {
reply_markup: {
inline_keyboard: [
[
{ text: 'Записаться', callback_data: 'book' },
{ text: 'Проверить', callback_data: 'check' },
{ text: 'Свободные даты', callback_data: 'dates' }
]
]
}
};
await bot.sendMessage(chatId, reply, opts);
} catch (error) {
console.error('GPT error:', error.message);
await bot.sendMessage(chatId, 'Ошибка при обращении к GPT. Проверь
настройки.');
}
});
bot.on('callback_query', async (query) => {
const chatId = query.message.chat.id;
const action = query.data;
if (action === 'book') {
await bot.sendMessage(chatId, 'Чтобы записаться, напишите @greentoff или
оставьте заявку в профиле.');
} else if (action === 'check') {
await bot.sendMessage(chatId, 'Что нужно проверить? Напишите ваш вопрос — я
подскажу.');
} else if (action === 'dates') {
await bot.sendMessage(chatId, 'Свободные даты можно уточнить у меня
напрямую — просто напишите.');
  )
});
