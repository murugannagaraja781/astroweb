// Test Production OTP API
const axios = require('axios');

const PRODUCTION_URL = 'https://astroweb-production.up.railway.app';
const TEST_PHONE = '9876543210'; // Replace with your actual phone number

console.log('🧪 Testing Production OTP API\n');
console.log('API URL:', PRODUCTION_URL);
console.log('Test Phone:', TEST_PHONE);
console.log('\n' + '='.repeat(60) + '\n');

async function testSendOTP() {
  console.log('📤 Sending OTP Request...\n');

  try {
    const response = await axios.post(
      `${PRODUCTION_URL}/api/otp/send`,
      { phoneNumber: TEST_PHONE },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n📱 Check your phone for OTP!');
    console.log('Phone:', TEST_PHONE);

    return response.data;
  } catch (error) {
    console.log('❌ FAILED!');
    console.log('Status:', error.response?.status);
    console.log('Error Message:', error.response?.data?.msg || error.message);
    console.log('Full Error:', JSON.stringify(error.response?.data, null, 2));

    if (error.response?.status === 500) {
      console.log('\n🔧 Server Error - Possible Issues:');
      console.log('   1. MSG91_AUTHKEY not set in production .env');
      console.log('   2. MSG91_TEMPLATE_ID not set in production .env');
      console.log('   3. Server configuration issue');
    } else if (error.response?.status === 400) {
      console.log('\n⚠️  Bad Request - Check:');
      console.log('   1. Phone number format');
      console.log('   2. Request body structure');
    }

    return null;
  }
}

async function testVerifyOTP(otp) {
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('🔐 Verifying OTP...\n');

  try {
    const response = await axios.post(
      `${PRODUCTION_URL}/api/otp/verify`,
      {
        phoneNumber: TEST_PHONE,
        otp: otp
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ OTP VERIFIED!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('\n🎉 Login Successful!');
    console.log('Token:', response.data.token?.substring(0, 50) + '...');
    console.log('User:', response.data.user);

    return response.data;
  } catch (error) {
    console.log('❌ VERIFICATION FAILED!');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));

    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const otpValue = args[1];

  if (command === 'verify' && otpValue) {
    // Verify OTP
    await testVerifyOTP(otpValue);
  } else {
    // Send OTP
    const result = await testSendOTP();

    if (result) {
      console.log('\n' + '='.repeat(60));
      console.log('📝 Next Steps:');
      console.log('='.repeat(60));
      console.log('\n1. Check your phone for OTP SMS');
      console.log('2. Once you receive it, verify with:');
      console.log(`   node test_production_otp.js verify <OTP>`);
      console.log('\n   Example: node test_production_otp.js verify 123456');
      console.log('\n');
    }
  }
}

main().catch(console.error);
