const express = require("express");
const router = express.Router();

const { initiatePhonePePayment } = require("../controllers/phonePeController");

// FINAL FIXED ROUTE
router.post("/initiate", initiatePhonePePayment);

module.exports = router;
