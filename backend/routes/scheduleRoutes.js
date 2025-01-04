const express = require('express');
const { sql, poolPromise } = require('../models/db');
const router = express.Router();

// Получить всё расписание
router.get('/', async (req, res) => {
    const { day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, group_id, type_id } = req.query;

    let query = `
        SELECT 
            s.id AS schedule_id,
            d.name AS day_name,
            w.type AS week_type,
            ts.slot AS time_slot,
            r.room_number,
            sub.name AS subject_name,
            t.name AS teacher_name,
            g.name AS group_name,
            ty.name AS type_name,
            s.details
        FROM Schedule s
        JOIN Days d ON s.day_id = d.id
        JOIN Weeks w ON s.week_id = w.id
        JOIN TimeSlots ts ON s.time_slot_id = ts.id
        JOIN Rooms r ON s.room_id = r.id
        JOIN Subjects sub ON s.subject_id = sub.id
        JOIN Teachers t ON s.teacher_id = t.id
        JOIN Groups g ON s.group_id = g.id
        JOIN Type ty ON s.type_id = ty.id
        WHERE 1=1
    `;

    if (day_id) query += ` AND s.day_id = ${day_id}`;
    if (week_id) query += ` AND s.week_id = ${week_id}`;
    if (time_slot_id) query += ` AND s.time_slot_id = ${time_slot_id}`;
    if (room_id) query += ` AND s.room_id = ${room_id}`;
    if (subject_id) query += ` AND s.subject_id = ${subject_id}`;
    if (teacher_id) query += ` AND s.teacher_id = ${teacher_id}`;
    if (group_id) query += ` AND s.group_id = ${group_id}`;
    if (type_id) query += ` AND s.type_id = ${type_id}`;

    try {
        const result = await req.dbPool.request().query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Ошибка выполнения запроса:', err.message);
        res.status(500).send('Ошибка выполнения запроса');
    }
});



// API для фильтров
router.get('/filters', async (req, res) => {
    try {
        const filters = {};

        // Fetch days
        filters.days = await req.dbPool.request()
            .query('SELECT id, name FROM Days')
            .then(result => result.recordset);

        // Fetch weeks
        filters.weeks = await req.dbPool.request()
            .query('SELECT id, type AS name FROM Weeks') // Adjust query based on your database schema
            .then(result => result.recordset);

        // Fetch time slots
        filters.timeSlots = await req.dbPool.request()
            .query('SELECT id, slot AS name FROM TimeSlots')
            .then(result => result.recordset);

        // Fetch rooms
        filters.rooms = await req.dbPool.request()
            .query('SELECT id, room_number AS name FROM Rooms')
            .then(result => result.recordset);

        // Fetch subjects
        filters.subjects = await req.dbPool.request()
            .query('SELECT id, name FROM Subjects')
            .then(result => result.recordset);

        // Fetch teachers
        filters.teachers = await req.dbPool.request()
            .query('SELECT id, name FROM Teachers')
            .then(result => result.recordset);

        // Fetch groups
        filters.groups = await req.dbPool.request()
            .query('SELECT id, name FROM Groups')
            .then(result => result.recordset);

        // Fetch types
        filters.types = await req.dbPool.request()
            .query('SELECT id, name FROM Type')
            .then(result => result.recordset);

        res.json(filters);
    } catch (err) {
        console.error('Error fetching filters:', err.message);
        res.status(500).send('Error fetching filters');
    }
});




// Добавить новую запись расписания
router.post('/schedule', async (req, res) => {
    const { day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, group_id, type, details } = req.body;

    try {
        await req.dbPool.request()
            .input('day_id', sql.Int, day_id)
            .input('week_id', sql.Int, week_id)
            .input('time_slot_id', sql.Int, time_slot_id)
            .input('room_id', sql.Int, room_id)
            .input('subject_id', sql.Int, subject_id)
            .input('teacher_id', sql.Int, teacher_id)
            .input('group_id', sql.Int, group_id)
            .input('type', sql.NVarChar, type)
            .input('details', sql.NVarChar, JSON.stringify(details || {})) // Ensure details is a JSON string
            .query(`INSERT INTO Schedule (day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, group_id, type, details)
                    VALUES (@day_id, @week_id, @time_slot_id, @room_id, @subject_id, @teacher_id, @group_id, @type, @details)`);

        res.status(201).json({ message: 'Schedule added successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



module.exports = router;
