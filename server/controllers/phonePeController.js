const crypto = require('crypto');
const axios = require('axios');

// PhonePe Payment Gateway Configuration
const PHONEPE_MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT';
const PHONEPE_SALT_KEY = process.env.PHONEPE_AUTH_KEY;
const PHONEPE_SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
const PHONEPE_BASE_URL = process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox';

/**
 * Generate PhonePe Payment Request
 */
exports.initiatePhonePePayment = async (req, res) => {
    try {
        const { amount, userId, userName, mobileNumber } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Generate unique transaction ID
        const merchantTransactionId = `TXN_${Date.now()}_${userId}`;
        const merchantUserId = userId || `USER_${Date.now()}`;

        // Payment payload
        const paymentPayload = {
            merchantId: PHONEPE_MERCHANT_ID,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: merchantUserId,
            amount: amount * 100, // Convert to paise
            redirectUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment/callback`,
            redirectMode: 'POST',
            callbackUrl: `${process.env.VITE_API_URL || 'http://localhost:9001'}/api/payment/phonepe/callback`,
            mobileNumber: mobileNumber || '9999999999',
            paymentInstrument: {
                type: 'PAY_PAGE'
            }
        };

        // Encode payload to base64
        const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

        // Generate checksum: base64Payload + "/pg/v1/pay" + saltKey
        const checksumString = base64Payload + '/pg/v1/pay' + PHONEPE_SALT_KEY;
        const checksum = crypto.createHash('sha256').update(checksumString).digest('hex') + '###' + PHONEPE_SALT_INDEX;

        // Make request to PhonePe
        const response = await axios.post(
            `${PHONEPE_BASE_URL}/pg/v1/pay`,
            {
                request: base64Payload
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum
                }
            }
        );

        console.log('✅ PhonePe Payment Initiated:', response.data);

        res.json({
            success: true,
            data: response.data,
            transactionId: merchantTransactionId,
            paymentUrl: response.data?.data?.instrumentResponse?.redirectInfo?.url
        });

    } catch (error) {
        console.error('❌ PhonePe Payment Error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Payment initiation failed',
            details: error.response?.data || error.message
        });
    }
};

/**
 * PhonePe Payment Callback Handler
 */
exports.phonePeCallback = async (req, res) => {
    try {
        console.log('📲 PhonePe Callback Received:', req.body);

        const { transactionId, code, merchantId } = req.body;

        // Verify payment status
        const checksumString = `/pg/v1/status/${merchantId}/${transactionId}` + PHONEPE_SALT_KEY;
        const checksum = crypto.createHash('sha256').update(checksumString).digest('hex') + '###' + PHONEPE_SALT_INDEX;

        const statusResponse = await axios.get(
            `${PHONEPE_BASE_URL}/pg/v1/status/${merchantId}/${transactionId}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum,
                    'X-MERCHANT-ID': merchantId
                }
            }
        );

        console.log('✅ Payment Status:', statusResponse.data);

        // TODO: Update wallet balance in database based on payment status

        res.json({
            success: true,
            status: statusResponse.data
        });

    } catch (error) {
        console.error('❌ PhonePe Callback Error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Callback processing failed',
            details: error.response?.data || error.message
        });
    }
};

/**
 * Test PhonePe Configuration
 */
exports.testPhonePeConfig = async (req, res) => {
    try {
        const config = {
            merchantId: PHONEPE_MERCHANT_ID,
            saltKeyConfigured: !!PHONEPE_SALT_KEY,
            saltIndex: PHONEPE_SALT_INDEX,
            baseUrl: PHONEPE_BASE_URL,
            environment: PHONEPE_BASE_URL.includes('preprod') ? 'Sandbox/UAT' : 'Production'
        };

        res.json({
            success: true,
            message: 'PhonePe configuration loaded successfully',
            config: config
        });
    } catch (error) {
        res.status(500).json({
            error: 'Configuration test failed',
            details: error.message
        });
    }
};
