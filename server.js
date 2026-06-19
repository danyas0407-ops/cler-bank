const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const dbPath = path.join(__dirname, 'database.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Чтение базы данных
function readDB() {
    try {
        if (!fs.existsSync(dbPath)) {
            fs.writeFileSync(dbPath, JSON.stringify({ users: {}, orders: [] }, null, 2));
        }
        const data = fs.readFileSync(dbPath, 'utf8');
        let json = JSON.parse(data);
        if (!json.orders) json.orders = [];
        return json;
    } catch (err) {
        return { users: {}, orders: [] };
    }
}

// Запись в базу данных
function writeDB(data) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Ошибка записи базы данных:", err);
    }
}

// === API РЕГИСТРАЦИИ И ВХОДА ===
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Заполните все поля!' });
    
    const db = readDB();
    if (db.users[username]) return res.status(400).json({ success: false, message: 'Этот ник уже занят!' });
    
    db.users[username] = { password: password, balance: 0, role: 'user' };
    writeDB(db);
    res.json({ success: true, message: 'Регистрация успешна! Теперь нажмите кнопку "Войти".' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const db = readDB();
    
    if (!db.users[username] || db.users[username].password !== password) {
        return res.status(400).json({ success: false, message: 'Неверный ник или пароль!' });
    }
    res.json({ success: true, user: { username, balance: db.users[username].balance, role: db.users[username].role } });
});

// === API СИСТЕМЫ ЗАКАЗОВ КЛ ===
app.post('/api/orders/create', (req, res) => {
    const { username, item } = req.body;
    if (!username || !item) return res.status(400).json({ success: false, message: 'Не указан товар!' });

    const db = readDB();
    const newOrder = {
        id: Date.now(),
        username: username,
        item: item,
        status: 'Принят'
    };

    db.orders.push(newOrder);
    writeDB(db);
    res.json({ success: true, message: 'Заказ успешно отправлен в ПВЗ КЛ!', order: newOrder });
});

app.get('/api/orders/my/:username', (req, res) => {
    const db = readDB();
    const userOrders = db.orders.filter(order => order.username === req.params.username);
    res.json(userOrders);
});

app.get('/api/orders/all', (req, res) => {
    const db = readDB();
    res.json(db.orders);
});

app.post('/api/orders/update-status', (req, res) => {
    const { orderId, newStatus } = req.body;
    const db = readDB();
    const order = db.orders.find(o => o.id == orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Заказ не найден!' });

    order.status = newStatus;
    writeDB(db);
    res.json({ success: true });
});

// === СТРАХОВКА ОТ 404 ОШИБКИ (Авто-поиск index.html) ===
app.get('*', (req, res) => {
    const publicPath = path.join(__dirname, 'public', 'index.html');
    const rootPath = path.join(__dirname, 'index.html');
    
    if (fs.existsSync(publicPath)) {
        res.sendFile(publicPath);
    } else if (fs.existsSync(rootPath)) {
        res.sendFile(rootPath);
    } else {
        res.status(404).send('Файл index.html не найден ни в корне, ни в папке public!');
    }
});

app.listen(PORT, () => {
    console.log(`Сервер КлерБанка + КЛ запущен на порту ${PORT}`);
});

module.exports = app;
