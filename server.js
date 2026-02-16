const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const APP_URL = process.env.APP_URL;
const DATABASE_URL = process.env.DATABASE_URL;

const bot = new TelegramBot(TOKEN, { polling: true });

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Создание таблицы
pool.query(`
  CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    name TEXT,
    phone TEXT,
    time TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Запишитесь на сессию:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Записаться", web_app: { url: APP_URL } }]
      ]
    }
  });
});

app.post("/book", async (req, res) => {
  const { name, phone, time } = req.body;

  await pool.query(
    "INSERT INTO bookings (name, phone, time) VALUES ($1, $2, $3)",
    [name, phone, time]
  );

  bot.sendMessage(
    ADMIN_CHAT_ID,
    `🔔 Новая запись\n\nИмя: ${name}\nТелефон: ${phone}\nВремя: ${time}`
  );

  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started"));
