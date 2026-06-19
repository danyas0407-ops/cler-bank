const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db = {
    users: { "bot_banker": { "password": "123", "balance": 5000, "role": "admin" } },
    orders: []
};

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (db.users[username]) return res.status(400).json({ success: false, message: 'Ник занят!' });
    db.users[username] = { password, balance: 0, role: 'user' };
    res.json({ success: true, message: 'Успешно!' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (db.users[username] && db.users[username].password === password) {
        res.json({ success: true, user: { username, ...db.users[username] } });
    } else {
        res.status(401).json({ success: false, message: 'Ошибка входа' });
    }
});

app.post('/api/admin/balance', (req, res) => {
    const { target, amount } = req.body;
    if (db.users[target]) {
        db.users[target].balance += parseInt(amount);
        res.json({ success: true });
    } else res.status(404).json({ success: false });
});

app.post('/api/order', (req, res) => {
    const { username, item } = req.body;
    db.orders.push({ 
        id: Date.now(), 
        orderNumber: Math.floor(1000 + Math.random() * 9000),
        address: "СНТ Оргстроевец, 62",
        username, 
        item, 
        status: 'Принят' 
    });
    res.json({ success: true });
});

app.post('/api/update-status', (req, res) => {
    const { id, status } = req.body;
    const o = db.orders.find(ord => ord.id === id);
    if (o) o.status = status;
    res.json({ success: true });
});

app.get('/api/data/:username', (req, res) => {
    const u = db.users[req.params.username];
    if (!u) return res.status(404).json({});
    res.json({
        balance: u.balance,
        myOrders: db.orders.filter(o => o.username === req.params.username),
        allOrders: u.role === 'admin' ? db.orders.filter(o => o.status !== 'Выдано') : []
    });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT);
