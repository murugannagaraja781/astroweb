const express = require("express");
const router = express.Router();

const {
    initiatePhonePePayment,
    phonePeCallback
} = require("../controllers/phonePeController");

// NEVER PUT () after function name
router.post("/initiate", initiatePhonePePayment);
router.post("/callback", phonePeCallback);

module.exports = router;
