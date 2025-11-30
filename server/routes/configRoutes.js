const express = require('express');
const router = express.Router();
const SystemConfig = require('../models/SystemConfig');

// Get call rate
router.get('/call-rate', async (req, res) => {
    try {
        const rate = await SystemConfig.getValue('default_call_rate', 1);
        res.json({ rate });
    } catch (error) {
        console.error('Error fetching call rate:', error);
        res.status(500).json({ error: 'Failed to fetch call rate' });
    }
});

// Get chat rate
router.get('/chat-rate', async (req, res) => {
    try {
        const rate = await SystemConfig.getValue('default_chat_rate', 1);
        res.json({ rate });
    } catch (error) {
        console.error('Error fetching chat rate:', error);
        res.status(500).json({ error: 'Failed to fetch chat rate' });
    }
});

// Set config (admin only)
router.post('/set', async (req, res) => {
    try {
        const { key, value } = req.body;
        const userId = req.user?.id;

        // Check if user is admin
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const config = await SystemConfig.setValue(key, value, userId);
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error setting config:', error);
        res.status(500).json({ error: 'Failed to set config' });
    }
});

module.exports = router;
