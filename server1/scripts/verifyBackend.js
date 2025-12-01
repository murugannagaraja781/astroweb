const axios = require('axios');

const API_URL = 'http://localhost:9001/api';

async function testBackend() {
    try {
        // 1. Login as Admin
        console.log('Logging in as admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@gmail.com',
            password: 'Admin@2026'
        });
        const token = loginRes.data.token;
        console.log('Login successful. Token received.');

        const config = {
            headers: {
                'x-auth-token': token
            }
        };

        // 2. Test Stats Endpoint
        console.log('\nTesting Stats Endpoint...');
        const statsRes = await axios.get(`${API_URL}/admin/stats`, config);
        console.log('Stats Response:', statsRes.data);
        if (statsRes.data.todayEarnings !== undefined && statsRes.data.pendingRequests !== undefined) {
            console.log('✅ Stats endpoint verified.');
        } else {
            console.error('❌ Stats endpoint missing fields.');
        }

        // 3. Test Horoscope Endpoints
        console.log('\nTesting Horoscope Endpoints...');
        // Add Horoscope
        const horoscopeData = {
            rasi: 'Mesham',
            type: 'daily',
            content: 'Test content',
            date: new Date().toISOString().split('T')[0],
            language: 'tamil'
        };
        const addHoroscopeRes = await axios.post(`${API_URL}/admin/horoscope`, horoscopeData, config);
        console.log('Add Horoscope Response:', addHoroscopeRes.data);

        // Get Horoscopes
        const getHoroscopesRes = await axios.get(`${API_URL}/admin/horoscopes`, config);
        console.log(`Fetched ${getHoroscopesRes.data.length} horoscopes.`);
        const addedHoroscope = getHoroscopesRes.data.find(h => h.rasi === 'Mesham' && h.type === 'daily');

        if (addedHoroscope) {
            // Delete Horoscope
            console.log('Deleting added horoscope...');
            await axios.delete(`${API_URL}/admin/horoscope/${addedHoroscope._id}`, config);
            console.log('✅ Horoscope endpoints verified.');
        } else {
            console.error('❌ Failed to verify horoscope addition.');
        }

        // 4. Test Logout Endpoint
        console.log('\nTesting Logout Endpoint...');
        const logoutRes = await axios.post(`${API_URL}/auth/logout`, {}, config);
        console.log('Logout Response:', logoutRes.data);
        if (logoutRes.data.msg === 'Logged out successfully') {
            console.log('✅ Logout endpoint verified.');
        } else {
            console.error('❌ Logout endpoint failed.');
        }

    } catch (error) {
        console.error('Test failed:', error.response ? error.response.data : error.message);
    }
}

testBackend();
