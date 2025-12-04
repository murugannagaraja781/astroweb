const axios = require('axios');

const payload = {
    year: 1993,
    month: 10,
    day: 29,
    hour: 6,
    minute: 45,
    lat: 8.964,
    lon: 77.315,
    tz: 5.5
};

const runTests = async () => {
    console.log('Testing POST /api/vimshottari/ (trailing slash)...');
    try {
        const res = await axios.post('https://apidash-production.up.railway.app/api/vimshottari/', payload);
        console.log('POST /api/vimshottari/ SUCCESS:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log('POST /api/vimshottari/ FAILED:', e.message, e.response?.status);
    }
};

runTests();
