const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Welcome, Guest!' });
});

module.exports = router; // Обязательно экспортируем router
