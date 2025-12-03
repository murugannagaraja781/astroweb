const axios = require('axios');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const jwt = require('jsonwebtoken');

exports.sendOtp = async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber || phoneNumber.length < 10) {
            return res.status(400).json({ msg: 'Please provide a valid phone number' });
        }

        // Clean phone number (remove any spaces, dashes, etc.)
        const cleanPhone = phoneNumber.replace(/\D/g, '');

        // Validate phone number format
        if (cleanPhone.length !== 10) {
            return res.status(400).json({ msg: 'Phone number must be 10 digits' });
        }

        console.log('Sending OTP to:', cleanPhone);
        console.log('Using Template ID:', process.env.MSG91_TEMPLATE_ID);
        console.log('Using Sender ID:', process.env.MSG91_SENDER_ID);

        // MSG91 API v5 - Send OTP with Template ID and Sender ID
        const url = `https://control.msg91.com/api/v5/otp`;
        const params = {
            template_id: process.env.MSG91_TEMPLATE_ID,
            mobile: `91${cleanPhone}`,
            authkey: process.env.MSG91_AUTHKEY,
            sender: process.env.MSG91_SENDER_ID || 'ASTRO9',
            otp_expiry: 5, // OTP expires in 5 minutes
            otp_length: 6 // 6 digit OTP
        };

        const response = await axios.post(url, null, {
            params: params,
            headers: {
                'Content-Type': 'application/json',
                'authkey': process.env.MSG91_AUTHKEY,
            },
        });

        console.log('MSG91 Send OTP Response:', response.data);

        if (response.data.type === 'success') {
            res.json({
                type: 'success',
                message: 'OTP sent successfully',
                phone: cleanPhone
            });
        } else {
            res.status(400).json({
                msg: 'Failed to send OTP',
                details: response.data
            });
        }
    } catch (error) {
        console.error('Error sending OTP:', error.response?.data || error.message);
        res.status(500).json({
            msg: 'Error sending OTP',
            error: error.response?.data?.message || error.message,
            details: error.response?.data
        });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({ msg: 'Phone number and OTP are required' });
        }

        // Clean phone number
        const cleanPhone = phoneNumber.replace(/\D/g, '');

        // MSG91 API v5 - Verify OTP
        const response = await axios.get(
            `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=91${cleanPhone}`,
            {
                headers: {
                    'authkey': process.env.MSG91_AUTHKEY,
                },
            }
        );

        console.log('MSG91 Verify OTP Response:', response.data);

        if (response.data.type === 'success') {
            // OTP verified successfully, now handle user authentication
            let user = await User.findOne({ phone: cleanPhone });

            if (!user) {
                // Create new user with phone number
                user = new User({
                    name: `User_${cleanPhone}`, // Default name, can be updated later
                    email: `${cleanPhone}@phone.user`, // Temporary email
                    phone: cleanPhone,
                    role: 'client'
                });
                await user.save();

                // Create wallet for new user
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
            error: error.response?.data?.message || error.message
        });
    }
};
