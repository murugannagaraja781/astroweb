const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');

// router.post('/register', register);
// router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/profile/update', auth, updateProfile);
router.post('/logout', logout);

module.exports = router;
