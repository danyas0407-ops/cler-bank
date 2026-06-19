const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DB_FILE = path.join(__dirname, 'database.json');

function readDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (err) {
        return { users: { "Seryoga": 5000 }, orders: {} };
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Баланс
app.get('/api/balance/:username', (req, res) => {
    const db = readDB();
    const user = req.params.username;
    const balance = db.users[user] !== undefined ? db.users[user] : 0;
    res.json({ username: user, balance: balance });
});

// Переводы робликов
app.post('/api/transaction', (req, res) => {
    const { from, to, amount } = req.body;
    const db = readDB();

    if (!db.users[from] || db.users[from] < amount) {
        return res.status(400).json({ error: "Недостаточно робликов или аккаунт не найден" });
    }
    if (amount <= 0) {
        return res.status(400).json({ error: "Неверная сумма перевода" });
    }

    db.users[from] -= amount;
    db.users[to] = (db.users[to] || 0) + amount;

    writeDB(db);
    res.json({ success: true, newBalance: db.users[from] });
});

// Сканирование в ПВЗ
app.post('/api/pvz/scan', (req, res) => {
    const { qrToken } = req.body;
    const db = readDB();
    const order = db.orders[qrToken];

    if (!order) {
        return res.status(404).json({ error: "Заказ не найден в базе ПВЗ Клер Банка!" });
    }
    if (order.status === "Выдано") {
        return res.status(400).json({ error: "Этот заказ уже был выдан!" });
    }

    res.json({ success: true, ...order });
});

// Выдача маски
app.post('/api/pvz/complete', (req, res) => {
    const { qrToken } = req.body;
    const db = readDB();

    if (db.orders[qrToken]) {
        db.orders[qrToken].status = "Выдано";
        writeDB(db);
        return res.json({ success: true, message: "Статус обновлен" });
    }
    res.status(404).json({ error: "Заказ не найден" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Клер Банк запущен на порту ${PORT}`);
});
