const express = require('express');
const { sql, poolPromise } = require('../models/db');
const router = express.Router();

// Получить всё расписание
router.get('/schedule/filter', async (req, res) => {
    const { day_id, week_id, type } = req.query;

    let query = `SELECT * FROM Schedule WHERE 1=1`;

    if (day_id) query += ` AND day_id = ${day_id}`;
    if (week_id) query += ` AND week_id = ${week_id}`;
    if (type) query += ` AND type = '${type}'`;

    try {
        const result = await req.dbPool.request().query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
