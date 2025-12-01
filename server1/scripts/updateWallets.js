const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Wallet = require('../models/Wallet');

dotenv.config({ path: '.env' });

const addBonus = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    const result = await Wallet.updateMany({}, { $inc: { balance: 1000 } });
    console.log(`Updated ${result.modifiedCount} wallets. Added 1000 to each.`);

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

addBonus();
