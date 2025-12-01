const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Wallet = require('../models/Wallet');

dotenv.config({ path: '.env' });

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const users = await User.find();
    console.log('Users:', users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));

    const wallets = await Wallet.find();
    console.log('Wallets:', wallets.map(w => ({ id: w._id, userId: w.userId, balance: w.balance })));

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkData();
