const express = require('express');
const { sql, poolPromise } = require('../models/db');
const router = express.Router();

// Регистрация администратора
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .query('INSERT INTO admins (name, email, password) OUTPUT INSERTED.* VALUES (@name, @email, @password)');
        
        res.status(201).json({ message: 'Admin registered successfully!', admin: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
