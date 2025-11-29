const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
require('dotenv').config();

const fixMissingWallets = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const users = await User.find({ role: 'client' });
        console.log(`Found ${users.length} clients.`);

        let fixedCount = 0;

        for (const user of users) {
            let wallet = await Wallet.findOne({ userId: user._id });

            if (!wallet) {
                console.log(`Creating wallet for: ${user.name} (${user._id})`);

                wallet = new Wallet({
                    userId: user._id,
                    balance: 100 // Default bonus
                });
                await wallet.save();

                const transaction = new Transaction({
                    walletId: wallet._id,
                    amount: 100,
                    type: 'credit',
                    description: 'Welcome Bonus (Fix)'
                });
                await transaction.save();

                fixedCount++;
            }
        }

        console.log(`Fixed ${fixedCount} missing wallets.`);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixMissingWallets();
