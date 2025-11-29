const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
require('dotenv').config();

const addBalanceToAllClients = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find all client users
        const clients = await User.find({ role: 'client' });
        console.log(`📊 Found ${clients.length} clients`);

        let updated = 0;
        for (const client of clients) {
            const wallet = await Wallet.findOne({ userId: client._id });

            if (wallet) {
                // Add ₹100
                wallet.balance += 100;
                wallet.transactions.push({
                    amount: 100,
                    type: 'credit',
                    description: 'Admin Bonus - ₹100 added to all clients',
                    date: new Date()
                });
                await wallet.save();
                updated++;
                console.log(`✅ Added ₹100 to ${client.name} (${client.email})`);
            }
        }

        console.log(`\n🎉 Successfully added ₹100 to ${updated} clients!`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

addBalanceToAllClients();
