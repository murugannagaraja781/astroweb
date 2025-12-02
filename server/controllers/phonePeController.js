const crypto = require("crypto");
const axios = require("axios");

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX;
const BASE_URL = process.env.PHONEPE_BASE_URL || "https://api.phonepe.com/apis/hermes";

exports.initiatePhonePePayment = async (req, res) => {
    try {
        console.log("Initiating PhonePe payment...");
        const { amount, userId, userName, mobileNumber } = req.body;

        if (!MERCHANT_ID || !SALT_KEY || !SALT_INDEX) {
            console.error("PhonePe environment variables missing!");
            return res.status(500).json({
                error: "PhonePe configuration missing",
                details: "Please check PHONEPE_MERCHANT_ID, SALT_KEY, and SALT_INDEX"
            });
        }

        if (!amount || !userId || !mobileNumber) {
            return res.status(400).json({
                error: "Missing required fields",
                required: ["amount", "userId", "mobileNumber"]
            });
        }

        // Generate unique transaction ID
        const merchantTransactionId = "MT" + Date.now() + Math.floor(Math.random() * 1000);

        const payload = {
            merchantId: MERCHANT_ID,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: userId, // Use userId instead of userName
            amount: amount * 100, // Convert to paise
            redirectUrl: `${process.env.CLIENT_URL || "https://astroweb-beryl.vercel.app"}/payment/success`,
            redirectMode: "REDIRECT",
            callbackUrl: `${process.env.VITE_API_URL || "https://astroweb-production.up.railway.app"}/api/payment/phonepe/callback`,
            mobileNumber: mobileNumber.toString(),
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };

        console.log("Payload for PhonePe:", JSON.stringify(payload, null, 2));

        // Convert payload to base64
        const payloadString = JSON.stringify(payload);
        const base64Payload = Buffer.from(payloadString).toString("base64");
        console.log("Base64 Payload:", base64Payload);

        // Generate checksum
        const endpoint = "/pg/v1/pay";
        const toSign = base64Payload + endpoint + SALT_KEY;
        const sha256 = crypto.createHash("sha256").update(toSign).digest("hex");
        const checksum = sha256 + "###" + SALT_INDEX;
        console.log("Generated Checksum:", checksum);

        // Make request to PhonePe
        console.log("Making request to PhonePe API...");
        const response = await axios.post(
            `${BASE_URL}${endpoint}`,
            { request: base64Payload },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": checksum,
                    "X-MERCHANT-ID": MERCHANT_ID,
                    "accept": "application/json"
                },
                timeout: 10000
            }
        );

        console.log("PhonePe API Response:", JSON.stringify(response.data, null, 2));

        // Check if response contains data
        if (response.data && response.data.success) {
            res.status(200).json({
                success: true,
                data: response.data.data,
                redirectUrl: response.data.data.instrumentResponse.redirectInfo.url
            });
        } else {
            throw new Error("Invalid response from PhonePe");
        }

    } catch (err) {
        console.error("PhonePe Payment Error:");
        console.error("Error Message:", err.message);
        console.error("Error Response:", err.response?.data);
        console.error("Error Status:", err.response?.status);

        res.status(err.response?.status || 500).json({
            error: "Payment initiation failed",
            message: err.response?.data?.message || err.message,
            details: err.response?.data
        });
    }
};