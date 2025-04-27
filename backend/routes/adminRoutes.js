const express = require('express');
const { sql, poolPromise } = require('../models/db');
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_secret_key'; // Используйте переменные окружения для безопасности

const router = express.Router();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "myschedulepolytech@gmail.com",
      pass: "xcshvlnrzqqsugpa"  // 🔐 App password (ոչ սովորական մուտքագրում)
    }
  });

// Middleware for verifying token
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

router.get("/levels", async (req, res) => {
    try {
        console.log("📡 Fetching levels from database...");
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, name FROM Levels");
        const levels = result.recordset;
        
        console.log("Levels fetched:", levels);

        res.json(levels);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Database error while fetching levels" });
    }
});


router.get('/teachers', async (req, res) => {
    console.log("API /api/teachers request received!");
    try {
        const result = await sql.query("SELECT id, name FROM Teachers");
        console.log("Data fetched:", result.recordset);
        res.json(result.recordset);
    } catch (err) {
        console.error("Error fetching teachers:", err);
        res.status(500).json({ error: "Server error" });
    }
});



router.get('/protected-route', verifyToken, (req, res) => {
    res.json({ message: 'Welcome to the protected route!', user: req.user });
});

const bcrypt = require('bcrypt');

router.post('/register', async (req, res) => {
    const { name, login, email, password } = req.body;

    if (!name || !login || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const pool = await poolPromise;

        const existingUser = await pool.request()
            .input('login', sql.NVarChar, login)
            .query('SELECT * FROM admins WHERE login = @login');

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ message: 'Login is already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.request()
            .input('name', sql.NVarChar, name)
            .input('login', sql.NVarChar, login)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .query(`INSERT INTO admins (name, login, email, password)
                    VALUES (@name, @login, @email, @password)`);

        res.status(201).json({ message: 'Admin registered successfully!' });
    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});


router.get('/list', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM admins');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching admins: ' + err.message });
    }
});

router.post('/admin/send-message', async (req, res) => {
  const { teacherId, message } = req.body;

  if (!teacherId || !message) {
    return res.status(400).json({ error: "Լրացրեք բոլոր դաշտերը։" });
  }

  try {
    const pool = await poolPromise;
    let emails = [];

    if (teacherId === "all") {
      const result = await pool.request()
        .query("SELECT email FROM Teachers WHERE email IS NOT NULL");
      emails = result.recordset.map(r => r.email);
    } else {
      console.log("📤 Փնտրում ենք կոնկրետ դասախոսի email՝ ըստ ID:", teacherId);

      const result = await pool.request()
        .input("teacherId", sql.Int, parseInt(teacherId))
        .query("SELECT email FROM Teachers WHERE id = @teacherId AND email IS NOT NULL");
      if (!result.recordset.length) {
        return res.status(404).json({ error: "Դասախոսը չի գտնվել կամ չունի email։" });
      }
      emails = [result.recordset[0].email];
    }

    for (const email of emails) {
      await transporter.sendMail({
        from: '"Admin" <myschedulepolytech@gmail.com>',
        to: email,
        subject: "Նոր հաղորդագրություն",
        text: message,
      });
    }

    res.json({ message: "Հաղորդագրությունը հաջողությամբ ուղարկվեց։" });
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ error: "Սերվերի սխալ։" });
  }
});

// 📍 POST /api/admin/change-password

// ✅ Change password
router.post("/admin/change-password", verifyToken, async (req, res) => {
  const { resetToken, verificationCode, newPassword } = req.body;

  try {
    const login = req.user.login;
    const pool = await poolPromise;

    const userResult = await pool.request()
      .input("login", sql.NVarChar, login)
      .query("SELECT * FROM admins WHERE login = @login");

    const admin = userResult.recordset[0];
    if (!admin) return res.status(404).json({ message: "Ադմինը չի գտնվել։" });

    if (admin.verification_code !== verificationCode) {
      return res.status(400).json({ message: "Սխալ կոդ։" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.request()
      .input("login", sql.NVarChar, login)
      .input("password", sql.NVarChar, hashed)
      .input("code", sql.NVarChar, null)
      .query("UPDATE admins SET password = @password, verification_code = @code WHERE login = @login");

    res.json({ message: "Գաղտնաբառը հաջողությամբ թարմացվել է։" });
  } catch (err) {
    console.error("❌ Error changing admin password:", err);
    res.status(500).json({ message: "Սերվերի սխալ։" });
  }
});

// Admin login
router.post('/admin/login', async (req, res) => {
  const { login, password } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('login', sql.NVarChar, login)
      .query('SELECT * FROM admins WHERE login = @login');

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Սխալ մուտքանուն կամ գաղտնաբառ' });
    }

    const admin = result.recordset[0];
    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Սխալ մուտքանուն կամ գաղտնաբառ' });
    }

    const token = jwt.sign({ login: admin.login }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ message: 'Մուտքը հաջողվեց!', token });
  } catch (err) {
    console.error('Մուտքի սխալ:', err.message);
    res.status(500).json({ message: 'Սերվերի սխալ' });
  }
});

// 🔐 Request password reset code
router.post("/admin/request-reset-code", verifyToken, async (req, res) => {
  try {
    const login = req.user.login;
    const pool = await poolPromise;
    const result = await pool.request()
      .input("login", sql.NVarChar, login)
      .query("SELECT email FROM admins WHERE login = @login");

    const email = result.recordset[0]?.email;
    if (!email) return res.status(404).json({ message: "Մեյլ չի գտնվել։" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.request()
      .input("login", sql.NVarChar, login)
      .input("code", sql.NVarChar, code)
      .query("UPDATE admins SET verification_code = @code WHERE login = @login");

    await transporter.sendMail({
      from: '"Schedule Admin" <myschedulepolytech@gmail.com>',
      to: email,
      subject: "Գաղտնաբառի հաստատման կոդ",
      text: `Ձեր հաստատման կոդն է՝ ${code}`
    });

    res.json({ resetToken: "admin_static_token", message: "Կոդը հաջողությամբ ուղարկվեց։" });
  } catch (err) {
    console.error("❌ Error sending reset code:", err);
    res.status(500).json({ message: "Սերվերի սխալ։" });
  }
});


// scheduleRoutes.js կամ adminRoutes.js մեջ
router.post("/admin/finalize-schedule", async (req, res) => {
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

    res.status(200).json({ message: "Դասացուցակը հաջողությամբ հաստատվել է և տեղափոխվել է Schedule աղյուսակ" });
  } catch (error) {
    console.error("Finalize schedule error:", error);
    res.status(500).json({ error: "Չհաջողվեց ավարտել դասացուցակի տեղափոխումը" });
  }
});

module.exports = router;
