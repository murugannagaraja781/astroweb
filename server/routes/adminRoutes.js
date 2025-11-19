const express = require('express');
const router = express.Router();
const { addAstrologer, removeAstrologer, getAllAstrologers } = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const adminCheck = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Admin only.' });
  }
  next();
};

router.post('/astrologer', auth, adminCheck, addAstrologer);
router.delete('/astrologer/:id', auth, adminCheck, removeAstrologer);
router.get('/astrologers', auth, getAllAstrologers);

module.exports = router;
