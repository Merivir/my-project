const express = require('express');
const { sql, poolPromise } = require('../models/db');
const router = express.Router();

// 📌 Բոլոր կուրսերի բեռնում (Levels աղյուսակից)
router.get("/levels", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, name FROM Levels");
        res.json(result.recordset);
    } catch (err) {
        console.error("⛔ Error fetching levels:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/subjects/:courseCode", async (req, res) => {
    try {
        const { courseCode } = req.params;
        console.log(`📡 Fetching subjects for course code: ${courseCode}`);

        if (!courseCode) {
            return res.status(400).json({ error: "Course code is required" });
        }

        // ✅ Ստանում ենք տվյալների connection-ը
        const pool = await poolPromise;

        // ✅ SQL հարցում՝ Schedule-ի և Subjects-ի հետ միացմամբ
        const result = await pool.request()
            .input("courseCode", sql.Int, courseCode)
            .query(`
                SELECT 
                    sub.id AS subject_id,
                    c.code AS course_code,  
                    sub.name AS subject_name, 
                    t.name AS teacher_name, 
                    r.number AS room_number, 
                    ty.name AS type_name,
                    wl.type AS weekly_type  
                FROM Schedule s
                JOIN Courses c ON s.course_id = c.id  
                JOIN Subjects sub ON s.subject_id = sub.id
                JOIN Teachers t ON s.teacher_id = t.id
                JOIN Rooms r ON s.room_id = r.id
                JOIN Types ty ON s.type_id = ty.id
                LEFT JOIN Weekly wl ON s.weekly_id = wl.id
                WHERE c.id = @courseCode;
            `);

        if (!result.recordset.length) {
            return res.status(404).json({ error: "No subjects found for this course code" });
        }

        res.json(result.recordset);
    } catch (error) {
        console.error("❌ Server error fetching subjects:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});


// 📌 Բերում ենք ընտրված կուրսի ID-ին համապատասխան առարկաները (Եթե ըստ ID է աշխատելու)
router.get('/subjects-by-id/:courseId', async (req, res) => {
    const { courseId } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('courseId', sql.Int, courseId)
            .query("SELECT id, name, teacher FROM Subjects WHERE course_id = @courseId");

        res.json(result.recordset);
    } catch (err) {
        console.error("⛔ Error loading subjects:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


router.get("/courses", async (req, res) => {
    try {
        console.log("📡 Fetching courses...");
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, code FROM Courses");

        const courses = result.recordset;
        console.log("✅ All Courses fetched:", courses);

        // ✅ Եթե levelId կա request-ում, ապա ֆիլտրում ենք ըստ կուրսի կոդի առաջին թվի
        if (req.query.levelId) {
            const levelToDigitMap = { "1": "4", "2": "3", "3": "2", "4": "1" };
            const requiredDigit = levelToDigitMap[req.query.levelId];

            if (!requiredDigit) {
                return res.status(400).json({ error: "Invalid level ID" });
            }

            console.log(`🔍 Filtering courses where first digit in code is: ${requiredDigit}`);

            const filteredCourses = courses.filter(course => {
                const match = course.code.match(/\d/); // Գտնում ենք առաջին թիվը
                return match && match[0] === requiredDigit; // Համեմատում ենք
            });

            console.log("✅ Filtered Courses:", filteredCourses);
            return res.json(filteredCourses);
        }

        // ✅ Եթե levelId չկա, վերադարձնում ենք բոլոր կուրսերը
        res.json(courses);
    } catch (error) {
        console.error("⛔ Database error:", error);
        res.status(500).json({ error: "Database error while fetching courses", details: error.message });
    }
});



module.exports = router;
