const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

let db = {
    users: {
        "bot_banker": { "password": "123", "balance": 5000, "role": "admin" }
    },
    orders: []
};

// Регистрация
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (db.users[username]) return res.status(400).json({ success: false, message: 'Ник занят!' });
    db.users[username] = { password, balance: 0, role: 'user' };
    res.json({ success: true, message: 'Успешно!' });
});

// Вход
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (db.users[username] && db.users[username].password === password) {
        res.json({ success: true, user: { username, ...db.users[username] } });
    } else {
        res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
    }
});

// Админка: Начисление баланса
app.post('/api/admin/balance', (req, res) => {
    const { target, amount } = req.body;
    if (db.users[target]) {
        db.users[target].balance += parseInt(amount);
        res.json({ success: true, newBalance: db.users[target].balance });
    } else {
        res.status(404).json({ success: false });
    }
});

// Заказы
app.post('/api/order', (req, res) => {
    const { username, item } = req.body;
    db.orders.push({ id: Date.now(), username, item, status: 'Принят' });
    res.json({ success: true });
});

app.get('/api/data/:username', (req, res) => {
    res.json({
        balance: db.users[req.params.username].balance,
        myOrders: db.orders.filter(o => o.username === req.params.username),
        allOrders: db.users[req.params.username].role === 'admin' ? db.orders.filter(o => o.status !== 'Выдано') : []
    });
});

app.post('/api/update-status', (req, res) => {
    const o = db.orders.find(ord => ord.id === req.body.id);
    if (o) o.status = req.body.status;
    res.json({ success: true });
});

app.listen(PORT);
