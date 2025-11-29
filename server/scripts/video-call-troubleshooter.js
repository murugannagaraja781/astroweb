const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = process.env.VITE_API_URL || 'https://astroweb-production.up.railway.app';
const MONGO_URI = process.env.MONGO_URI;

console.log('\n🔍 VIDEO CALL & CHAT TROUBLESHOOTER\n');
console.log('='.repeat(60));

const results = {
    passed: [],
    failed: [],
    warnings: []
};

function pass(test) {
    results.passed.push(test);
    console.log(`✅ ${test}`);
}

function fail(test, error) {
    results.failed.push({ test, error });
    console.log(`❌ ${test}`);
    if (error) console.log(`   Error: ${error}`);
}

function warn(test, message) {
    results.warnings.push({ test, message });
    console.log(`⚠️  ${test}`);
    if (message) console.log(`   Warning: ${message}`);
}

async function checkDatabaseConnection() {
    console.log('\n📊 Checking Database Connection...');
    try {
        await mongoose.connect(MONGO_URI);
        pass('MongoDB connection successful');
        return true;
    } catch (err) {
        fail('MongoDB connection failed', err.message);
        return false;
    }
}

async function checkModels() {
    console.log('\n📦 Checking Database Models...');
    try {
        const User = require('../models/User');
        const Wallet = require('../models/Wallet');
        const CallLog = require('../models/CallLog');
        const AstrologerProfile = require('../models/AstrologerProfile');

        const userCount = await User.countDocuments();
        const walletCount = await Wallet.countDocuments();
        const callCount = await CallLog.countDocuments();
        const astrologerCount = await AstrologerProfile.countDocuments();

        pass(`Users: ${userCount}`);
        pass(`Wallets: ${walletCount}`);
        pass(`Call Logs: ${callCount}`);
        pass(`Astrologers: ${astrologerCount}`);

        if (userCount > walletCount) {
            warn('Wallet mismatch', `${userCount - walletCount} users without wallets`);
        }

        return true;
    } catch (err) {
        fail('Model check failed', err.message);
        return false;
    }
}

async function checkUserRoles() {
    console.log('\n👥 Checking User Roles...');
    try {
        const User = require('../models/User');

        const adminCount = await User.countDocuments({ role: 'admin' });
        const astrologerCount = await User.countDocuments({ role: 'astrologer' });
        const clientCount = await User.countDocuments({ role: 'client' });

        pass(`Admins: ${adminCount}`);
        pass(`Astrologers: ${astrologerCount}`);
        pass(`Clients: ${clientCount}`);

        if (adminCount === 0) {
            warn('No admin users', 'Create at least one admin user');
        }

        return true;
    } catch (err) {
        fail('User role check failed', err.message);
        return false;
    }
}

async function checkWalletBalances() {
    console.log('\n💰 Checking Wallet Balances...');
    try {
        const Wallet = require('../models/Wallet');
        const User = require('../models/User');

        const zeroBalanceWallets = await Wallet.countDocuments({ balance: { $lte: 0 } });
        const totalWallets = await Wallet.countDocuments();

        pass(`Total wallets: ${totalWallets}`);

        if (zeroBalanceWallets > 0) {
            warn('Low balance wallets', `${zeroBalanceWallets} wallets with ≤ ₹0 balance`);

            // Find clients with zero balance
            const zeroBalanceWalletsData = await Wallet.find({ balance: { $lte: 0 } }).populate('userId', 'name email role');
            const clientsWithZeroBalance = zeroBalanceWalletsData.filter(w => w.userId?.role === 'client');

            if (clientsWithZeroBalance.length > 0) {
                console.log(`   Clients affected: ${clientsWithZeroBalance.length}`);
            }
        } else {
            pass('All wallets have positive balance');
        }

        return true;
    } catch (err) {
        fail('Wallet check failed', err.message);
        return false;
    }
}

async function checkCallLogs() {
    console.log('\n📞 Checking Call Logs...');
    try {
        const CallLog = require('../models/CallLog');

        const recentCalls = await CallLog.find().sort({ startTime: -1 }).limit(5);
        pass(`Recent calls found: ${recentCalls.length}`);

        if (recentCalls.length > 0) {
            const statuses = await CallLog.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]);

            statuses.forEach(s => {
                console.log(`   ${s._id}: ${s.count}`);
            });
        }

        return true;
    } catch (err) {
        fail('Call log check failed', err.message);
        return false;
    }
}

async function checkAPIEndpoints() {
    console.log('\n🌐 Checking API Endpoints...');

    const endpoints = [
        { method: 'GET', path: '/api/public/astrologers', auth: false },
        { method: 'GET', path: '/api/horoscope/signs', auth: false }
    ];

    for (const endpoint of endpoints) {
        try {
            const url = `${API_URL}${endpoint.path}`;
            const response = await axios.get(url);

            if (response.status === 200) {
                pass(`${endpoint.method} ${endpoint.path}`);
            } else {
                warn(`${endpoint.method} ${endpoint.path}`, `Status: ${response.status}`);
            }
        } catch (err) {
            if (err.response) {
                fail(`${endpoint.method} ${endpoint.path}`, `Status: ${err.response.status}`);
            } else if (err.code === 'ECONNREFUSED') {
                fail(`${endpoint.method} ${endpoint.path}`, 'Server not running');
            } else {
                fail(`${endpoint.method} ${endpoint.path}`, err.message);
            }
        }
    }

    return true;
}

async function checkEnvironmentVariables() {
    console.log('\n🔧 Checking Environment Variables...');

    const requiredVars = {
        'MONGO_URI': process.env.MONGO_URI,
        'JWT_SECRET': process.env.JWT_SECRET,
        'PORT': process.env.PORT,
        'PHONEPE_AUTH_KEY': process.env.PHONEPE_AUTH_KEY
    };

    let allPresent = true;

    for (const [key, value] of Object.entries(requiredVars)) {
        if (value) {
            pass(`${key} is set`);
        } else {
            fail(`${key} is missing`);
            allPresent = false;
        }
    }

    return allPresent;
}

function printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 TROUBLESHOOTING SUMMARY\n');

    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);

    if (results.failed.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        results.failed.forEach((f, i) => {
            console.log(`   ${i + 1}. ${f.test}`);
            if (f.error) console.log(`      → ${f.error}`);
        });
    }

    if (results.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        results.warnings.forEach((w, i) => {
            console.log(`   ${i + 1}. ${w.test}`);
            if (w.message) console.log(`      → ${w.message}`);
        });
    }

    console.log('\n' + '='.repeat(60));

    if (results.failed.length === 0) {
        console.log('\n✅ All critical checks passed!');
    } else {
        console.log('\n❌ Some checks failed. Review the errors above.');
    }
}

async function main() {
    try {
        await checkEnvironmentVariables();

        const dbConnected = await checkDatabaseConnection();

        if (dbConnected) {
            await checkModels();
            await checkUserRoles();
            await checkWalletBalances();
            await checkCallLogs();
        }

        await checkAPIEndpoints();

    } catch (err) {
        console.error('\n❌ Fatal error:', err.message);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('\n🔌 Database connection closed');
        }

        printSummary();
        process.exit(results.failed.length > 0 ? 1 : 0);
    }
}

main();
