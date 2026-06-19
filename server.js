const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// База данных в памяти сервера
let db = {
    users: {
        "bot_banker": { "password": "123", "balance": 5000, "role": "admin" }
    },
    orders: []
};

// API: Регистрация
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (db.users[username]) return res.status(400).json({ success: false, message: 'Ник занят!' });
    db.users[username] = { password, balance: 0, role: 'user' };
    res.json({ success: true, message: 'Успешно!' });
});

// API: Вход
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (db.users[username] && db.users[username].password === password) {
        res.json({ success: true, user: { username, ...db.users[username] } });
    } else {
        res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }
});

// API: Управление балансом (для админа)
app.post('/api/admin/balance', (req, res) => {
    const { target, amount } = req.body;
    if (db.users[target]) {
        db.users[target].balance += parseInt(amount);
        res.json({ success: true, newBalance: db.users[target].balance });
    } else {
        res.status(404).json({ success: false, message: 'Игрок не найден' });
    }
});

// API: Заказ
app.post('/api/order', (req, res) => {
    const { username, item } = req.body;
    db.orders.push({ id: Date.now(), username, item, status: 'Принят' });
    res.json({ success: true });
});

// API: Данные для интерфейса
app.get('/api/data/:username', (req, res) => {
    const user = db.users[req.params.username];
    if (!user) return res.status(404).json({});
    res.json({
        balance: user.balance,
        myOrders: db.orders.filter(o => o.username === req.params.username),
        allOrders: user.role === 'admin' ? db.orders.filter(o => o.status !== 'Выдано') : []
    });
});

// API: Статус заказа
app.post('/api/update-status', (req, res) => {
    const o = db.orders.find(ord => ord.id === req.body.id);
    if (o) o.status = req.body.status;
    res.json({ success: true });
});

app.listen(PORT);
