exports.verifyOtp = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        if (!phoneNumber || !otp) {
            return res.status(400).json({ msg: 'Phone number and OTP are required' });
        }

        const cleanPhone = phoneNumber.replace(/\D/g, '');

        // VERIFY OTP
        const response = await axios.get(
            `https://api.msg91.com/api/v5/otp/verify?mobile=91${cleanPhone}&otp=${otp}`,
            {
                headers: {
                    authkey: process.env.MSG91_AUTHKEY,
                }
            }
        );

        console.log('MSG91 Verify OTP Response:', response.data);

        if (response.data.type !== 'success') {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

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

    } catch (error) {
        console.error('Error verifying OTP:', error.response?.data || error.message);
        return res.status(500).json({
            msg: 'Server Error While Verifying OTP',
            details: error.response?.data || error.message,
        });
    }
};
