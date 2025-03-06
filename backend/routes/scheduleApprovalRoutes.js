const express = require('express');
const { sql, poolPromise } = require('../models/db');
const router = express.Router();

router.get('/', async (req, res) => {
    console.log("📌 API HIT: /schedule_approval");
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                id,
                level, 
                course, 
                subject, 
                type, 
                mapped_type, 
                teachers, 
                rooms, 
                preferred_slots, 
                day_of_week, 
                time_of_day, 
                week_type 
            FROM created_schedule
            ORDER BY day_of_week, time_of_day;
        `);

        console.log("📌 Query Result:", JSON.stringify(result.recordset, null, 2));
        res.json(result.recordset);
    } catch (error) {
        console.error("❌ Database error:", error);
        res.status(500).send("❌ Error fetching schedule approval data");
    }
});

module.exports = router;
