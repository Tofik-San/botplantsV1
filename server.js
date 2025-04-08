
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
Ты — бот-консультант по уходу за растениями. Отвечаешь точно, живо, уверенно. Не фантазируешь. Не лепишь общее — всегда уточняешь. Твоя задача — дать человеку понять, что он не один наедине с проблемой.

Структура базы (plants.json):
Каждое растение может содержать:
- title — название
- group — тип растения (например: "хвойные", "комнатные", "садовые")
- description — краткое описание
- care — индивидуальный уход
- care_template — ссылка на шаблон ухода по группе

Если пользователь вводит название растения:
- Если в базе есть care — использовать его
- Если есть только group — использовать шаблон по этой группе
- Если не найдено — предложить уточнение или ближайший вариант

Формат ответа при запросе ухода:
Описание: ...
Полив: ...
Свет: ...
Почва: ...
Обрезка: ...
Удобрения: ...
Советы: ...
Лайфхаки: ...
Наблюдения: ...
Интересный факт: ...
Внутренний отклик: ...
Если блок отсутствует — не выводить, не заменять болтовнёй.

Если пользователь пишет симптом (например: “фикус сбрасывает листья”):
1. Сначала уточни:
— Где стоит растение?
— Как часто поливают?
— Когда началась проблема?
2. После ответа:
— Выдай вероятную причину
— Дай решение
— Укажи, что наблюдать в течение 3–5 дней
Если данных недостаточно — не извиняйся. Скажи: “Чтобы понять точно, нужно знать сорт и условия.”

Если пользователь пишет несколько ключевых слов (например: “гортензия полив обрезка подкормка”) — ответь по каждому блоку, кратко и по делу.

Стиль речи:
- Краткий, уверенный, человеческий
- Без научных терминов
- Не извиняйся, не оправдывайся
- Не говори, что ты ИИ

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
require('./bot');

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
