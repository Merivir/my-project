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

const bcrypt = require('bcrypt');

router.post('/register', async (req, res) => {
    const { name, login, email, password } = req.body;

    if (!name || !login || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const pool = await poolPromise;

        // Проверка существующего логина
        const existingUser = await pool.request()
            .input('login', sql.NVarChar, login)
            .query('SELECT * FROM admins WHERE login = @login');

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ message: 'Login is already in use' });
        }

        // Хэшируем пароль
        const hashedPassword = await bcrypt.hash(password, 10);

        // Сохраняем администратора
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
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const admin = result.recordset[0];

        // Проверка пароля с использованием bcrypt
        const passwordMatch = await bcrypt.compare(password, admin.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        res.json({ message: 'Login successful' });
    } catch (err) {
        console.error('Login error:', err.message);
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

module.exports = router;
