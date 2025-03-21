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
  const { subjectName, teacherId, roomNumbers, frequency, courseId } = req.body;

  try {
      const pool = await poolPromise;

      // 1️⃣ Ստուգում ենք, արդյո՞ք նշված սենյակը կա `Rooms` աղյուսակում
      const roomCheck = await pool.request()
          .input("roomNumber", sql.NVarChar, roomNumbers)
          .query("SELECT id FROM Rooms WHERE number = @roomNumber");

      if (roomCheck.recordset.length === 0) {
          return res.status(400).json({ error: `❌ Սխալ: Սենյակի համարը "${roomNumbers}" չի գտնվել Rooms աղյուսակում` });
      }

      const roomId = roomCheck.recordset[0].id;

      // 2️⃣ Ավելացնում ենք նոր առարկա `subjects_editable` աղյուսակում
      const subjectInsert = await pool.request()
          .input("subjectName", sql.NVarChar, subjectName)
          .input("teacherId", sql.Int, teacherId)
          .input("roomId", sql.Int, roomId)
          .query(`
              INSERT INTO subjects_editable (name, teacher_id, room_id)
              OUTPUT INSERTED.id
              VALUES (@subjectName, @teacherId, @roomId)
          `);

      const subjectId = subjectInsert.recordset[0].id;

      // 3️⃣ Ավելացնում ենք համապատասխան գրառում `schedule_editable` աղյուսակում
      await pool.request()
          .input("courseId", sql.Int, courseId)
          .input("subjectId", sql.Int, subjectId)
          .input("teacherId", sql.Int, teacherId)
          .input("roomId", sql.Int, roomId)
          .input("weeklyId", sql.Int, frequency === "weekly" ? 1 : 2)
          .query(`
              INSERT INTO schedule_editable (course_id, subject_id, teacher_id, room_id, weekly_id)
              VALUES (@courseId, @subjectId, @teacherId, @roomId, @weeklyId)
          `);

      res.status(201).json({ message: "✅ Առարկան հաջողությամբ ավելացվեց!" });

  } catch (err) {
      console.error("❌ Server error:", err);
      res.status(500).json({ error: "Սերվերի սխալ", details: err.message });
  }
});


module.exports = router;
