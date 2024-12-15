const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Schedule route is working!' });
});

module.exports = router; // <-- Это тоже обязательно!
