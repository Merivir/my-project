// 📁 routes/resetPasswordRoutes.js

const express = require('express');
const { sql, poolPromise } = require('../models/db');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const router = express.Router();

const SECRET_KEY = 'your_secret_key';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'myschedulepolytech@gmail.com',
    pass: 'xcshvlnrzqqsugpa'
  }
});

// 📩 Սկզբից ուղարկում ենք հաստատման կոդը ըստ մուտքանունի (login)
router.post('/request-reset-code', async (req, res) => {
  const { login, role } = req.body;
  if (!login || !role) return res.status(400).json({ message: 'Բոլոր դաշտերը պարտադիր են։' });

  const table = role === 'admin' ? 'admins' : 'teachers';

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('login', sql.NVarChar, login)
      .query(`SELECT email FROM ${table} WHERE login = @login`);

    const email = result.recordset[0]?.email;
    if (!email) return res.status(404).json({ message: 'Հաշիվը կամ էլ․ հասցեն չի գտնվել։' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.request()
      .input('login', sql.NVarChar, login)
      .input('code', sql.NVarChar, code)
      .query(`UPDATE ${table} SET verification_code = @code WHERE login = @login`);

    await transporter.sendMail({
      from: 'myschedulepolytech@gmail.com',
      to: email,
      subject: 'Գաղտնաբառի վերականգնում',
      text: `Ձեր հաստատման կոդն է՝ ${code}`
    });

    res.json({ message: 'Հաստատման կոդը ուղարկված է։' });
  } catch (err) {
    console.error('❌ Error sending reset code:', err);
    res.status(500).json({ message: 'Սերվերի սխալ։' });
  }
});

// 🔁 Հաստատման կոդի ստուգում և գաղտնաբառի թարմացում
router.post('/reset-password', async (req, res) => {
  const { login, role, code, newPassword } = req.body;
  if (!login || !role || !code || !newPassword) {
    return res.status(400).json({ message: 'Բոլոր դաշտերը պարտադիր են։' });
  }

  const table = role === 'admin' ? 'admins' : 'teachers';

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('login', sql.NVarChar, login)
      .query(`SELECT verification_code FROM ${table} WHERE login = @login`);

    const dbCode = result.recordset[0]?.verification_code;
    if (dbCode !== code) return res.status(400).json({ message: 'Սխալ կոդ։' });

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.request()
      .input('login', sql.NVarChar, login)
      .input('password', sql.NVarChar, hashed)
      .input('code', sql.NVarChar, null)
      .query(`UPDATE ${table} SET password = @password, verification_code = @code WHERE login = @login`);

    res.json({ message: 'Գաղտնաբառը թարմացված է։' });
  } catch (err) {
    console.error('❌ Error resetting password:', err);
    res.status(500).json({ message: 'Սերվերի սխալ։' });
  }
});

module.exports = router;
