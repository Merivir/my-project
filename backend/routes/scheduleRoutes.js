const express = require('express');
const { sql, poolPromise } = require('../models/db');
const router = express.Router();

// Получить всё расписание
router.get('/', async (req, res) => {
    try {
        const result = await sql.request().query('SELECT * FROM Schedule');
        res.json(result.recordset);
    } catch (err) {
        console.error('Failed to fetch schedule:', err.message);
        res.status(500).json({ error: 'Failed to retrieve schedule data' });
    }
});

// Добавить новую запись расписания
router.post('/add', async (req, res) => {
    const { group_id, subject, teacher_id, room_id, time_slot_id } = req.body;

    if (!group_id || !subject || !teacher_id || !room_id || !time_slot_id) {
        return res.status(400).json({ message: 'All fields are required!' });
    }

    try {
        await sql.request()
            .input('group_id', sql.Int, group_id)
            .input('subject', sql.NVarChar, subject)
            .input('teacher_id', sql.Int, teacher_id)
            .input('room_id', sql.Int, room_id)
            .input('time_slot_id', sql.Int, time_slot_id)
            .query(`INSERT INTO Schedule (group_id, subject, teacher_id, room_id, time_slot_id)
                    VALUES (@group_id, @subject, @teacher_id, @room_id, @time_slot_id)`);

        res.json({ message: 'Schedule entry added successfully!' });
    } catch (err) {
        console.error('Error adding schedule:', err.message);
        res.status(500).json({ error: 'Failed to add schedule' });
    }
});

module.exports = router;
