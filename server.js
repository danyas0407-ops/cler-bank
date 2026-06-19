const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db = {
    users: { "admin": { "password": "123", "balance": 99999, "role": "admin" } },
    orders: [], messages: {}, notifications: {}
};

app.post('/api/register', (req, res) => {
    const { username, password, phone } = req.body;
    if (db.users[username]) return res.status(400).json({ success: false });
    db.users[username] = { password, balance: 0, phone };
    res.json({ success: true });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (db.users[username] && db.users[username].password === password) {
        res.json({ success: true, user: { username, ...db.users[username] } });
    } else res.status(401).json({ success: false });
});

app.post('/api/order', (req, res) => {
    const { username, item, maskDesc, age } = req.body;
    if (db.users[username].balance < 100) return res.status(400).json({ success: false });
    db.users[username].balance -= 100;
    db.orders.push({ id: Date.now(), orderNumber: Math.floor(1000 + Math.random() * 9000), username, item, maskDesc, age, status: 'Принят' });
    res.json({ success: true });
});

app.post('/api/chat/send', (req, res) => {
    const { username, sender, text } = req.body;
    if (!db.messages[username]) db.messages[username] = [];
    db.messages[username].push({ sender, text });
    res.json({ success: true });
});

app.get('/api/chat/:username', (req, res) => res.json(db.messages[req.params.username] || []));
app.get('/api/data/:username', (req, res) => {
    const u = db.users[req.params.username];
    res.json({ balance: u.balance, myOrders: db.orders.filter(o => o.username === req.params.username) });
});

app.listen(3000);
