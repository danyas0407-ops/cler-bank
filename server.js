const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// База данных
let db = {
    users: { "bot_banker": { "password": "123", "balance": 5000, "role": "admin" } },
    orders: []
};

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (db.users[username]) return res.status(400).json({ success: false, message: 'Ник уже занят' });
    db.users[username] = { password, balance: 0, role: 'user' };
    res.json({ success: true });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (db.users[username] && db.users[username].password === password) {
        res.json({ success: true });
    } else res.status(401).json({ success: false, message: 'Неверный логин или пароль' });
});

// Новый API для перевода денег
app.post('/api/transfer', (req, res) => {
    const { sender, recipient, amount } = req.body;
    const sum = parseInt(amount);

    if (!sum || sum <= 0) return res.status(400).json({ success: false, message: 'Неверная сумма!' });
    if (!db.users[sender] || !db.users[recipient]) return res.status(400).json({ success: false, message: 'Получатель не найден!' });
    if (db.users[sender].balance < sum && db.users[sender].role !== 'admin') {
        return res.status(400).json({ success: false, message: 'Недостаточно РБ!' });
    }

    // Списываем у отправителя (если он не админ с бесконечными деньгами) и даем получателю
    if (db.users[sender].role !== 'admin') db.users[sender].balance -= sum;
    db.users[recipient].balance += sum;

    res.json({ success: true });
});

app.post('/api/order', (req, res) => {
    const { username, item } = req.body;
    if (db.users[username].balance < 100 && db.users[username].role !== 'admin') {
        return res.status(400).json({ success: false, message: 'Недостаточно РБ!' });
    }
    if (db.users[username].role !== 'admin') db.users[username].balance -= 100;
    
    db.orders.push({ id: Date.now(), username, item, status: 'В обработке' });
    res.json({ success: true });
});

app.get('/api/data/:username', (req, res) => {
    const u = db.users[req.params.username];
    if (!u) return res.status(404).json({});
    res.json({
        balance: u.balance,
        role: u.role,
        myOrders: db.orders.filter(o => o.username === req.params.username),
        allOrders: u.role === 'admin' ? db.orders : []
    });
});

app.post('/api/update-status', (req, res) => {
    const { id, status } = req.body;
    const order = db.orders.find(o => o.id === id);
    if (order) order.status = status;
    res.json({ success: true });
});

app.listen(3000);
