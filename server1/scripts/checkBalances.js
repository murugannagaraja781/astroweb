const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
require('dotenv').config();

const checkBalances = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const users = await User.find({ role: 'client' });
        console.log(`Found ${users.length} clients.`);

        for (const user of users) {
            const wallet = await Wallet.findOne({ userId: user._id });
            if (wallet) {
                console.log(`User: ${user.name} (${user.email}) - Balance: ₹${wallet.balance}`);
                if (wallet.balance < 1) {
                    console.warn(`⚠️ LOW BALANCE: ${user.name}`);
                }
            } else {
                console.error(`❌ NO WALLET: ${user.name} (${user._id})`);
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkBalances();
