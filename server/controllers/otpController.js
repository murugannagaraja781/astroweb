const https = require('https');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const jwt = require('jsonwebtoken');

exports.sendOtp = (req, res) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber || phoneNumber.length !== 10) {
        return res.status(400).json({ msg: 'Invalid phone number' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const mobile = `91${cleanPhone}`;
    const authKey = '478312AgHesvjV691c86b3P1';
    const templateId = '69247b237ae90826a21c51fa';

    const options = {
        method: 'POST',
        hostname: 'control.msg91.com',
        port: null,
        path: `/api/v5/otp?otp_expiry=5&template_id=${templateId}&mobile=${mobile}&authkey=${authKey}&realTimeResponse=1`,
        headers: {
            'content-type': 'application/json',
            'Content-Type': 'application/JSON'
        }
    };

    const reqHttps = https.request(options, function (response) {
        const chunks = [];

        response.on('data', function (chunk) {
            chunks.push(chunk);
        });

        response.on('end', function () {
            const body = Buffer.concat(chunks).toString();
            console.log('MSG91 Response:', body);

            try {
                const json = JSON.parse(body);
                if (json.type === 'success') {
                    return res.json({
                        type: 'success',
                        message: 'OTP sent successfully',
                        details: json
                    });
                } else {
                    return res.status(400).json({
                        type: 'error',
                        msg: 'Failed to send OTP',
                        details: json
                    });
                }
            } catch (error) {
                return res.status(500).json({
                    msg: 'Error parsing MSG91 response',
                    raw: body
                });
            }
        });
    });

    reqHttps.on('error', (e) => {
        console.error('Error sending OTP:', e);
        return res.status(500).json({
            msg: 'Server Error While Sending OTP',
            error: e.message
        });
    });

    reqHttps.write('{}');
    reqHttps.end();
};
