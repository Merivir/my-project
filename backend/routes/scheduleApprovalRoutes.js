const express = require('express');
const { sql, poolPromise } = require('../models/db');
const router = express.Router();

router.get('/', async (req, res) => {
    console.log("📌 API HIT: /schedule_approval");
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
       SELECT 
    cs.id,
    cs.course,
    d.name AS day,
    ts.slot AS time_slot,
    cs.subject,
    cs.type AS class_type,
    t.name AS teacher,
    cs.rooms AS room,
    cs.week_type
FROM created_schedule cs
JOIN Days d ON cs.day_of_week = d.id
JOIN TimeSlots ts ON cs.time_of_day = ts.id
JOIN Teachers t ON CAST(JSON_VALUE(cs.teachers, '$[0]') AS INT) = t.id
ORDER BY d.id, ts.id;

        `);

        console.log("📌 Query Result:", JSON.stringify(result.recordset, null, 2));
        res.json(result.recordset);
    } catch (error) {
        console.error("❌ Database error:", error);
        res.status(500).send("❌ Error fetching schedule approval data");
    }
});

module.exports = router;
