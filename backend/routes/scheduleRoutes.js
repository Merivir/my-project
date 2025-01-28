const express = require('express');
const { sql, poolPromise } = require('../models/db');
const router = express.Router();

// Получить всё расписание с фильтрацией
router.get('/', async (req, res) => {
    const { day_id, week_id, timeSlot_id, room_id, subject_id, teacher_id, group_id, type_id } = req.query;

    let query = `
        SELECT 
            s.*, 
            d.name AS day_name, 
            w.type AS week_type, 
            ts.slot AS time_slot, 
            r.room_number, 
            sub.name AS subject_name, 
            t.name AS teacher_name, 
            g.name AS group_name, 
            ty.name AS type_name
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

    const params = [];
    if (day_id) { query += ` AND s.day_id = @day_id`; params.push({ name: 'day_id', type: sql.Int, value: day_id }); }
    if (week_id) { query += ` AND s.week_id = @week_id`; params.push({ name: 'week_id', type: sql.Int, value: week_id }); }
    if (timeSlot_id) { query += ` AND s.time_slot_id = @timeSlot_id`; params.push({ name: 'timeSlot_id', type: sql.Int, value: timeSlot_id }); }
    if (room_id) { query += ` AND s.room_id = @room_id`; params.push({ name: 'room_id', type: sql.Int, value: room_id }); }
    if (subject_id) { query += ` AND s.subject_id = @subject_id`; params.push({ name: 'subject_id', type: sql.Int, value: subject_id }); }
    if (teacher_id) { query += ` AND s.teacher_id = @teacher_id`; params.push({ name: 'teacher_id', type: sql.Int, value: teacher_id }); }
    if (group_id) { query += ` AND s.group_id = @group_id`; params.push({ name: 'group_id', type: sql.Int, value: group_id }); }
    if (type_id) { query += ` AND s.type_id = @type_id`; params.push({ name: 'type_id', type: sql.Int, value: type_id }); }

    try {
        const pool = await poolPromise;
        const request = pool.request();
        params.forEach(param => request.input(param.name, param.type, param.value));

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Ошибка выполнения запроса:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Получить список фильтров
router.get('/filters', async (req, res) => {
    try {
        const pool = await poolPromise;
        const filters = {};

        const queries = {
            days: 'SELECT id, name FROM Days',
            weeks: 'SELECT id, type AS name FROM Weeks',
            timeSlots: 'SELECT id, slot AS name FROM TimeSlots',
            rooms: 'SELECT id, room_number AS name FROM Rooms',
            subjects: 'SELECT id, name FROM Subjects',
            teachers: 'SELECT id, name FROM Teachers',
            groups: 'SELECT id, name FROM Groups',
            types: 'SELECT id, name FROM Type'
        };

        for (const key in queries) {
            filters[key] = await pool.request().query(queries[key]).then(res => res.recordset);
        }

        res.json(filters);
    } catch (err) {
        console.error('Ошибка загрузки фильтров:', err.message);
        res.status(500).json({ error: 'Ошибка загрузки фильтров' });
    }
});

// Добавить новую запись в расписание
router.post('/', async (req, res) => {
    const { day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, group_id, type_id, details } = req.body;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('day_id', sql.Int, day_id)
            .input('week_id', sql.Int, week_id)
            .input('time_slot_id', sql.Int, time_slot_id)
            .input('room_id', sql.Int, room_id)
            .input('subject_id', sql.Int, subject_id)
            .input('teacher_id', sql.Int, teacher_id)
            .input('group_id', sql.Int, group_id)
            .input('type_id', sql.Int, type_id)
            .input('details', sql.NVarChar, JSON.stringify(details || {}))
            .query(`
                INSERT INTO Schedule (day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, group_id, type_id, details)
                VALUES (@day_id, @week_id, @time_slot_id, @room_id, @subject_id, @teacher_id, @group_id, @type_id, @details)
            `);

        res.status(201).json({ message: 'Запись в расписание добавлена успешно!' });
    } catch (err) {
        console.error('Ошибка добавления записи в расписание:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
