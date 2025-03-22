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

router.post("/subjects/add-subject", async (req, res) => {
  const {
    subjectName,
    teacherId,
    roomNumbers,
    frequency,
    courseCode,  // ✅ ստանում ենք code, ոչ թե id
    levelId,
    practicals,
    labs
  } = req.body;

  console.log("🎯 Received subject creation data:", {
    subjectName,
    teacherId,
    roomNumbers,
    frequency,
    courseCode,
    levelId,
    practicals,
    labs
  });

  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1️⃣ Վերցնում ենք սենյակի id
    const lectRoomRes = await transaction.request()
      .input("roomNumber", sql.NVarChar, roomNumbers)
      .query("SELECT id FROM Rooms WHERE number = @roomNumber");

    if (!lectRoomRes.recordset.length)
      return res.status(400).json({ error: `Սենյակ "${roomNumbers}" չի գտնվել Rooms-ում` });

    const lectRoomId = lectRoomRes.recordset[0].id;

    // 2️⃣ Վերցնում ենք իրական կուրսի ID-ն ըստ կուրսի code-ի
    const courseRes = await transaction.request()
      .input("code", sql.NVarChar, courseCode)
      .query("SELECT id FROM Courses WHERE code = @code");

    if (!courseRes.recordset.length) {
      return res.status(400).json({ error: `❌ Կուրսի կոդ '${courseCode}' չի գտնվել Courses աղյուսակում` });
    }

    const realCourseId = courseRes.recordset[0].id;

    // 3️⃣ Ավելացնում ենք առարկան
    const subjectInsert = await transaction.request()
      .input("subjectName", sql.NVarChar, subjectName)
      .input("teacherId", sql.Int, teacherId)
      .input("roomId", sql.Int, lectRoomId)
      .query(`
        INSERT INTO subjects_editable (name, teacher_id, room_id)
        OUTPUT INSERTED.id
        VALUES (@subjectName, @teacherId, @roomId)
      `);

    const subjectId = subjectInsert.recordset[0].id;

    // 4️⃣ Լեկցիա
    await transaction.request()
      .input("levelId", sql.Int, levelId)
      .input("courseId", sql.Int, realCourseId)
      .input("subjectId", sql.Int, subjectId)
      .input("typeId", sql.Int, 7)
      .input("teacherId", sql.Int, teacherId)
      .input("roomId", sql.Int, lectRoomId)
      .input("weeklyId", sql.Int, frequency === "weekly" ? 1 : 2)
      .input("details", sql.NVarChar, frequency)
      .query(`
        INSERT INTO schedule_editable 
        (level_id, course_id, subject_id, type_id, teacher_id, room_id, weekly_id, details)
        VALUES 
        (@levelId, @courseId, @subjectId, @typeId, @teacherId, @roomId, @weeklyId, @details)
      `);

    // 5️⃣ Գործնական
    if (Array.isArray(practicals)) {
      for (let i = 0; i < practicals.length; i++) {
        const { teacherId: ptId, roomNumber, frequency: freq } = practicals[i];
        const roomRes = await transaction.request()
          .input("roomNumber", sql.NVarChar, roomNumber)
          .query("SELECT id FROM Rooms WHERE number = @roomNumber");

        if (!roomRes.recordset.length)
          throw new Error(`Գործնականի սենյակ "${roomNumber}" չի գտնվել`);

        const roomId = roomRes.recordset[0].id;

        await transaction.request()
          .input("levelId", sql.Int, levelId)
          .input("courseId", sql.Int, realCourseId)
          .input("subjectId", sql.Int, subjectId)
          .input("typeId", sql.Int, 1 + i)
          .input("teacherId", sql.Int, ptId)
          .input("roomId", sql.Int, roomId)
          .input("weeklyId", sql.Int, freq === "weekly" ? 1 : 2)
          .input("details", sql.NVarChar, freq)
          .query(`
            INSERT INTO schedule_editable 
            (level_id, course_id, subject_id, type_id, teacher_id, room_id, weekly_id, details)
            VALUES 
            (@levelId, @courseId, @subjectId, @typeId, @teacherId, @roomId, @weeklyId, @details)
          `);
      }
    }

    // 6️⃣ Լաբորատոր
    if (Array.isArray(labs)) {
      for (let i = 0; i < labs.length; i++) {
        const { teacherId: ltId, roomNumber, frequency: freq } = labs[i];
        const roomRes = await transaction.request()
          .input("roomNumber", sql.NVarChar, roomNumber)
          .query("SELECT id FROM Rooms WHERE number = @roomNumber");

        if (!roomRes.recordset.length)
          throw new Error(`Լաբորատոր սենյակ "${roomNumber}" չի գտնվել`);

        const roomId = roomRes.recordset[0].id;

        await transaction.request()
          .input("levelId", sql.Int, levelId)
          .input("courseId", sql.Int, realCourseId)
          .input("subjectId", sql.Int, subjectId)
          .input("typeId", sql.Int, 8 + i)
          .input("teacherId", sql.Int, ltId)
          .input("roomId", sql.Int, roomId)
          .input("weeklyId", sql.Int, freq === "weekly" ? 1 : 2)
          .input("details", sql.NVarChar, freq)
          .query(`
            INSERT INTO schedule_editable 
            (level_id, course_id, subject_id, type_id, teacher_id, room_id, weekly_id, details)
            VALUES 
            (@levelId, @courseId, @subjectId, @typeId, @teacherId, @roomId, @weeklyId, @details)
          `);
      }
    }

    await transaction.commit();
    res.status(201).json({ message: "✅ Առարկան՝ իր բոլոր բաղադրիչներով հաջողությամբ ավելացվեց!" });

  } catch (err) {
    console.error("❌ Error in subject creation:", err);
    await transaction.rollback();
    res.status(500).json({ error: "❌ Սերվերի սխալ", details: err.message });
  }
});


module.exports = router;
