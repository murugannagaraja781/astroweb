// Check OTP Delivery Status
const axios = require('axios');

const AUTH_KEY = '478312AgHesvjV691c86b3P1';
const REQUEST_IDS = [
  '356c63776c59664858557833',
  '356c63776c597a4c38534861',
  '356c63776c5949724c684339',
  '356c63776c5951706678654e'
];

async function checkStatus(requestId) {
  try {
    console.log(`\n📊 Checking status for: ${requestId}`);

    const url = `https://control.msg91.com/api/v5/otp/status`;
    const params = {
      authkey: AUTH_KEY,
      request_id: requestId
    };

    const response = await axios.get(url, { params });

    console.log('Status:', response.data);
    return response.data;
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

async function main() {
  console.log('🔍 Checking OTP Delivery Status\n');
  console.log('='.repeat(60));

  for (const requestId of REQUEST_IDS) {
    await checkStatus(requestId);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 If status shows "DELIVERED" but you didn\'t receive SMS:');
  console.log('   - Check spam/blocked messages on your phone');
  console.log('   - Try with a different phone number');
  console.log('   - Contact your telecom operator');
  console.log('\n💡 If status shows "FAILED" or "REJECTED":');
  console.log('   - Check the error message');
  console.log('   - Verify DLT configuration in MSG91 dashboard');
  console.log('   - Contact MSG91 support');
  console.log('\n');
}

main().catch(console.error);
