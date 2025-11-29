require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        // Create a new user (you can adjust the fields as needed)
        const newUser = new User({
            name: 'NewUser',
            email: `newuser${Date.now()}@example.com`,
            password: 'tempPassword', // you may want to hash in real flow
            role: 'client'
        });
        await newUser.save();
        console.log('Created user:', newUser._id);

        // Create a wallet with 100000 balance
        const wallet = new Wallet({
            userId: newUser._id,
            balance: 100000,
            currency: 'INR'
        });
        await wallet.save();
        console.log('Created wallet with balance 100000 for user');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
}

run();
