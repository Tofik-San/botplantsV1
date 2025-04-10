require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Railway "держит" процесс только если есть сервер
app.get('/', (req, res) => {
  res.send('Бот активен');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Запускаем сам бот
require('./bot');
