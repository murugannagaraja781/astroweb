const express = require('express');
const router = express.Router();
const { addMoney, getBalance } = require('../controllers/walletController');
const auth = require('../middleware/auth');

router.post('/add', auth, addMoney);
router.get('/balance', auth, getBalance);

module.exports = router;
