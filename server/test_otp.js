const axios = require('axios');

const API_URL = 'http://localhost:9001/api/otp/send';
const phoneNumber = '9876543210'; // Test number

async function testSendOtp() {
    try {
        console.log(`Sending OTP to ${phoneNumber}...`);
        const response = await axios.post(API_URL, { phoneNumber });
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

testSendOtp();
