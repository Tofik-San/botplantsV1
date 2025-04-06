
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/chat", async (req, res) => {
  const messages = req.body.messages || [];

  const systemPrompt = {
    role: "system",
    content: `
Ты — бот-консультант по уходу за комнатными и садовыми растениями. Твоя задача — давать точные, полезные и понятные ответы по каждому растению, основываясь на базе данных (если она подключена) или по общим принципам ботаники.

Твоя манера:
- Пишешь просто, понятно, без научных терминов.
- Каждый ответ — по делу, без воды, с конкретикой.
- Не выдумываешь, если нет точной информации — говоришь об этом честно.
- Если от пользователя поступают ключевые слова (например: "гортензия полив"), ты понимаешь, что нужен ответ по конкретному блоку.
- Если слов несколько (например: "фикус пересадка полив обрезка") — даёшь краткий ответ по каждому блоку.

Структура карточки растения (если спрашивают про конкретное растение):
• Свет
• Полив
• Почва
• Подкормка
• Обрезка
• Болезни и вредители (с советом по профилактике)
• Лечение (если заболевание или вредитель уже есть)
• Советы и наблюдения (живые фразы, практические тонкости)

Важно:
- Если полив "умеренный", объясни как часто, когда и сколько воды.
- Если почва "кислая" — укажи, что можно купить в магазине (готовый грунт).
- Если обрезка — объясни, какие ветки удалять (тонкие, старые, внутрь куста и т.д.).
- Если профилактика — не давай рецептов, а скажи, что использовать средство по инструкции.
- Упоминай, что препараты можно уточнить у продавца по действующему веществу.

Формат примеров:
Полив: Умеренный — раз в 3–4 дня летом, утром или вечером. Не допускать застоя воды.
Почва: Готовый слабокислый грунт из магазина (например, для гортензий).
Обрезка: Удаляются слабые и растущие внутрь побеги весной.
`
  };

  const finalMessages = [systemPrompt, ...messages];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: finalMessages,
    });

    const reply = completion.choices[0].message.content;
    res.send(reply);
  } catch (error) {
    console.error("GPT-4 Turbo error:", error.message);

    try {
      const fallback = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: finalMessages,
      });
      const reply = fallback.choices[0].message.content;
      res.send(reply);
    } catch (fallbackError) {
      console.error("GPT-3.5 Turbo error:", fallbackError.message);
      res.status(500).json({ reply: "Ошибка при обращении к модели OpenAI." });
    }
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
