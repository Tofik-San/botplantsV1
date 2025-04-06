# Используем официальный Node.js образ
FROM node:18

# Создаем директорию приложения
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json ./
RUN npm install

# Копируем остальные файлы
COPY . .

# Открываем порт
EXPOSE 3000

# Команда запуска
CMD ["node", "server.js"]