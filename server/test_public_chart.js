const axios = require('axios');

async function testPublicChart() {
    const url = 'http://localhost:9001/api/charts/birth-chart';
    const payload = {
        year: 1990,
        month: 1,
        day: 1,
        hour: 12,
        minute: 0,
        latitude: 13.0827,
        longitude: 80.2707,
        timezone: 5.5
    };

    console.log(`Testing public access to ${url}...`);

    try {
        const response = await axios.post(url, payload);

        if (response.status === 200 && response.data.success) {
            console.log('✅ Success! API is accessible without authentication.');
            console.log('Response summary:', {
                houses: Object.keys(response.data.data.houses).length,
                planets: Object.keys(response.data.data.planets).length
            });
        } else {
            console.log('⚠️ Unexpected response status:', response.status);
        }
    } catch (error) {
        if (error.response) {
            console.log('❌ Error Response:', error.response.status, error.response.data);
            if (error.response.status === 401 || error.response.status === 403) {
                console.log('❌ FAILED: Authentication still required.');
            }
        } else {
            console.log('❌ Error:', error.message);
            console.log('Is the server running on port 8080?');
        }
    }
}

testPublicChart();
