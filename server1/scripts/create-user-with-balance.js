const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

async function createUserWithBalance() {
    console.log('\n👤 CREATING NEW USER WITH ₹2000 BALANCE\n');
    console.log('='.repeat(60));

    try {
        // 1. Connect to Database
        console.log('📊 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected');

        const User = require('../models/User');
        const Wallet = require('../models/Wallet');

        // 2. Create New User
        const timestamp = Date.now();
        const userData = {
            name: `Premium User ${timestamp.toString().slice(-4)}`,
            email: `premium_${timestamp}@example.com`,
            password: 'password123',
            mobile: `98${timestamp.toString().slice(-8)}`,
            role: 'client'
        };

        // Hash password
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);

        const newUser = new User(userData);
        await newUser.save();

        console.log('\n✅ User Created:');
        console.log(`   Name: ${userData.name}`);
        console.log(`   Email: ${userData.email}`);
        console.log(`   Password: password123`);
        console.log(`   Mobile: ${userData.mobile}`);
        console.log(`   ID: ${newUser._id}`);

        // 3. Create Wallet with ₹2000
        const wallet = new Wallet({
            userId: newUser._id,
            balance: 2000
        });
        await wallet.save();

        console.log('\n💰 Wallet Created:');
        console.log(`   Balance: ₹${wallet.balance}`);
        console.log(`   Wallet ID: ${wallet._id}`);

        console.log('\n✨ SUCCESS! You can now login with these credentials.');

    } catch (err) {
        console.error('\n❌ ERROR:', err.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

createUserWithBalance();
