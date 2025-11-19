const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

exports.addMoney = async (req, res) => {
  try {
    const { amount } = req.body;
    const wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) return res.status(404).json({ msg: 'Wallet not found' });

    wallet.balance += amount;
    await wallet.save();

    const transaction = new Transaction({
      walletId: wallet._id,
      amount,
      type: 'credit',
      description: 'Added money to wallet'
    });
    await transaction.save();

    res.json(wallet);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getBalance = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user.id });
    if (!wallet) return res.status(404).json({ msg: 'Wallet not found' });
    res.json(wallet);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
