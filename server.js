const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

let db = {
    users: {
        "bot_banker": { "password": "123", "balance": 5000, "role": "admin" },
        "danya": { "password": "12345", "balance": 1000, "role": "user" },
        "den": { "password": "123", "balance": 0, "role": "user" }
    },
    orders: []
};

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (db.users[username]) return res.status(400).json({ success: false, message: 'Ник занят!' });
    db.users[username] = { password: password, balance: 0, role: 'user' };
    res.json({ success: true, message: 'Успешно!' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!db.users[username] || db.users[username].password !== password) {
        return res.status(400).json({ success: false, message: 'Неверный ник или пароль!' });
    }
    res.json({ success: true, user: { username, balance: db.users[username].balance, role: db.users[username].role } });
});

app.post('/api/admin/change-balance', (req, res) => {
    const { targetUser, amount } = req.body;
    if (!db.users[targetUser]) return res.status(404).json({ success: false, message: 'Игрок не найден!' });
    db.users[targetUser].balance += parseInt(amount);
    res.json({ success: true, newBalance: db.users[targetUser].balance });
});

app.get('/api/user/balance/:username', (req, res) => {
    res.json({ balance: db.users[req.params.username] ? db.users[req.params.username].balance : 0 });
});

app.post('/api/orders/create', (req, res) => {
    const { username, item } = req.body;
    const newOrder = { id: Date.now(), username, item, status: 'Принят' };
    db.orders.push(newOrder);
    res.json({ success: true, order: newOrder });
});

app.get('/api/orders/my/:username', (req, res) => {
    res.json(db.orders.filter(o => o.username === req.params.username));
});

app.get('/api/orders/all', (req, res) => {
    res.json(db.orders);
});

app.post('/api/orders/update-status', (req, res) => {
    const { orderId, newStatus } = req.body;
    const order = db.orders.find(o => o.id == orderId);
    if (order) order.status = newStatus;
    res.json({ success: true });
});

app.get('*', (req, res) => {
    const fs = require('fs');
    const p = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(p)) res.sendFile(p);
    else res.status(404).send('Not Found');
});

app.listen(PORT);
module.exports = app;
