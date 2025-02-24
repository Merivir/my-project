const express = require("express");
const { sql, poolPromise } = require("../models/db");
const router = express.Router();

// ✅ Բերում ենք առարկաները
router.get("/subjects", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, name FROM Subjects");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: "Server error while fetching subjects" });
    }
});

// ✅ Բերում ենք լսարանները
router.get("/rooms", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, number FROM Rooms");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: "Server error while fetching rooms" });
    }
});

// ✅ Բերում ենք դասի տեսակները
router.get("/types", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, name FROM Types");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: "Server error while fetching types" });
    }
});


router.put('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const { subject_id, teacher_id, room_id, type_id, frequency } = req.body;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('subject_id', sql.Int, subject_id)
            .input('teacher_id', sql.Int, teacher_id)
            .input('room_id', sql.Int, room_id)
            .input('type_id', sql.Int, type_id)
            .input('frequency', sql.NVarChar, frequency)
            .query(`
                UPDATE schedule_editable
                SET subject_id = @subject_id, teacher_id = @teacher_id, 
                    room_id = @room_id, type_id = @type_id, frequency = @frequency
                WHERE id = @id
            `);

        res.json({ message: "✅ Փոփոխությունը հաջողությամբ կատարվեց" });
    } catch (error) {
        console.error("⛔ Database update error:", error);
        res.status(500).json({ error: "Database update error" });
    }
});


module.exports = router;
