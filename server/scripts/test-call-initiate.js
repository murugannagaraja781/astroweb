const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';
const MONGO_URI = process.env.MONGO_URI;

async function testCallInitiation() {
    console.log('\n📞 TESTING CALL INITIATION ENDPOINT (WITH LOGIN)\n');
    console.log('='.repeat(60));

    let testUserId = null;

    try {
        // 1. Connect to Database
        console.log('📊 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected');

        const User = require('../models/User');
        const Wallet = require('../models/Wallet');

        // 2. Find an Astrologer
        console.log('\n👥 Finding an astrologer...');
        const astrologer = await User.findOne({ role: 'astrologer' });
        if (!astrologer) throw new Error('No astrologer user found');
        console.log(`✅ Astrologer found: ${astrologer.name} (${astrologer._id})`);

        // 3. Create/Register a Test User
        console.log('\n👤 Creating test user...');
        const testUser = {
            name: 'Test Client',
            email: `testclient_${Date.now()}@example.com`,
            password: 'password123',
            mobile: `999${Date.now().toString().slice(-7)}`,
            role: 'client'
        };

        // Register via API to ensure password hashing etc is correct
        // Actually, let's just use the register endpoint if possible, or create directly if we can hash
        // Easier to use API register
        try {
            const regRes = await axios.post(`${API_URL}/api/auth/register`, testUser);
            console.log('✅ Test user registered via API');
            // Login to get token
            const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
                email: testUser.email,
                password: testUser.password
            });
            var token = loginRes.data.token;
            console.log('✅ Logged in & Token received');

            // Get user ID from DB to top up wallet
            const dbUser = await User.findOne({ email: testUser.email });
            testUserId = dbUser._id;

        } catch (e) {
            console.log('   Registration failed, trying direct DB creation...');
            // Fallback: Create in DB directly (might fail if we don't have bcrypt here)
            // Let's assume API works. If not, we have bigger problems.
            throw e;
        }

        // 4. Top-up Wallet
        console.log('\n💰 Topping up test wallet...');
        let wallet = await Wallet.findOne({ userId: testUserId });
        if (!wallet) {
            wallet = new Wallet({ userId: testUserId, balance: 100 });
        } else {
            wallet.balance = 100;
        }
        await wallet.save();
        console.log('✅ Wallet balance set to ₹100');

        // 5. Make API Request
        console.log('\n🚀 Sending POST request to /api/call/initiate...');
        const requestBody = {
            receiverId: astrologer._id.toString(),
            type: 'video'
        };

        console.log('   Request Body:', JSON.stringify(requestBody, null, 2));

        const response = await axios.post(
            `${API_URL}/api/call/initiate`,
            requestBody,
            {
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('\n✅ RESPONSE RECEIVED:');
        console.log('   Status:', response.status);
        console.log('   Data:', JSON.stringify(response.data, null, 2));

    } catch (err) {
        console.error('\n❌ TEST FAILED:');
        if (err.response) {
            console.error('   Status:', err.response.status);
            console.error('   Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('   Error:', err.message);
        }
    } finally {
        // Cleanup
        if (testUserId) {
            console.log('\n🧹 Cleaning up test user...');
            const User = require('../models/User');
            const Wallet = require('../models/Wallet');
            await User.findByIdAndDelete(testUserId);
            await Wallet.findOneAndDelete({ userId: testUserId });
            console.log('✅ Cleanup done');
        }

        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

testCallInitiation();
