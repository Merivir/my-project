const express = require('express');
const { sql, poolPromise } = require('../models/db');
const router = express.Router();

router.get("/schedule", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                s.id,
                s.course_id,  
                s.week_id,    
                d.name AS day_name,
                w.type AS week_type,
                ts.slot AS time_slot,
                r.number AS room_number,  
                sub.name AS subject_name,
                t.name AS teacher_name,
                ty.name AS type_name,
                s.details
            FROM Schedule s
            JOIN Days d ON s.day_id = d.id
            JOIN Weeks w ON s.week_id = w.id
            JOIN TimeSlots ts ON s.time_slot_id = ts.id
            JOIN Rooms r ON s.room_id = r.id  
            JOIN Subjects sub ON s.subject_id = sub.id
            JOIN Teachers t ON s.teacher_id = t.id
            JOIN Types ty ON s.type_id = ty.id
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ SQL Query Error:", err);
        res.status(500).send("❌ Server Error: SQL ошибка");
    }
});


// 📌 **2. Ստանալ դասացուցակը ֆիլտրերով**
router.get('/', async (req, res) => {
    const { day_id, week_id, timeSlot_id, room_id, subject_id, teacher_id, type_id } = req.query;

    let query = `
        SELECT 
            s.id, 
            d.name AS day_name, 
            w.type AS week_type, 
            ts.slot AS time_slot, 
            r.number AS room_number, 
            sub.name AS subject_name, 
            t.name AS teacher_name, 
            ty.name AS type_name
        FROM Schedule s
        JOIN Days d ON s.day_id = d.id
        JOIN Weeks w ON s.week_id = w.id
        JOIN TimeSlots ts ON s.time_slot_id = ts.id
        JOIN Rooms r ON s.room_id = r.id  
        JOIN Subjects sub ON s.subject_id = sub.id
        JOIN Teachers t ON s.teacher_id = t.id
        JOIN Types ty ON s.type_id = ty.id
        WHERE 1=1
    `;

    const params = [];
    if (day_id) { query += ` AND s.day_id = @day_id`; params.push({ name: 'day_id', type: sql.Int, value: day_id }); }
    if (week_id) { query += ` AND s.week_id = @week_id`; params.push({ name: 'week_id', type: sql.Int, value: week_id }); }
    if (timeSlot_id) { query += ` AND s.time_slot_id = @timeSlot_id`; params.push({ name: 'timeSlot_id', type: sql.Int, value: timeSlot_id }); }
    if (room_id) { query += ` AND s.room_id = @room_id`; params.push({ name: 'room_id', type: sql.Int, value: room_id }); }
    if (subject_id) { query += ` AND s.subject_id = @subject_id`; params.push({ name: 'subject_id', type: sql.Int, value: subject_id }); }
    if (teacher_id) { query += ` AND s.teacher_id = @teacher_id`; params.push({ name: 'teacher_id', type: sql.Int, value: teacher_id }); }
    if (type_id) { query += ` AND s.type_id = @type_id`; params.push({ name: 'type_id', type: sql.Int, value: type_id }); }

    try {
        const pool = await poolPromise;
        const request = pool.request();
        params.forEach(param => request.input(param.name, param.type, param.value));

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('❌ SQL Query Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 📌 **3. Ստանալ ֆիլտրերի տարբերակները**
router.get('/filters', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT DISTINCT d.name AS day_name, w.type AS week_type, ts.slot AS time_slot, r.number AS room_number, t.name AS teacher_name
            FROM Schedule s
            JOIN Days d ON s.day_id = d.id
            JOIN Weeks w ON s.week_id = w.id
            JOIN TimeSlots ts ON s.time_slot_id = ts.id
            JOIN Rooms r ON s.room_id = r.id  
            JOIN Teachers t ON s.teacher_id = t.id
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ SQL Query Error:", err);
        res.status(500).send("❌ Server Error: SQL սխալ");
    }
});

// 📌 **4. Ավելացնել նոր գրառում (Առանց `details`)**
router.post('/', async (req, res) => {
    const { day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, type_id } = req.body;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('day_id', sql.Int, day_id)
            .input('week_id', sql.Int, week_id)
            .input('time_slot_id', sql.Int, time_slot_id)
            .input('room_id', sql.Int, room_id)
            .input('subject_id', sql.Int, subject_id)
            .input('teacher_id', sql.Int, teacher_id)
            .input('type_id', sql.Int, type_id)
            .query(`
                INSERT INTO Schedule (day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, type_id)
                VALUES (@day_id, @week_id, @time_slot_id, @room_id, @subject_id, @teacher_id, @type_id)
            `);

        res.status(201).json({ message: 'Դասացուցակի գրառումը հաջողությամբ ավելացվեց!' });
    } catch (err) {
        console.error('❌ SQL Query Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/courses-count', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COUNT(DISTINCT course_id) AS courseCount FROM Schedule
        `);
        res.json({ courseCount: result.recordset[0].courseCount });
    } catch (err) {
        console.error('❌ Error fetching course count:', err.message);
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
