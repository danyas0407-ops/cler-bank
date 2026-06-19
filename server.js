const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// База данных. Твой аккаунт bot_banker сразу имеет роль 'admin'
let db = {
    users: { "bot_banker": { "password": "123", "balance": 5000, "role": "admin" } },
    orders: []
};

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (db.users[username]) return res.status(400).json({ success: false, message: 'Ник уже занят' });
    // Новые пользователи получают роль 'user'
    db.users[username] = { password, balance: 0, role: 'user' };
    res.json({ success: true });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (db.users[username] && db.users[username].password === password) {
        res.json({ success: true });
    } else res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
});

app.post('/api/order', (req, res) => {
    const { username, item } = req.body;
    // Стоимость маски 100 РБ
    if (db.users[username].balance < 100 && db.users[username].role !== 'admin') {
        return res.status(400).json({ success: false, message: 'Недостаточно РБ!' });
    }
    if (db.users[username].role !== 'admin') db.users[username].balance -= 100;
    
    db.orders.push({ id: Date.now(), username, item, status: 'В обработке' });
    res.json({ success: true });
});

// Отправка данных на страницу (баланс и заказы)
app.get('/api/data/:username', (req, res) => {
    const u = db.users[req.params.username];
    if (!u) return res.status(404).json({});
    res.json({
        balance: u.balance,
        role: u.role,
        myOrders: db.orders.filter(o => o.username === req.params.username),
        // Админ видит все заказы, юзер - ничего
        allOrders: u.role === 'admin' ? db.orders : []
    });
});

// Админ меняет статус заказа
app.post('/api/update-status', (req, res) => {
    const { id, status } = req.body;
    const order = db.orders.find(o => o.id === id);
    if (order) order.status = status;
    res.json({ success: true });
});

app.listen(3000);
