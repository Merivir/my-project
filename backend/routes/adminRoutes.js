const express = require('express');
const { sql, poolPromise } = require('../models/db'); // Подключение БД
const router = express.Router();

// Регистрация администратора
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Проверка на заполненность полей
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required!' });
    }

    try {
        const pool = await poolPromise; // Используем poolPromise
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query(`INSERT INTO admins (name, email, password)
                    OUTPUT INSERTED.* VALUES (@name, @email, @password)`);

        res.status(201).json({ 
            message: 'Admin registered successfully!', 
            admin: result.recordset[0] 
        });
    } catch (err) {
        console.error('Database error:', err.message);
        res.status(500).json({ error: 'Failed to register admin: ' + err.message });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, password)
            .query(`SELECT * FROM admins WHERE name = @username AND password = @password`);

        if (result.recordset.length > 0) {
            res.json({ message: 'Success' });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

module.exports = router;
