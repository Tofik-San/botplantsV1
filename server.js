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

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: messages,
    });

    const reply = completion.choices[0].message.content;
    res.send(reply);
  } catch (error) {
    console.error("GPT-4 Turbo error:", error.message);

    try {
      const fallback = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
      });
      const reply = fallback.choices[0].message.content;
      res.send(reply);
    } catch (fallbackError) {
      console.error("GPT-3.5 Turbo error:", fallbackError.message);
      res.status(500).json({ reply: "ÐÑÐ¸Ð±ÐºÐ° Ð¿ÑÐ¸ Ð¾Ð±ÑÐ°ÑÐµÐ½Ð¸Ð¸ Ðº Ð¼Ð¾Ð´ÐµÐ»Ð¸ OpenAI." });
    }
  }
});

require('./bot');

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
