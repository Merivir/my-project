const express = require("express");
const router = express.Router();
const { sql, poolPromise } = require("../models/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const verifyTeacherToken = require("../middleware/verifyTeacherToken");

const SECRET_KEY = "teacher_secret_key_2024";

// ✅ Մուտք
router.post("/login", async (req, res) => {
  const { login, password } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("login", sql.NVarChar, login)
      .query("SELECT * FROM Teachers WHERE login = @login");

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Սխալ մուտքանուն կամ գաղտնաբառ" });
    }

    const teacher = result.recordset[0];
    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Սխալ մուտքանուն կամ գաղտնաբառ" });
    }

    const token = jwt.sign({ id: teacher.id }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ message: "Մուտքը հաջողվեց", token });
  } catch (error) {
    console.error("Teacher login error:", error);
    res.status(500).json({ message: "Սերվերի սխալ" });
  }
});

// ✅ Անունը բեռնելու ռաութ
router.get("/profile", verifyTeacherToken, async (req, res) => {
  try {
    const teacherId = req.user.id;
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, teacherId)
      .query("SELECT name FROM Teachers WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Ուսուցիչը չի գտնվել" });
    }

    res.json({ fullName: result.recordset[0].name });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Սերվերի սխալ" });
  }
});

// ✅ Ուսուցչի դասացուցակի բեռնում
router.get('/schedule', verifyTeacherToken, async (req, res) => {
  try {
    const teacherId = req.user.id;
    console.log("➡️ Բերում ենք դասացուցակ teacherId-ով:", teacherId);

    const pool = await poolPromise;
    const result = await pool.request()
      .input('teacher_id', sql.Int, teacherId)
      .query(`
        SELECT 
          d.name AS day_name,
          ts.slot AS time_slot,
          sub.name AS subject_name,
          t.name AS teacher_name,
          w.type AS week_type
        FROM Schedule s
        JOIN Days d ON s.day_id = d.id
        JOIN TimeSlots ts ON s.time_slot_id = ts.id
        JOIN Subjects sub ON s.subject_id = sub.id
        JOIN Teachers t ON s.teacher_id = t.id
        JOIN Weeks w ON s.week_id = w.id
        WHERE t.id = @teacher_id
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error fetching teacher schedule:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// Endpoint՝ գաղտնաբառի փոփոխման համար
router.post('/change-password', verifyTeacherToken, async (req, res) => {
  const { verificationCode, newPassword } = req.body;
  const teacherId = req.user.id;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input("id", sql.Int, teacherId)
      .query("SELECT verification_code FROM Teachers WHERE id = @id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Ուսուցիչը չհայտնվեց" });
    }
    const teacher = result.recordset[0];
    if (teacher.verification_code !== verificationCode) {
      return res.status(400).json({ message: "Սխալ հաստատման կոդ" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.request()
      .input("id", sql.Int, teacherId)
      .input("password", sql.NVarChar, hashedPassword)
      .query("UPDATE Teachers SET password = @password WHERE id = @id");

    res.json({ message: "Գաղտնաբառը հաջողությամբ փոխվեց" });
  } catch (error) {
    console.error("Error in change-password:", error);
    res.status(500).json({ message: "Սերվերի սխալ" });
  }
});

// Endpoint՝ ուսուցիչի անձնական տվյալների համար
router.get('/profile', verifyTeacherToken, async (req, res) => {
  try {
    console.log("Decoded teacher id:", req.user.id);
    const teacherId = req.user.id;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, teacherId)
      .query("SELECT id, name FROM Teachers WHERE id = @id");

    console.log("Profile query result:", result.recordset);
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Ուսուցիչը չի գտնվել" });
    }
    res.json({ id: result.recordset[0].id, fullName: result.recordset[0].name });
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    res.status(500).json({ message: "Սերվերի սխալ" });
  }
});


router.post('/schedule/save-availability', verifyTeacherToken, async (req, res) => {
  const teacherId = req.user.id;
  const { primary_slots, backup_slots } = req.body;

  if (!Array.isArray(primary_slots) || !Array.isArray(backup_slots)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const pool = await poolPromise;

  // Ջնջում ենք հինը
  await pool.request().input('teacher_id', sql.Int, teacherId)
    .query('DELETE FROM PrimaryAvailability WHERE teacher_id = @teacher_id; DELETE FROM BackupAvailability WHERE teacher_id = @teacher_id;');

  // Պահպանում ենք նորը
  for (const slot of primary_slots) {
    const [day_id, time_slot_id] = slot.split("-").map(Number);
    await pool.request()
      .input('teacher_id', sql.Int, teacherId)
      .input('day_id', sql.Int, day_id)
      .input('time_slot_id', sql.Int, time_slot_id)
      .query('INSERT INTO PrimaryAvailability (teacher_id, day_id, time_slot_id) VALUES (@teacher_id, @day_id, @time_slot_id)');
  }

  for (const slot of backup_slots) {
    const [day_id, time_slot_id] = slot.split("-").map(Number);
    await pool.request()
      .input('teacher_id', sql.Int, teacherId)
      .input('day_id', sql.Int, day_id)
      .input('time_slot_id', sql.Int, time_slot_id)
      .query('INSERT INTO BackupAvailability (teacher_id, day_id, time_slot_id) VALUES (@teacher_id, @day_id, @time_slot_id)');
  }

  res.json({ success: true });
});

// Վերադարձնում է դասախոսի արդեն նշված ժամերը
router.get('/availability', verifyTeacherToken, async (req, res) => {
  const teacherId = req.user.id;

  try {
    const pool = await poolPromise;

    const primaryResult = await pool.request()
      .input("teacher_id", sql.Int, teacherId)
      .query("SELECT day_id, time_slot_id FROM PrimaryAvailability WHERE teacher_id = @teacher_id");

    const backupResult = await pool.request()
      .input("teacher_id", sql.Int, teacherId)
      .query("SELECT day_id, time_slot_id FROM BackupAvailability WHERE teacher_id = @teacher_id");

      res.json({
        primary: primaryResult.recordset.map(r => `${r.day_id}-${r.time_slot_id}`),
        backup: backupResult.recordset.map(r => `${r.day_id}-${r.time_slot_id}`)
      });
      
  } catch (err) {
    console.error("❌ Fetch availability error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
