const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// База данных прямо в памяти сервера
let db = {
    users: {
        "bot_banker": { "password": "123", "balance": 5000, "role": "admin" },
        "danya": { "password": "12345", "balance": 1000, "role": "user" },
        "den": { "password": "123", "balance": 0, "role": "user" }
    },
    orders: []
};

// === API РЕГИСТРАЦИИ И ВХОДА ===
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Заполните все поля!' });
    
    if (db.users[username]) return res.status(400).json({ success: false, message: 'Этот ник уже занят!' });
    
    db.users[username] = { password: password, balance: 0, role: 'user' };
    res.json({ success: true, message: 'Регистрация успешна! Введите пароль и нажмите "Войти".' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!db.users[username] || db.users[username].password !== password) {
        return res.status(400).json({ success: false, message: 'Неверный ник или пароль!' });
    }
    res.json({ success: true, user: { username, balance: db.users[username].balance, role: db.users[username].role } });
});

// === API НАЧИСЛЕНИЯ БАЛАНСА (ДЛЯ АДМИНА) ===
app.post('/api/admin/change-balance', (req, res) => {
    const { targetUser, amount } = req.body;
    
    if (!db.users[targetUser]) {
        return res.status(404).json({ success: false, message: 'Пользователь не найден!' });
    }
    
    db.users[targetUser].balance += parseInt(amount);
    res.json({ success: true, newBalance: db.users[targetUser].balance });
});

// === API ПОЛУЧЕНИЯ ТЕКУЩЕГО БАЛАНСА ===
app.get('/api/user/balance/:username', (req, res) => {
    if (!db.users[req.params.username]) return res.status(404).json({ balance: 0 });
    res.json({ balance: db.users[req.params.username].balance });
});

// === API СИСТЕМЫ ЗАКАЗОВ ===
app.post('/api/orders/create', (req, res) => {
    const { username, item } = req.body;
    if (!username || !item) return res.status(400).json({ success: false, message: 'Не указан товар!' });

    const newOrder = {
        id: Date.now(),
        username: username,
        item: item,
        status: 'Принят'
    };

    db.orders.push(newOrder);
    res.json({ success: true, message: 'Заказ отправлен в ПВЗ КЛ!', order: newOrder });
});

app.get('/api/orders/my/:username', (req, res) => {
    const userOrders = db.orders.filter(order => order.username === req.params.username);
    res.json(userOrders);
});

app.get('/api/orders/all', (req, res) => {
    res.json(db.orders);
});

app.post('/api/orders/update-status', (req, res) => {
    const { orderId, newStatus } = req.body;
    const order = db.orders.find(o => o.id == orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Заказ не найден!' });

    order.status = newStatus;
    res.json({ success: true });
});

// === Авто-поиск index.html ===
app.get('*', (req, res) => {
    const publicPath = path.join(__dirname, 'public', 'index.html');
    const rootPath = path.join(__dirname, 'index.html');
    
    const fs = require('fs');
    if (fs.existsSync(publicPath)) {
        res.sendFile(publicPath);
    } else if (fs.existsSync(rootPath)) {
        res.sendFile(rootPath);
    } else {
        res.status(404).send('Файл index.html не найден!');
    }
});

app.listen(PORT, () => {
    console.log(`Сервер КЛ запущен!`);
});

module.exports = app;
