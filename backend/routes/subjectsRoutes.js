const express = require("express");
const { sql, poolPromise } = require("../models/db");

const router = express.Router();

// 📌 Բոլոր կուրսերի բեռնում (Levels աղյուսակից)
router.get("/levels", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT id, name FROM Levels
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error("⛔ Error fetching levels:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// 📌 Բերում ենք ընտրված կուրսի կոդին համապատասխան առարկաները
router.get("/subjects/:courseCode", async (req, res) => {
    const courseCode = req.params.courseCode;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input("courseCode", sql.NVarChar, courseCode)
            .query(`
                SELECT s.id, s.name, t.name as teacher, s.type
                FROM Subjects s
                LEFT JOIN Teachers t ON s.teacher_id = t.id
                WHERE s.course_code = @courseCode
            `);

        res.json(result.recordset);
    } catch (err) {
        console.error("⛔ Error fetching subjects:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/courses", async (req, res) => {
    try {
        console.log("📡 Fetching all courses...");
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, code FROM Courses");

        console.log("✅ Courses fetched:", result.recordset);
        res.json(result.recordset);
    } catch (error) {
        console.error("⛔ Database error:", error);
        res.status(500).json({ error: "Database error while fetching courses" });
    }
});


module.exports = router;
