// Test MSG91 OTP Integration
require('dotenv').config();
const axios = require('axios');

const API_URL = process.env.BACKEND_URL || 'https://astroweb-production.up.railway.app';
const TEST_PHONE = '9876543210'; // Replace with your test phone number

console.log('🧪 Testing MSG91 OTP Integration\n');
console.log('Configuration:');
console.log('- Auth Key:', process.env.MSG91_AUTHKEY);
console.log('- Template ID:', process.env.MSG91_TEMPLATE_ID);
console.log('- Sender ID:', process.env.MSG91_SENDER_ID);
console.log('- API URL:', API_URL);
console.log('- Test Phone:', TEST_PHONE);
console.log('\n' + '='.repeat(50) + '\n');

async function testSendOTP() {
  console.log('📤 Test 1: Send OTP');
  console.log('Sending OTP to:', TEST_PHONE);

  try {
    const response = await axios.post(
      `${API_URL}/api/otp/send`,
      { phoneNumber: TEST_PHONE },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n' + '='.repeat(50) + '\n');
    return true;
  } catch (error) {
    console.log('❌ Failed!');
    console.log('Error:', error.response?.data || error.message);
    console.log('\n' + '='.repeat(50) + '\n');
    return false;
  }
}

async function testVerifyOTP() {
  console.log('📥 Test 2: Verify OTP');
  console.log('⚠️  Manual Step Required:');
  console.log('1. Check your phone for the OTP');
  console.log('2. Run: node server/test_otp_integration.js verify <OTP>');
  console.log('\nExample: node server/test_otp_integration.js verify 123456');
  console.log('\n' + '='.repeat(50) + '\n');
}

async function verifyOTP(otp) {
  console.log('🔐 Verifying OTP:', otp);
  console.log('Phone:', TEST_PHONE);

  try {
    const response = await axios.post(
      `${API_URL}/api/otp/verify`,
      { phoneNumber: TEST_PHONE, otp },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log('✅ OTP Verified Successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n📝 User Details:');
    console.log('- ID:', response.data.user?.id);
    console.log('- Name:', response.data.user?.name);
    console.log('- Phone:', response.data.user?.phone);
    console.log('- Role:', response.data.user?.role);
    console.log('\n🔑 JWT Token:', response.data.token?.substring(0, 50) + '...');
    console.log('\n' + '='.repeat(50) + '\n');
    return true;
  } catch (error) {
    console.log('❌ Verification Failed!');
    console.log('Error:', error.response?.data || error.message);
    console.log('\n' + '='.repeat(50) + '\n');
    return false;
  }
}

async function testDirectMSG91() {
  console.log('🔗 Test 3: Direct MSG91 API Call');
  console.log('Testing MSG91 API directly...');

  try {
    const url = 'https://control.msg91.com/api/v5/otp';
    const params = {
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile: `91${TEST_PHONE}`,
      authkey: process.env.MSG91_AUTHKEY,
      sender: process.env.MSG91_SENDER_ID,
      otp_expiry: 5,
      otp_length: 6
    };

    console.log('Request URL:', url);
    console.log('Parameters:', params);

    const response = await axios.post(url, null, {
      params: params,
      headers: {
        'Content-Type': 'application/json',
        'authkey': process.env.MSG91_AUTHKEY
      }
    });

    console.log('✅ Direct API Call Successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n' + '='.repeat(50) + '\n');
    return true;
  } catch (error) {
    console.log('❌ Direct API Call Failed!');
    console.log('Error:', error.response?.data || error.message);
    console.log('\n' + '='.repeat(50) + '\n');
    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const otpValue = args[1];

  if (command === 'verify' && otpValue) {
    // Verify OTP
    await verifyOTP(otpValue);
  } else if (command === 'direct') {
    // Test direct MSG91 API
    await testDirectMSG91();
  } else {
    // Send OTP
    const success = await testSendOTP();
    if (success) {
      await testVerifyOTP();
    }
  }
}

main().catch(console.error);
