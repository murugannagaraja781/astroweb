const https = require('https');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const jwt = require('jsonwebtoken');

exports.verifyOtp = (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(400).json({ msg: 'Phone number and OTP are required' });
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const authKey = '478312AgHesvjV691c86b3P1';

    const options = {
        method: 'GET',
        hostname: 'control.msg91.com',
        port: null,
        path: `/api/v5/otp/verify?otp=${otp}&mobile=91${cleanPhone}`,
        headers: {
            authkey: authKey
        }
    };

    const reqHttps = https.request(options, function (response) {
        const chunks = [];

        response.on('data', function (chunk) {
            chunks.push(chunk);
        });

        response.on('end', async function () {
            const body = Buffer.concat(chunks).toString();
            console.log('MSG91 Verify Response:', body);

            try {
                const json = JSON.parse(body);

                if (json.type === 'success') {
                    // OTP Verified — Login or Create User
                    let user = await User.findOne({ phone: cleanPhone });

                    if (!user) {
                        user = new User({
                            name: `User_${cleanPhone}`,
                            email: `${cleanPhone}@otp.user`,
                            phone: cleanPhone,
                            role: 'client'
                        });
                        await user.save();

                        const wallet = new Wallet({ userId: user._id });
                        await wallet.save();
                    }

                    const payload = { user: { id: user._id, role: user.role } };

                    jwt.sign(
                        payload,
                        process.env.JWT_SECRET,
                        { expiresIn: '7d' },
                        (err, token) => {
                            if (err) {
                                console.error('JWT Signing Error:', err);
                                return res.status(500).json({ msg: 'Error generating token' });
                            }

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
                    return res.status(400).json({ msg: 'Invalid OTP', details: json });
                }
            } catch (error) {
                console.error('Error processing verification:', error);
                return res.status(500).json({
                    msg: 'Server Error While Verifying OTP',
                    error: error.message
                });
            }
        });
    });

    reqHttps.on('error', (e) => {
        console.error('Error verifying OTP:', e);
        return res.status(500).json({
            msg: 'Server Error While Verifying OTP',
            error: e.message
        });
    });

    reqHttps.end();
};
