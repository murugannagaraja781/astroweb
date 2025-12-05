const axios = require('axios');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const jwt = require('jsonwebtoken');

exports.sendOtp = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber || phoneNumber.length !== 10) {
            return res.status(400).json({ msg: 'Invalid phone number' });
        }

        const cleanPhone = phoneNumber.replace(/\D/g, '');

        console.log('Sending OTP to:', cleanPhone);

        // MSG91 OTP API (NO TEMPLATE ID USED)
        const response = await axios.post(
            `https://api.msg91.com/api/v5/otp`,
            {
                mobile: `91${cleanPhone}`,
                otp_length: 6,
                otp_expiry: 5
            },
            {
                headers: {
                    authkey: process.env.MSG91_AUTHKEY || '69247b237ae90826a21c51fa',
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log('MSG91 OTP Send Response:', response.data);

        if (response.data.type === 'success') {
            return res.json({
                type: 'success',
                message: 'OTP sent successfully',
            });
        }

        return res.status(400).json({
            type: 'error',
            msg: 'Failed to send OTP',
            details: response.data
        });

    } catch (error) {
        console.error('Error sending OTP:', error.response?.data || error.message);
        return res.status(500).json({
            msg: 'Server Error While Sending OTP',
            details: error.response?.data || error.message,
        });
    }
};
