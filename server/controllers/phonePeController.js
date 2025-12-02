const crypto = require("crypto");
const axios = require("axios");

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX;
const BASE_URL = process.env.PHONEPE_BASE_URL;

exports.initiatePhonePePayment = async (req, res) => {
    try {
        const { amount, userName, mobileNumber } = req.body;

        if (!MERCHANT_ID || !SALT_KEY || !SALT_INDEX) {
            return res.status(500).json({ error: "PhonePe ENV missing" });
        }

        const payload = {
            merchantId: MERCHANT_ID,
            transactionId: "TXN" + Date.now(),
            amount: amount * 100,
            merchantUserId: userName,
            mobileNumber,
            redirectUrl: "https://astroweb-beryl.vercel.app/payment/success",
            callbackUrl: "https://astroweb-production.up.railway.app/api/payment/phonepe/callback",
        };

        const payloadString = JSON.stringify(payload);
        const base64Payload = Buffer.from(payloadString).toString("base64");

        const toSign = base64Payload + "/pg/v1/pay" + SALT_KEY;
        const sha256 = crypto.createHash("sha256").update(toSign).digest("hex");

        const checksum = sha256 + "###" + SALT_INDEX;

        const response = await axios.post(
            `${BASE_URL}/pg/v1/pay`,
            { request: base64Payload },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": checksum,
                    "X-MERCHANT-ID": MERCHANT_ID,
                },
            }
        );

        res.json(response.data);

    } catch (err) {
        console.error("PhonePe Error", err.response?.data || err.message);
        res.status(500).json({ error: "Payment Failed" });
    }
};
