const express = require('express');
const { sql, poolPromise } = require('../models/db');
const router = express.Router();


router.get('/', async (req, res) => {
    console.log("API HIT: /schedule");
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                s.id,
                l.name AS level_name,  
                c.code AS course_code,  
                d.name AS day_name, 
                w.type AS week_type, 
                ts.slot AS time_slot, 
                r.number AS room_number, 
                sub.name AS subject_name, 
                t.name AS teacher_name, 
                ty.name AS type_name
            FROM Schedule s
            JOIN Levels l ON s.level_id = l.id 
            LEFT JOIN Courses c ON s.course_id = c.id  
            JOIN Days d ON s.day_id = d.id
            JOIN Weeks w ON s.week_id = w.id
            JOIN TimeSlots ts ON s.time_slot_id = ts.id
            JOIN Rooms r ON s.room_id = r.id
            JOIN Subjects sub ON s.subject_id = sub.id
            JOIN Teachers t ON s.teacher_id = t.id
            JOIN Types ty ON s.type_id = ty.id
            ORDER BY d.id, ts.id;
        `);

        console.log("Query Result:", JSON.stringify(result.recordset, null, 2));

        res.json(result.recordset);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).send("Error fetching schedule");
    }
});



router.get('/available-timeslots', async (req, res) => {
    const { teacher_id } = req.query;

    if (!teacher_id) {
        return res.status(400).json({ error: "Missing teacher_id parameter" });
    }

    try {
        console.log(`Fetching available timeslots for teacher_id=${teacher_id}`);
        
        const pool = await poolPromise;
        const result = await pool.request()
            .input('teacher_id', sql.Int, teacher_id)
            .query("SELECT slot FROM AvailableTimeSlots WHERE teacher_id = @teacher_id");

        console.log("Available slots:", result.recordset);
        res.json(result.recordset.map(row => row.slot)); // Վերադարձնում ենք միայն slot-երը
    } catch (err) {
        console.error("Error fetching available timeslots:", err);
        res.status(500).json({ error: "Server error" });
    }
});


// Ստանալ դասացուցակը ֆիլտրերով (եթե պետք լինի)
router.get('/filtered-schedule', async (req, res) => {  // Փոխում ենք '/' -> '/filtered-schedule'
    console.log("API HIT: /filtered-schedule");

    const { day_id, week_id, time_slot_id, room_id, subject_id, teacher_id, type_id } = req.query;

    let query = `
        SELECT 
            s.id, 
            c.code AS course_code, 
            d.name AS day_name, 
            w.type AS week_type, 
            ts.slot AS time_slot, 
            r.number AS room_number, 
            sub.name AS subject_name, 
            t.name AS teacher_name, 
            ty.name AS type_name
        FROM Schedule s
        LEFT JOIN Courses c ON s.course_id = c.id  
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
    if (time_slot_id) { query += ` AND s.time_slot_id = @time_slot_id`; params.push({ name: 'time_slot_id', type: sql.Int, value: time_slot_id }); }
    if (room_id) { query += ` AND s.room_id = @room_id`; params.push({ name: 'room_id', type: sql.Int, value: room_id }); }
    if (subject_id) { query += ` AND s.subject_id = @subject_id`; params.push({ name: 'subject_id', type: sql.Int, value: subject_id }); }
    if (teacher_id) { query += ` AND s.teacher_id = @teacher_id`; params.push({ name: 'teacher_id', type: sql.Int, value: teacher_id }); }
    if (type_id) { query += ` AND s.type_id = @type_id`; params.push({ name: 'type_id', type: sql.Int, value: type_id }); }

    try {
        const pool = await poolPromise;
        const request = pool.request();
        params.forEach(param => request.input(param.name, param.type, param.value));

        const result = await request.query(query);

        console.log(" Filtered Query Result:", JSON.stringify(result.recordset, null, 2));

        res.json(result.recordset);
    } catch (err) {
        console.error('SQL Query Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/save-availability', async (req, res) => {
    const { teacher_id, primary_slots, backup_slots } = req.body;

    if (!teacher_id || (!primary_slots.length && !backup_slots.length)) {
        return res.status(400).json({ error: "Պահանջվում է դասախոս և առնվազն մեկ նշված ժամ" });
    }

    try {
        const pool = await poolPromise;

        console.log("Սկսում ենք պահպանել հասանելիությունը՝ teacher_id:", teacher_id);

        // Ջնջում ենք նախորդ տվյալները, որ կրկնօրինակ չլինի
        await pool.request()
            .input("teacher_id", sql.Int, teacher_id)
            .query("DELETE FROM PrimaryAvailability WHERE teacher_id = @teacher_id");

        await pool.request()
            .input("teacher_id", sql.Int, teacher_id)
            .query("DELETE FROM BackupAvailability WHERE teacher_id = @teacher_id");

        console.log("Նախորդ տվյալները ջնջվեցին");

        // Պատրաստում ենք SQL հարցումները՝ կրկնությունները բացառելու համար
        const insertPrimary = `
            IF NOT EXISTS (
                SELECT 1 FROM PrimaryAvailability 
                WHERE teacher_id = @teacher_id AND day_id = @day_id AND time_slot_id = @time_slot_id
            )
            INSERT INTO PrimaryAvailability (teacher_id, day_id, time_slot_id)
            VALUES (@teacher_id, @day_id, @time_slot_id)
        `;

        const insertBackup = `
            IF NOT EXISTS (
                SELECT 1 FROM BackupAvailability 
                WHERE teacher_id = @teacher_id AND day_id = @day_id AND time_slot_id = @time_slot_id
            )
            INSERT INTO BackupAvailability (teacher_id, day_id, time_slot_id)
            VALUES (@teacher_id, @day_id, @time_slot_id)
        `;

        // Ավելացնում ենք նոր տվյալները (առանց կրկնությունների)
        for (const slot of primary_slots) {
            const [day_id, time_slot_id] = slot.split('-').map(Number);
            await pool.request()
                .input("teacher_id", sql.Int, teacher_id)
                .input("day_id", sql.Int, day_id)
                .input("time_slot_id", sql.Int, time_slot_id)
                .query(insertPrimary);
        }

        for (const slot of backup_slots) {
            const [day_id, time_slot_id] = slot.split('-').map(Number);
            await pool.request()
                .input("teacher_id", sql.Int, teacher_id)
                .input("day_id", sql.Int, day_id)
                .input("time_slot_id", sql.Int, time_slot_id)
                .query(insertBackup);
        }

        console.log("Ժամերը հաջողությամբ ավելացվեցին");
        res.json({ message: " Ժամերը հաջողությամբ պահպանվեցին" });

    } catch (error) {
        console.error(" SQL Query Error:", error);
        res.status(500).json({ error: error.message });
    }
});


//  Ստանալ ֆիլտրերի տարբերակները
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
        console.error(" SQL Query Error:", err);
        res.status(500).send("Server Error: SQL սխալ");
    }
});


// Ավելացնել նոր գրառում
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
        console.error('SQL Query Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});


// Հաշվել տարբեր կուրսերի քանակը
router.get('/courses-count', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT COUNT(DISTINCT course_id) AS courseCount FROM Schedule
        `);
        res.json({ courseCount: result.recordset[0].courseCount });
    } catch (err) {
        console.error(' Error fetching course count:', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/teacher/:teacherId', async (req, res) => {
    const { teacherId } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('teacher_id', sql.Int, teacherId)
            .query(`
                SELECT 
                    t.name AS teacherName,
                    COUNT(s.id) AS subjectCount
                FROM Schedule s
                JOIN Teachers t ON s.teacher_id = t.id
                WHERE s.teacher_id = @teacher_id
                GROUP BY t.name
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: "Teacher not found or no schedule data" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error(" Error fetching teacher schedule:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// 📁 routes/scheduleRoutes.js

router.post('/update-positions', async (req, res) => {
    const updates = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: "No updates provided." });
    }

    try {
        const pool = await poolPromise;

        // Get all Days and TimeSlots to map names to IDs
        const [daysRes, slotsRes] = await Promise.all([
            pool.request().query("SELECT id, name FROM Days"),
            pool.request().query("SELECT id, slot FROM TimeSlots")
        ]);

        const dayMap = Object.fromEntries(daysRes.recordset.map(d => [d.name, d.id]));
        const slotMap = Object.fromEntries(slotsRes.recordset.map(s => [s.slot, s.id]));

        for (const { id, new_day, new_slot } of updates) {
            const dayId = dayMap[new_day];
            const slotId = slotMap[new_slot];

            if (!dayId || !slotId) continue; // skip if mapping failed

            await pool.request()
                .input("id", sql.Int, id)
                .input("day_id", sql.Int, dayId)
                .input("slot_id", sql.Int, slotId)
                .query(`
                    UPDATE created_schedule
                    SET day_of_week = @day_id,
                        time_of_day = @slot_id
                    WHERE id = @id
                `);
        }

        res.json({ message: "All positions updated successfully." });
    } catch (error) {
        console.error("❌ update-positions error:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
});

// scheduleRoutes.js կամ adminRoutes.js մեջ
router.post("/finalize-schedule", async (req, res) => {
    try {
      const pool = await sql.connect(config);
  
      // Նախ մաքրում ենք Schedule աղյուսակը կամ անում ենք Append (եթե պետք է)
      await pool.request().query(`DELETE FROM Schedule`);
  
      // Տեղափոխում ենք created_schedule-ից Schedule
      await pool.request().query(`
        INSERT INTO Schedule (level_id, course_id, subject_id, type_id, teacher_id, room_id, week_id, day_id, time_slot_id, weekly_id, details)
        SELECT 
            l.id AS level_id,
            c.id AS course_id,
            s_sub.id AS subject_id,
            ty.id AS type_id,
            t.id AS teacher_id,
            r.id AS room_id,
            w.id AS week_id,
            cs.day_of_week AS day_id,
            cs.time_of_day AS time_slot_id,
            CASE 
                WHEN cs.week_type = N'երկուսն էլ' THEN (SELECT id FROM Weekly WHERE type = 'weekly')
                ELSE (SELECT id FROM Weekly WHERE type = 'biweekly')
            END AS weekly_id,
            N'Հաստատված դասացուցակ' AS details
        FROM created_schedule cs
        JOIN Levels l ON l.name = cs.level
        JOIN Courses c ON c.code = cs.course
        JOIN Subjects s_sub ON s_sub.name = cs.subject
        JOIN Types ty ON ty.name = cs.type
        JOIN Teachers t ON t.name = JSON_VALUE(cs.teachers, '$[0]')
        JOIN Rooms r ON r.number = JSON_VALUE(cs.rooms, '$[0]')
        JOIN Weeks w ON w.type = cs.week_type;
      `);
  
      res.status(200).json({ message: "✅ Դասացուցակը հաջողությամբ հաստատվել է և տեղափոխվել է Schedule աղյուսակ" });
    } catch (error) {
      console.error("Finalize schedule error:", error);
      res.status(500).json({ error: "❌ Չհաջողվեց ավարտել դասացուցակի տեղափոխումը" });
    }
  });
  

module.exports = router;
