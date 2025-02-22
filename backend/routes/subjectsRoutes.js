const express = require("express");
const { sql, poolPromise } = require("../models/db");

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
    const courseCode = req.params.courseCode;

    try {
        const pool = await poolPromise;
        console.log(`📡 Fetching subjects for courseCode: ${courseCode}`);

        const result = await pool.request()
            .input("courseCode", sql.Int, courseCode) // Փոխի՛ր եթե պետք է NVARCHAR
            .query(`
                SELECT 
                    s.id, 
                    s.name AS subject_name, 
                    ISNULL(t.name, 'Չի նշված') AS teacher_name
                FROM Subjects s
                LEFT JOIN Schedule sch ON s.id = sch.subject_id
                LEFT JOIN Teachers t ON sch.teacher_id = t.id
                WHERE s.course_id = (SELECT id FROM Courses WHERE code = @courseCode);
            `);

        console.log("✅ Query executed successfully.");
        console.log("✅ Query Result:", result.recordset);

        if (!result.recordset || result.recordset.length === 0) {
            console.warn(`⚠️ No subjects found for courseCode: ${courseCode}`);
            return res.status(404).json({ message: "No subjects found" });
        }

        res.json(result.recordset);
    } catch (err) {
        console.error("⛔ Error fetching subjects:", err);
        res.status(500).json({ message: "Server error", error: err.message });
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
