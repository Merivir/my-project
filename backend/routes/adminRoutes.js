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

// Middleware для проверки токена
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

router.post('/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('login', sql.NVarChar, login)
            .query('SELECT * FROM admins WHERE login = @login');

        if (result.recordset.length === 0) {
            console.log("Մուտքանունը սխալ է:", login);
            return res.status(401).json({ message: 'Սխալ մուտքանուն կամ գաղտնաբառ' });
        }

        const admin = result.recordset[0];

        console.log("Բերված տվյալներ:", admin);

        // Համեմատում ենք գաղտնաբառը bcrypt-ի միջոցով
        const passwordMatch = await bcrypt.compare(password, admin.password);
        console.log("Համեմատում ենք:", password, "հետ", admin.password, "| Արդյունք:", passwordMatch);

        if (!passwordMatch) {
            console.log("Գաղտնաբառը սխալ է:", password);
            return res.status(401).json({ message: 'Սխալ մուտքանուն կամ գաղտնաբառ' });
        }

        res.json({ message: 'Մուտքը հաջողվեց!' });
    } catch (err) {
        console.error('Մուտքի սխալ:', err.message);
        res.status(500).json({ message: 'Սերվերի սխալ' });
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
    const pool = await sql.connect(/* provide config here or import */);
    let emails = [];

    if (teacherId === "all") {
      const result = await pool.request()
        .query("SELECT email FROM Teachers WHERE email IS NOT NULL");
      emails = result.recordset.map(r => r.email);
    } else {
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


module.exports = router;
