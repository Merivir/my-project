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


app.get('/guest', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/guest.html'));
});

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/admin-login.html'));
});

app.get('/admin-register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/admin-register.html'));
});

app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/html/admin-dashboard.html'));
});


// Подключение маршрутов
app.use('/guest', guestRoutes);
app.use('/admin', adminRoutes);
app.use('/schedule', scheduleRoutes);

// Пример API для работы с расписанием
app.get('/api/schedule', async (req, res) => {
    const { day_id, week_id, group_id } = req.query;
    let query = 'SELECT * FROM Schedule WHERE 1=1';

    if (day_id) query += ` AND day_id = ${day_id}`;
    if (week_id) query += ` AND week_id = ${week_id}`;
    if (group_id) query += ` AND group_id = ${group_id}`;

    try {
        const result = await req.dbPool.request().query(query);
        const schedules = result.recordset.map(schedule => {
            return {
                ...schedule,
                details: schedule.details ? JSON.parse(schedule.details) : null
            };
        });
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});





app.post('/api/schedule', async (req, res) => {
    const { day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, group_id, type_id, details } = req.body;

    try {
        await req.dbPool.request()
            .input('day_id', sql.Int, day_id)
            .input('week_id', sql.Int, week_id)
            .input('time_slot_id', sql.Int, time_slot_id)
            .input('room_id', sql.Int, room_id)
            .input('subject_id', sql.Int, subject_id)
            .input('teacher_id', sql.Int, teacher_id)
            .input('group_id', sql.Int, group_id)
            .input('type_id', sql.Int, type_id) // Use type_id instead of type
            .input('details', sql.NVarChar, JSON.stringify(details || {}))
            .query(`INSERT INTO Schedule (day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, group_id, type_id, details)
                    VALUES (@day_id, @week_id, @time_slot_id, @room_id, @subject_id, @teacher_id, @group_id, @type_id, @details)`);

        res.status(201).json({ message: 'Schedule entry created successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
