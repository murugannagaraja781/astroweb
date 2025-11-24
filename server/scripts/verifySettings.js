const axios = require('axios');

const API_URL = 'http://localhost:9001/api';

async function testSettings() {
    try {
        // 1. Login as Admin
        console.log('Logging in as admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@gmail.com',
            password: 'Admin@2026'
        });
        const token = loginRes.data.token;
        console.log('Login successful.');

        const config = {
            headers: {
                'x-auth-token': token
            }
        };

        // 2. Get Default Settings
        console.log('\nFetching default settings...');
        const getRes = await axios.get(`${API_URL}/admin/settings`, config);
        console.log('Default Settings:', getRes.data);

        if (getRes.data.platformTitle === 'AstroSeva') {
            console.log('✅ Default settings verified.');
        } else {
            console.error('❌ Default settings mismatch.');
        }

        // 3. Update Settings
        console.log('\nUpdating settings...');
        const newSettings = {
            platformTitle: 'New Astro Title',
            platformLogo: '🔮',
            primaryColor: 'indigo',
            currency: '$',
            language: 'english',
            timezone: 'America/New_York'
        };
        const updateRes = await axios.post(`${API_URL}/admin/settings`, newSettings, config);
        console.log('Updated Settings:', updateRes.data);

        if (updateRes.data.platformTitle === 'New Astro Title' && updateRes.data.currency === '$') {
            console.log('✅ Settings update verified.');
        } else {
            console.error('❌ Settings update failed.');
        }

        // 4. Verify Persistence
        console.log('\nVerifying persistence...');
        const verifyRes = await axios.get(`${API_URL}/admin/settings`, config);
        if (verifyRes.data.platformTitle === 'New Astro Title') {
            console.log('✅ Settings persistence verified.');
        } else {
            console.error('❌ Settings persistence failed.');
        }

        // 5. Revert Settings (Optional, to keep clean state)
        console.log('\nReverting settings...');
        const defaultSettings = {
            platformTitle: 'AstroSeva',
            platformLogo: '🌟',
            primaryColor: 'purple',
            currency: '₹',
            language: 'tamil',
            timezone: 'Asia/Kolkata'
        };
        await axios.post(`${API_URL}/admin/settings`, defaultSettings, config);
        console.log('✅ Settings reverted.');

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

testSettings();
