const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let activePlant = null;
const plants = JSON.parse(fs.readFileSync("plants.json", "utf-8"));

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text.toLowerCase();

  const foundPlant = plants.find(p =>
    text.includes(p.name.toLowerCase()) || text.includes(p.latin.toLowerCase())
  );

  if (foundPlant) {
    activePlant = foundPlant;

    const name = foundPlant.name;
    const desc = foundPlant.description;
    const match = foundPlant.short_care;
    const who = foundPlant.for_whom?.join(", ") || "";

    let response = `${name} — ${desc}\n`;
    if (who) response += `Подойдёт тем, кто: ${who}\n\n`;

    response += `Уход:\nСвет — ${match.Свет}\nПолив — ${match.Полив}\nГрунт — ${match.Грунт}\n\nЕсли нужно подробнее — уточните, что именно интересует: Полив, Удобрения, Посадка и т.д.`;

    return bot.sendMessage(chatId, response);
  }

  if (activePlant) {
    const fert = activePlant.fertilizer;
    const prun = activePlant.pruning;
    const plant = activePlant.planting;

    if (text.includes("посадк")) {
      return bot.sendMessage(chatId, `Посадка:\n${plant?.Грунт || "Информация не указана."}`);
    }

    if (text.includes("удобрени")) {
      return bot.sendMessage(chatId,
        `Удобрения:\nКогда: ${fert?.Когда || "–"}\nЧем: ${fert?.Чем || "–"}\nНюанс: ${fert?.Нюанс || "–"}`
      );
    }

    if (text.includes("обрезк")) {
      return bot.sendMessage(chatId,
        `Обрезка:\nКогда: ${prun?.Когда || "–"}\nЧто удалять: ${prun?.["Что удалять"] || "–"}`
      );
    }

    if (
      text.includes("проблем") ||
      text.includes("сброс") ||
      text.includes("опадают") ||
      text.includes("вянет")
    ) {
      const issues = activePlant.problems;
      if (issues) {
        let response = "Возможные проблемы:\n";
        for (const key in issues) {
          response += `— ${key}: ${issues[key]}\n`;
        }
        return bot.sendMessage(chatId, response.trim());
      }
    }

    return bot.sendMessage(chatId, "Уточните, что именно интересует: Полив, Удобрения, Посадка и т.д.");
  }

  bot.sendMessage(chatId, "Чтобы помочь, напишите название растения.");
});
