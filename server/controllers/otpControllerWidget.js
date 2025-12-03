const axios = require('axios');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const jwt = require('jsonwebtoken');

/**
 * Alternative OTP Implementation using MSG91 Widget/Flow API
 * This uses a different MSG91 endpoint that may work better
 */

exports.sendOtpWidget = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber || phoneNumber.length < 10) {
            return res.status(400).json({ msg: 'Please provide a valid phone number' });
        }

        // Clean phone number
        const cleanPhone = phoneNumber.replace(/\D/g, '');

        if (cleanPhone.length !== 10) {
            return res.status(400).json({ msg: 'Phone number must be 10 digits' });
        }

        console.log('Sending OTP (Widget API) to:', cleanPhone);

        // MSG91 Flow/Widget API - Alternative method
        const url = 'https://api.msg91.com/api/v5/otp';

        const requestData = {
            template_id: process.env.MSG91_TEMPLATE_ID || '1407172294566795685',
            mobile: cleanPhone,
            authkey: process.env.MSG91_AUTHKEY,
            otp_expiry: 5,
            otp_length: 6,
            sender: process.env.MSG91_SENDER_ID || 'ASTRO9'
        };

        console.log('Request Data:', {
            ...requestData,
            authkey: requestData.authkey ? requestData.authkey.substring(0, 10) + '...' : 'MISSING',
            mobile: `91${cleanPhone}`
        });

        const response = await axios.post(url, requestData, {
            headers: {
                'Content-Type': 'application/json',
                'authkey': process.env.MSG91_AUTHKEY
            }
        });

        console.log('MSG91 Widget Response:', response.data);

        if (response.data.type === 'success' || response.status === 200) {
            res.json({
                type: 'success',
                message: 'OTP sent successfully',
                phone: cleanPhone,
                details: response.data
            });
        } else {
            res.status(400).json({
                msg: 'Failed to send OTP',
                details: response.data
            });
        }
    } catch (error) {
        console.error('Error sending OTP (Widget):', error.response?.data || error.message);
        res.status(500).json({
            msg: 'Error sending OTP',
            error: error.response?.data?.message || error.message,
            details: error.response?.data
        });
    }
};

exports.sendOtpDirect = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber || phoneNumber.length < 10) {
            return res.status(400).json({ msg: 'Please provide a valid phone number' });
        }

        const cleanPhone = phoneNumber.replace(/\D/g, '');

        if (cleanPhone.length !== 10) {
            return res.status(400).json({ msg: 'Phone number must be 10 digits' });
        }

        console.log('Sending OTP (Direct SMS) to:', cleanPhone);

        // Direct SMS API - Fallback method
        const url = 'https://api.msg91.com/api/sendotp.php';

        const params = {
            authkey: process.env.MSG91_AUTHKEY,
            mobile: cleanPhone,
            sender: process.env.MSG91_SENDER_ID || 'ASTRO9',
            message: `Your OTP for Astro5star login is ##OTP##. Valid for 5 minutes.`,
            otp_length: 6,
            otp_expiry: 5
        };

        const response = await axios.get(url, { params });

        console.log('MSG91 Direct SMS Response:', response.data);

        if (response.data.type === 'success' || response.status === 200) {
            res.json({
                type: 'success',
                message: 'OTP sent successfully',
                phone: cleanPhone,
                details: response.data
            });
        } else {
            res.status(400).json({
                msg: 'Failed to send OTP',
                details: response.data
            });
        }
    } catch (error) {
        console.error('Error sending OTP (Direct):', error.response?.data || error.message);
        res.status(500).json({
            msg: 'Error sending OTP',
            error: error.response?.data?.message || error.message,
            details: error.response?.data
        });
    }
};

exports.verifyOtpWidget = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({ msg: 'Phone number and OTP are required' });
        }

        const cleanPhone = phoneNumber.replace(/\D/g, '');

        console.log('Verifying OTP for:', cleanPhone);

        // MSG91 Verify API
        const url = `https://api.msg91.com/api/v5/otp/verify`;

        const params = {
            authkey: process.env.MSG91_AUTHKEY,
            mobile: cleanPhone,
            otp: otp
        };

        const response = await axios.get(url, { params });

        console.log('MSG91 Verify Response:', response.data);

        if (response.data.type === 'success' || response.status === 200) {
            // OTP verified successfully
            let user = await User.findOne({ phone: cleanPhone });

            if (!user) {
                user = new User({
                    name: `User_${cleanPhone}`,
                    email: `${cleanPhone}@phone.user`,
                    phone: cleanPhone,
                    role: 'client'
                });
                await user.save();

                const wallet = new Wallet({ userId: user._id });
                await wallet.save();

                console.log('New user created via OTP:', user._id);
            }

            // Generate JWT token
            const payload = { user: { id: user._id, role: user.role } };
            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '7d' },
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        type: 'success',
                        token,
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.email,
                            phone: user.phone,
                            role: user.role
                        }
                    });
                }
            );
        } else {
            res.status(400).json({ msg: 'Invalid OTP', details: response.data });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error.response?.data || error.message);
        res.status(500).json({
            msg: 'Error verifying OTP',
            error: error.response?.data?.message || error.message,
            details: error.response?.data
        });
    }
};

exports.resendOtp = async (req, res) => {
    try {
        const { phoneNumber, retryType } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({ msg: 'Phone number is required' });
        }

        const cleanPhone = phoneNumber.replace(/\D/g, '');

        console.log('Resending OTP to:', cleanPhone, 'Type:', retryType || 'text');

        // MSG91 Retry/Resend API
        const url = 'https://api.msg91.com/api/v5/otp/retry';

        const params = {
            authkey: process.env.MSG91_AUTHKEY,
            mobile: cleanPhone,
            retrytype: retryType || 'text' // 'text' or 'voice'
        };

        const response = await axios.post(url, null, { params });

        console.log('MSG91 Resend Response:', response.data);

        if (response.data.type === 'success' || response.status === 200) {
            res.json({
                type: 'success',
                message: 'OTP resent successfully',
                phone: cleanPhone,
                details: response.data
            });
        } else {
            res.status(400).json({
                msg: 'Failed to resend OTP',
                details: response.data
            });
        }
    } catch (error) {
        console.error('Error resending OTP:', error.response?.data || error.message);
        res.status(500).json({
            msg: 'Error resending OTP',
            error: error.response?.data?.message || error.message,
            details: error.response?.data
        });
    }
};
