const express = require("express");
const { sql, poolPromise } = require("../models/db");

const router = express.Router();

// Բերում ենք առարկաները
router.get("/subjects", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, name FROM subjects_editable");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: "Server error while fetching subjects" });
    }
});

// Բերում ենք լսարանները
router.get("/rooms", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, number FROM Rooms");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: "Server error while fetching rooms" });
    }
});

// Բերում ենք դասի տեսակները
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
    let { teacher_id, room_id, type_id, frequency } = req.body;

    console.log("Received update request:", { id, teacher_id, room_id, type_id, frequency });

    try {
        const pool = await poolPromise;

        // Ստուգում ենք՝ արդյոք տվյալը կա `schedule_editable`-ում
        const existing = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM schedule_editable WHERE id = @id');

        if (!existing.recordset.length) {
            console.log("Գրառումը չի գտնվել schedule_editable-ում");
            return res.status(404).json({ error: "Գրառումը չի գտնվել schedule_editable-ում" });
        }

        console.log("🔍 Existing record in schedule_editable:", existing.recordset[0]);

        // Թարմացնում ենք միայն schedule_editable աղյուսակը
        const updateResult = await pool.request()
            .input('id', sql.Int, id)
            .input('teacher_id', sql.Int, teacher_id || null)
            .input('room_id', sql.Int, room_id || null)
            .input('type_id', sql.Int, type_id || null)
            .input('frequency', sql.NVarChar, frequency || "weekly")
            .query(`
                UPDATE schedule_editable
                SET 
                    teacher_id = @teacher_id, 
                    room_id = @room_id, 
                    type_id = @type_id, 
                    details = @frequency
                WHERE id = @id;
            `);

        console.log("Update success in schedule_editable, rows affected:", updateResult.rowsAffected);

        // Ստուգում ենք փոփոխությունը
        const checkUpdated = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM schedule_editable WHERE id = @id');

        console.log("🔎 Updated record in schedule_editable:", checkUpdated.recordset[0]);

        res.json({ message: "Փոփոխությունը հաջողությամբ կատարվեց", updatedData: checkUpdated.recordset[0] });
    } catch (error) {
        console.error("Error updating schedule_editable record:", error);
        res.status(500).json({ error: "Database update error", details: error.message });
    }
});

router.delete("/schedule/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await poolPromise;

        // Ստուգում ենք՝ արդյոք տվյալը գոյություն ունի schedule_editable-ում
        const existing = await pool.request()
            .input("id", sql.Int, id)
            .query("SELECT id FROM schedule_editable WHERE id = @id");

        if (!existing.recordset.length) {
            return res.status(404).json({ error: "Գրառումը չի գտնվել schedule_editable-ում" });
        }

        // Հիմնական DELETE հարցում՝ ճիշտ id-ի համաձայն
        await pool.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM schedule_editable WHERE id = @id");

        res.json({ message: "Դասացուցակից տվյալը հաջողությամբ ջնջվեց" });
    } catch (error) {
        console.error("Error deleting schedule record:", error);
        res.status(500).json({ error: "Server error while deleting from schedule_editable" });
    }
});

// 📌 Լեկցիա անցկացնող դասախոսներ
router.get("/lecture-teachers", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, name FROM Teachers");
        res.json(result.recordset);
    } catch (error) {
        console.error("❌ Error fetching lecture teachers:", error);
        res.status(500).json({ error: "Server error while fetching lecture teachers", details: error.message });
    }
});

// 📌 Գործնական դասեր անցկացնող դասախոսներ
router.get("/practical-teachers", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, name FROM Teachers");
        res.json(result.recordset);
    } catch (error) {
        console.error("❌ Error fetching practical teachers:", error);
        res.status(500).json({ error: "Server error while fetching practical teachers", details: error.message });
    }
});

// 📌 Լաբորատոր դասեր անցկացնող դասախոսներ
router.get("/lab-teachers", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, name FROM Teachers");
        res.json(result.recordset);
    } catch (error) {
        console.error("❌ Error fetching lab teachers:", error);
        res.status(500).json({ error: "Server error while fetching lab teachers", details: error.message });
    }
});


router.post('/subjects/add-subject', async (req, res) => {
    const {
        subjectName,
        teacherId,
        room_number,
        frequency,
        practical,
        lab
    } = req.body;

    console.log("📩 Received data on server:", req.body);

    // Ստուգում ենք՝ պարտադիր դաշտերը լրացված են
    if (!subjectName || !teacherId || !room_number) {
        return res.status(400).json({ error: 'Պարտադիր է մուտքագրել subjectName, teacherId և room_number' });
    }

    try {
        const pool = await poolPromise;

        // 1. Ստուգում ենք՝ արդյոք Rooms աղյուսակում կա նշված room_number (հիմք՝ number դաշտում)
        const roomResult = await pool.request()
            .input('room_number', sql.NVarChar, room_number)
            .query('SELECT id FROM Rooms WHERE number = @room_number');
        if (roomResult.recordset.length === 0) {
            return res.status(400).json({ error: `Լսարանը, որի համար ${room_number} է, գոյություն չունի` });
        }
        const actualRoomId = roomResult.recordset[0].id;
        console.log("✅ Room id found:", actualRoomId);

        // 2. Ավելացնում ենք Subjects աղյուսակում առարկայի տվյալները
        const subjectInsertResult = await pool.request()
            .input('subjectName', sql.NVarChar, subjectName)
            .input('teacherId', sql.Int, teacherId)
            .input('room_id', sql.Int, actualRoomId)
            .query(`
                INSERT INTO Subjects (name, teacher_id, room_id)
                VALUES (@subjectName, @teacherId, @room_id);
                SELECT SCOPE_IDENTITY() AS id;
            `);
        if (!subjectInsertResult.recordset || subjectInsertResult.recordset.length === 0) {
            console.error("❌ Failed to insert subject into Subjects table.");
            return res.status(500).json({ error: "Failed to insert subject into Subjects table" });
        }
        const subjectId = subjectInsertResult.recordset[0].id;
        console.log("✅ Inserted subject id:", subjectId);

        const subjectEditableResult = await pool.request()
            .input('subjectName', sql.NVarChar, subjectName)
            .input('teacherId', sql.Int, teacherId)
            .input('room_id', sql.Int, actualRoomId)
            .query(`
                INSERT INTO subjects_editable (name, teacher_id, room_id)
                VALUES (@subjectName, @teacherId, @room_id);
                SELECT SCOPE_IDENTITY() AS id;
            `);
        const subjectEditableId = subjectEditableResult.recordset[0].id;
        console.log("✅ Inserted subject_editable id:", subjectEditableId);

        // 3. Հաշվում ենք դասի տեսակը՝ ըստ practical և lab արժեքների (դեֆոլտ "Դաս")
        let classTypeName = 'Դաս';
        if (practical) {
            classTypeName = 'Գործնական';
        }
        if (lab) {
            classTypeName = 'Լաբորատոր';
        }

        // 4. Ստանում ենք համապատասխան դասի տեսակի ID-ը Types աղյուսակից
        const typeResult = await pool.request()
            .input('typeName', sql.NVarChar, classTypeName)
            .query('SELECT id FROM Types WHERE name = @typeName');
        if (typeResult.recordset.length === 0) {
            return res.status(400).json({ error: `Դասի տեսակը (${classTypeName}) չի գտնվել` });
        }
        const typeId = typeResult.recordset[0].id;
        console.log("✅ Type ID found:", typeId);

        // 5. Ավելացնում ենք schedule_editable աղյուսակում դասացուցակի տվյալները,
        // օգտագործելով Subjects աղյուսակից ստացած subjectId-ի արժեքը
        const scheduleInsertResult = await pool.request()
            .input('subject_id', sql.Int, subjectId)
            .input('teacher_id', sql.Int, teacherId)
            .input('room_id', sql.Int, actualRoomId)
            .input('type_id', sql.Int, typeId)
            // Համաձայն օրինակ՝ frequency-ի համար, եթե frequency === 'weekly' ապա 1, հակառակ դեպքում 2:
            .input('weekly_id', sql.Int, frequency === 'weekly' ? 1 : 2)
            .query(`
                INSERT INTO schedule_editable 
                (subject_id, teacher_id, room_id, type_id, weekly_id)
                VALUES 
                (@subject_id, @teacher_id, @room_id, @type_id, @weekly_id);
                SELECT SCOPE_IDENTITY() AS id;
            `);
        if (!scheduleInsertResult.recordset || scheduleInsertResult.recordset.length === 0) {
            console.error("❌ Failed to insert schedule into schedule_editable table.");
            return res.status(500).json({ error: "Failed to insert schedule into schedule_editable table" });
        }
        const scheduleEditableId = scheduleInsertResult.recordset[0].id;
        console.log("✅ Inserted schedule id:", scheduleEditableId);

        // 6. Ավելացնում ենք գործնականները և լաբորատորները (եթե կան)
        if (practical) {
            // Ստեղծում ենք գործնականի համար համապատասխան տվյալներ
            const practicalInsertResult = await pool.request()
                .input('subject_id', sql.Int, subjectId)
                .input('teacher_id', sql.Int, teacherId)
                .input('room_id', sql.Int, actualRoomId)
                .input('type_id', sql.Int, typeId)
                .input('weekly_id', sql.Int, frequency === 'weekly' ? 1 : 2)
                .query(`
                    INSERT INTO schedule_editable 
                    (subject_id, teacher_id, room_id, type_id, weekly_id)
                    VALUES 
                    (@subject_id, @teacher_id, @room_id, @type_id, @weekly_id);
                    SELECT SCOPE_IDENTITY() AS id;
                `);
            console.log("✅ Inserted practical schedule id:", practicalInsertResult.recordset[0].id);
        }

        if (lab) {
            // Ստեղծում ենք լաբորատորի համար համապատասխան տվյալներ
            const labInsertResult = await pool.request()
                .input('subject_id', sql.Int, subjectId)
                .input('teacher_id', sql.Int, teacherId)
                .input('room_id', sql.Int, actualRoomId)
                .input('type_id', sql.Int, typeId)
                .input('weekly_id', sql.Int, frequency === 'weekly' ? 1 : 2)
                .query(`
                    INSERT INTO schedule_editable 
                    (subject_id, teacher_id, room_id, type_id, weekly_id)
                    VALUES 
                    (@subject_id, @teacher_id, @room_id, @type_id, @weekly_id);
                    SELECT SCOPE_IDENTITY() AS id;
                `);
            console.log("✅ Inserted lab schedule id:", labInsertResult.recordset[0].id);
        }

        res.json({
            message: "Առարկան և դասացուցակը հաջողությամբ ավելացվեցին",
            subjectId,
            scheduleEditableId
        });
    } catch (err) {
        console.error("❌ Database Insert Error:", err);
        res.status(500).json({ error: "Database error", details: err.message });
    }
});



module.exports = router;
