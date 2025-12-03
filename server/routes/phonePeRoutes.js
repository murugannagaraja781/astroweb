 const express = require("express");
const router = express.Router();
const { initiatePhonePePayment } = require("../controllers/phonePeController");

// PhonePe payment routes
router.post("/initiate", initiatePhonePePayment);

// Add callback route for PhonePe webhook
router.post("/callback", async (req, res) => {
    try {
        console.log("PhonePe Callback Received:", req.body);
        // Handle payment callback here
        // Verify checksum and update payment status in database
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Callback Error:", error);
        res.status(500).json({ error: "Callback processing failed" });
    }
});

// Add status check endpoint
router.post("/status/:transactionId", async (req, res) => {
    try {
        const { transactionId } = req.params;
        // Check payment status from PhonePe
        res.status(200).json({ 
            status: "pending", 
            transactionId 
        });
    } catch (error) {
        console.error("Status Check Error:", error);
        res.status(500).json({ error: "Status check failed" });
    }
});

module.exports = router;