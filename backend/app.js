const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Импорт маршрутов
const guestRoutes = require('./routes/guestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Подключение маршрутов
app.use('/guest', guestRoutes);
app.use('/admin', adminRoutes);
app.use('/schedule', scheduleRoutes);

// Маршрут для корневого пути "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/index.html'));
});

// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
