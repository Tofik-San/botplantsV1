require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai');
const fs = require('fs');

const token = process.env.TELEGRAM_TOKEN;
const apiKey = process.env.OPENAI_API_KEY;

const bot = new TelegramBot(token, { polling: true });
const openai = new OpenAI({ apiKey: apiKey });

// Загружаем базу растений
const plants = JSON.parse(fs.readFileSync('plants.json', 'utf-8'));
let activePlant = null;

// Основной обработчик сообщений
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.toLowerCase();

  if (!text || text.length < 2) {
    return bot.sendMessage(chatId, 'Пожалуйста, напишите название растения или уточните, что именно интересует.');
  }

  // Пытаемся найти растение в базе
  const foundPlant = plants.find(p =>
    text.includes(p.name.toLowerCase()) || text.includes(p.latin.toLowerCase())
  );

  if (foundPlant) {
    activePlant = foundPlant;

    const name = foundPlant.name;
    const desc = foundPlant.description;
    const match = foundPlant.short_care;
    const who = foundPlant.for_whom?.join(', ') || '';

    let response = `${name} — ${desc}
`;
    if (who) response += `Подойдёт тем, кто: ${who}

`;

    response += `Уход:
Свет — ${match.Свет}
Полив — ${match.Полив}
Грунт — ${match.Грунт}`;

    if (foundPlant.final) {
      response += `

${foundPlant.final}`;
    }

    response += `

Если нужно подробнее — уточните, что именно интересует: Полив, Удобрения, Посадка и т.д.`;

    return bot.sendMessage(chatId, response);
  }

  // Если растение уже выбрано — обрабатываем уточняющие запросы
  if (activePlant) {
    if (text.includes('посадк')) {
      return bot.sendMessage(chatId, `Посадка: ${activePlant.planting?.Грунт || 'Информация не указана.'}`);
    }
    if (text.includes('удобрени')) {
      const fert = activePlant.fertilizer;
      return bot.sendMessage(chatId, `Удобрения:
Когда: ${fert.Когда}
Чем: ${fert.Чем}
Нюанс: ${fert.Нюанс}`);
    }
    if (text.includes('обрезк')) {
      const prun = activePlant.pruning;
      return bot.sendMessage(chatId, `Обрезка:
Когда: ${prun.Когда}
Что удалять: ${prun.Что удалять}`);
    }
    if (text.includes('полив')) {
      const care = activePlant.care;
      return bot.sendMessage(chatId, `Полив:
${care.Полив || 'Информация не указана.'}`);
    }
    if (text.includes('проблем') || text.includes('сброс') || text.includes('опадают') || text.includes('вянет')) {
      const issues = activePlant.problems;
      if (issues) {
        let response = 'Возможные проблемы:
';
        for (const key in issues) {
          response += `— ${key}: ${issues[key]}
`;
        }
        return bot.sendMessage(chatId, response.trim());
      }
    }

    return bot.sendMessage(chatId, 'Уточните, что именно интересует: Полив, Удобрения, Посадка и т.д.');
  }

  bot.sendMessage(chatId, 'Чтобы помочь, напишите название растения.');
});
