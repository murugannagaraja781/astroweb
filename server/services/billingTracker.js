const ActiveCall = require('../models/ActiveCall');
const Wallet = require('../models/Wallet');
const CallLog = require('../models/CallLog');

/**
 * Billing Tracker Service
 * Runs every 5 seconds to track active calls and deduct money
 */

class BillingTracker {
    constructor(io) {
        this.io = io;
        this.interval = null;
    }

    start() {
        console.log('🔄 Billing Tracker started');

        // Run every 5 seconds
        this.interval = setInterval(async () => {
            await this.processActiveCalls();
        }, 5000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            console.log('⏹️  Billing Tracker stopped');
        }
    }

    async processActiveCalls() {
        try {
            // Get all active calls
            const activeCalls = await ActiveCall.find({ status: 'active' })
                .populate('callerId')
                .populate('receiverId');

            for (const call of activeCalls) {
                await this.updateCallBilling(call);
            }
        } catch (err) {
            console.error('Error in processActiveCalls:', err);
        }
    }

    async updateCallBilling(call) {
        try {
            if (!call.acceptedTime) {
                // Call not yet accepted, skip billing
                return;
            }

            const now = new Date();
            const durationSeconds = (now - new Date(call.acceptedTime)) / 1000;
            const durationMinutes = durationSeconds / 60;
            const cost = durationMinutes * call.rate; // ₹1 per minute

            // Update call record
            call.currentDuration = Math.floor(durationSeconds);
            call.currentCost = parseFloat(cost.toFixed(2));
            call.lastBillingUpdate = now;
            await call.save();

            // Check caller's wallet
            const callerWallet = await Wallet.findOne({ userId: call.callerId });

            if (!callerWallet || callerWallet.balance < 1) {
                // Insufficient balance - end call
                console.log(`⚠️  Call ${call.callId} - Insufficient balance, ending call`);
                await this.endCallDueToBalance(call);
                return;
            }

            // Emit billing update to both parties
            this.io.to(call.callerId.toString()).emit('billingUpdate', {
                callId: call.callId,
                duration: call.currentDuration,
                cost: call.currentCost,
                balance: callerWallet.balance
            });

            this.io.to(call.receiverId.toString()).emit('billingUpdate', {
                callId: call.callId,
                duration: call.currentDuration,
                earnings: call.currentCost
            });

            // Log every minute
            if (call.currentDuration % 60 === 0) {
                console.log(`📞 Call ${call.callId}: ${call.currentDuration}s, ₹${call.currentCost}`);
            }

        } catch (err) {
            console.error(`Error updating billing for call ${call.callId}:`, err);
        }
    }

    async endCallDueToBalance(call) {
        try {
            // Mark call as ended
            call.status = 'ended';
            await call.save();

            // Update CallLog
            await CallLog.findByIdAndUpdate(call.callId, {
                status: 'completed',
                endTime: new Date(),
                duration: call.currentDuration,
                cost: call.currentCost
            });

            // Deduct final amount from caller (minus any prepaid)
            const callerWallet = await Wallet.findOne({ userId: call.callerId });
            const prepaid = call.prepaid || 0;
            const netCost = Math.max(call.currentCost - prepaid, 0);
            if (callerWallet && callerWallet.balance >= netCost) {
                callerWallet.balance -= netCost;
                callerWallet.transactions.push({
                    amount: netCost,
                    type: 'debit',
                    description: `Call charge - ${call.currentDuration}s`,
                    date: new Date()
                });
                await callerWallet.save();
            }

            // Add to receiver's wallet
            const receiverWallet = await Wallet.findOne({ userId: call.receiverId });
            if (receiverWallet) {
                const adminCommission = netCost * 0.1; // 10% admin commission
                const expertEarning = netCost * 0.9; // 90% to expert

                receiverWallet.balance += expertEarning;
                receiverWallet.transactions.push({
                    amount: expertEarning,
                    type: 'credit',
                    description: `Call earning - ${call.currentDuration}s`,
                    date: new Date()
                });
                await receiverWallet.save();

                console.log(`💰 Admin commission: ₹${adminCommission.toFixed(2)}`);
            }

            // Notify both parties
            this.io.to(call.callerId.toString()).emit('callEndedBySystem', {
                reason: 'insufficient_balance',
                duration: call.currentDuration,
                cost: call.currentCost
            });

            this.io.to(call.receiverId.toString()).emit('callEndedBySystem', {
                reason: 'caller_insufficient_balance',
                duration: call.currentDuration,
                earnings: call.currentCost * 0.9
            });

            console.log(`✅ Call ${call.callId} ended due to insufficient balance`);

        } catch (err) {
            console.error('Error ending call due to balance:', err);
        }
    }
}

module.exports = BillingTracker;
