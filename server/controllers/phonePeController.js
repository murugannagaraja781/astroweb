const crypto = require("crypto");
const axios = require("axios");

const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const PHONEPE_SALT_KEY = process.env.PHONEPE_SALT_KEY;
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX;
const PHONEPE_BASE_URL =
    process.env.PHONEPE_BASE_URL || "https://api-preprod.phonepe.com/apis/pg-sandbox";


/**
 * INITIATE PAYMENT
 */
const initiatePhonePePayment = async (req, res) => {
    try {
        const { amount, userId, mobileNumber } = req.body;

        if (!amount || !userId) {
            return res.status(400).json({ error: "amount and userId are required" });
        }

        const amountInPaise = Math.round(amount * 100);

        const merchantTransactionId = `txn_${userId}_${Date.now()}`;

        const redirectUrl = `${process.env.FRONTEND_URL}/payment/status?txnId=${merchantTransactionId}`;
        const callbackUrl = `${process.env.BACKEND_URL}/api/payment/phonepe/callback`;

        const payload = {
            merchantId: PHONEPE_MERCHANT_ID,
            merchantTransactionId,
            merchantUserId: userId,
            amount: amountInPaise,
            redirectUrl,
            callbackUrl,
            mobileNumber: mobileNumber,
            paymentInstrument: {
                type: "PAY_PAGE",
            },
        };

        const base64 = Buffer.from(JSON.stringify(payload)).toString("base64");

        const apiPath = "/pg/v1/pay";
        const stringToSign = base64 + apiPath + PHONEPE_SALT_KEY;

        const sha256 = crypto.createHash("sha256").update(stringToSign).digest("hex");

        const xVerify = `${sha256}###${PHONEPE_SALT_INDEX}`;

        const url = `${PHONEPE_BASE_URL}${apiPath}`;

        const phonePeRes = await axios.post(
            url,
            { request: base64 },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": xVerify,
                    "X-MERCHANT-ID": PHONEPE_MERCHANT_ID,
                },
            }
        );

        const paymentUrl =
            phonePeRes.data?.data?.instrumentResponse?.redirectInfo?.url;

        if (!paymentUrl) {
            return res
                .status(500)
                .json({ error: "Invalid PhonePe response", data: phonePeRes.data });
        }

        return res.json({
            success: true,
            paymentUrl,
            merchantTransactionId,
        });

    } catch (err) {
        console.log("PhonePe Error:", err.response?.data || err.message);
        return res.status(500).json({
            error: "PhonePe Error",
            details: err.response?.data || err.message,
        });
    }
};


/**
 * CALLBACK
 */
const phonePeCallback = async (req, res) => {
    try {
        console.log("PhonePe callback received:", req.body);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.log("PhonePe callback error:", err.message);
        return res.status(500).json({ error: "callback error" });
    }
};


module.exports = {
    initiatePhonePePayment,
    phonePeCallback
};
