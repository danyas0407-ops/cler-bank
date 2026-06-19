const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db = {
    users: { "bot_banker": { "password": "123", "balance": 5000 } },
    orders: []
};

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (db.users[username]) return res.status(400).json({ success: false });
    db.users[username] = { password, balance: 0 };
    res.json({ success: true });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (db.users[username] && db.users[username].password === password) {
        res.json({ success: true });
    } else res.status(401).json({ success: false });
});

app.post('/api/order', (req, res) => {
    const { username, item } = req.body;
    db.orders.push({ username, item, status: 'Принят' });
    res.json({ success: true });
});

app.listen(3000);
