const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Welcome, Guest!' });
});

router.get('/info', (req, res) => {
    res.json({ message: 'This is the guest info endpoint!' });
});

module.exports = router;
