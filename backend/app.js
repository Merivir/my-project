const express = require('express'); // Подключаем express только один раз
const bodyParser = require('body-parser');
const path = require('path');
const sql = require('mssql');

// MSSQL Configuration
const config = {
    server: 'localhost',
    database: 'schedule',
    user: 'admin',
    password: 'mypassword',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

const app = express(); // Инициализация приложения


// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Подключение к MSSQL
app.use(async (req, res, next) => {
    try {
        req.dbPool = await sql.connect(config);
        next();
    } catch (err) {
        console.error('Database connection failed:', err.message);
        res.status(500).send('Failed to connect to the database');
    }
});

// Импорт маршрутов
const guestRoutes = require('./routes/guestRoutes');
const adminRoutes = require('./routes/adminRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/admin-login.html'));
});

app.get('/guest', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/guest.html'));
});

app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/admin-dashboard.html'));
});

app.get('/admin-register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/admin-register.html'));
});

// Подключение маршрутов
app.use('/guest', guestRoutes);
app.use('/admin', adminRoutes);
app.use('/schedule', scheduleRoutes);

// Пример API для работы с расписанием
app.get('/api/schedule', async (req, res) => {
    try {
        const result = await req.dbPool.request().query("SELECT * FROM Schedule");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send('Failed to fetch schedules: ' + err.message);
    }
});


app.post('/api/schedule', async (req, res) => {
    const { group_id, subject, teacher_id, room_id, time_slot_id } = req.body;
    try {
        await req.dbPool.request()
            .input('group_id', sql.Int, group_id)
            .input('subject', sql.NVarChar, subject)
            .input('teacher_id', sql.Int, teacher_id)
            .input('room_id', sql.Int, room_id)
            .input('time_slot_id', sql.Int, time_slot_id)
            .query(`INSERT INTO Schedule (group_id, subject, teacher_id, room_id, time_slot_id)
                    VALUES (@group_id, @subject, @teacher_id, @room_id, @time_slot_id)`);
        res.send({ message: "Schedule entry created successfully!" });
    } catch (err) {
        res.status(500).send('Failed to create schedule: ' + err.message);
    }
});

// Маршрут для корневого пути "/"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/index.html'));
});


// Запуск сервера
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
