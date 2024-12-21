const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Welcome, Guest!' });
});

// Новый маршрут для информации о гостях
router.get('/info', (req, res) => {
    res.json({ message: 'This is the guest info endpoint!' });
});

module.exports = router;
