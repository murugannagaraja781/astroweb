const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const createSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'admin@gmail.com';
        const password = 'Admin@2026';
        const name = 'Super Admin';

        let user = await User.findOne({ email });
        if (user) {
            console.log('Super Admin already exists');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'admin'
        });

        await user.save();
        console.log('Super Admin created successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createSuperAdmin();
