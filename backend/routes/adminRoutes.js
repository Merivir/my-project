const express = require('express');
const { sql, poolPromise } = require('../models/db');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'your_secret_key'; // Используйте переменные окружения для безопасности

const router = express.Router();

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

// Пример защищённого маршрута
router.get('/protected-route', verifyToken, (req, res) => {
    res.json({ message: 'Welcome to the protected route!', user: req.user });
});

// Регистрация администратора
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required!' });
    }

    try {
        const pool = await poolPromise;
        const existingUser = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM admins WHERE email = @email');

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ message: 'Email is already in use' });
        }

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

// Авторизация администратора
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, password)
            .query(`SELECT * FROM admins WHERE name = @username AND password = @password`);

        if (result.recordset.length > 0) {
            const admin = result.recordset[0];
            const token = jwt.sign({ id: admin.id, name: admin.name }, SECRET_KEY, { expiresIn: '1h' });
            res.json({ message: 'Login successful', token });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

module.exports = router;


router.get('/list', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM admins');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching admins: ' + err.message });
    }
});
