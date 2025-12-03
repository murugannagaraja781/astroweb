// Enhanced OTP Debugging Script
require('dotenv').config();
const axios = require('axios');

const TEST_PHONE = '9876543210'; // Replace with your actual phone number

console.log('🔍 MSG91 OTP Configuration Debug\n');
console.log('=' .repeat(60));
console.log('Environment Variables:');
console.log('- AUTH_KEY:', process.env.MSG91_AUTHKEY ? '✅ Set' : '❌ Missing');
console.log('- TEMPLATE_ID:', process.env.MSG91_TEMPLATE_ID || 'Using default: 1407172294566795685');
console.log('- SENDER_ID:', process.env.MSG91_SENDER_ID || 'Using default: ASTRO9');
console.log('=' .repeat(60));
console.log('\n');

async function testDirectAPI() {
  console.log('📡 Test 1: Direct MSG91 API Call\n');

  try {
    const url = 'https://control.msg91.com/api/v5/otp';
    const params = {
      template_id: process.env.MSG91_TEMPLATE_ID || '1407172294566795685',
      mobile: `91${TEST_PHONE}`,
      authkey: process.env.MSG91_AUTHKEY,
      sender: process.env.MSG91_SENDER_ID || 'ASTRO9',
      otp_expiry: 5,
      otp_length: 6
    };

    console.log('Request URL:', url);
    console.log('Request Params:', {
      ...params,
      authkey: params.authkey ? params.authkey.substring(0, 10) + '...' : 'MISSING'
    });
    console.log('\n');

    const response = await axios.post(url, null, {
      params: params,
      headers: {
        'Content-Type': 'application/json',
        'authkey': process.env.MSG91_AUTHKEY
      }
    });

    console.log('✅ SUCCESS!');
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('\n');
    console.log('🎉 OTP should be sent to:', TEST_PHONE);
    console.log('📱 Check your phone for the OTP message');

    return true;
  } catch (error) {
    console.log('❌ FAILED!');
    console.log('Error Status:', error.response?.status);
    console.log('Error Message:', error.response?.data?.message || error.message);
    console.log('Full Error:', JSON.stringify(error.response?.data, null, 2));
    console.log('\n');

    // Provide specific error guidance
    if (error.response?.status === 401) {
      console.log('🔑 Authentication Error:');
      console.log('   - Check if MSG91_AUTHKEY is correct in .env file');
      console.log('   - Verify the auth key is active in MSG91 dashboard');
    } else if (error.response?.status === 400) {
      console.log('⚠️  Bad Request Error:');
      console.log('   - Check if template ID is approved on DLT platform');
      console.log('   - Verify sender ID is registered');
      console.log('   - Ensure phone number format is correct');
    } else if (error.response?.status === 403) {
      console.log('🚫 Forbidden Error:');
      console.log('   - Check MSG91 account balance');
      console.log('   - Verify account is active');
    }

    return false;
  }
}

async function testAlternativeAPI() {
  console.log('\n📡 Test 2: Alternative MSG91 API (Older Version)\n');

  try {
    const url = 'https://api.msg91.com/api/v5/otp';
    const data = {
      template_id: process.env.MSG91_TEMPLATE_ID || '1407172294566795685',
      mobile: `91${TEST_PHONE}`,
      authkey: process.env.MSG91_AUTHKEY,
      otp_expiry: 5
    };

    console.log('Request URL:', url);
    console.log('Request Data:', {
      ...data,
      authkey: data.authkey ? data.authkey.substring(0, 10) + '...' : 'MISSING'
    });
    console.log('\n');

    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'authkey': process.env.MSG91_AUTHKEY
      }
    });

    console.log('✅ SUCCESS with alternative API!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    return true;
  } catch (error) {
    console.log('❌ Alternative API also failed');
    console.log('Error:', error.response?.data || error.message);

    return false;
  }
}

async function testRetryOTP() {
  console.log('\n📡 Test 3: Retry OTP API\n');

  try {
    const url = `https://control.msg91.com/api/v5/otp/retry`;
    const params = {
      authkey: process.env.MSG91_AUTHKEY,
      mobile: `91${TEST_PHONE}`,
      retrytype: 'text' // or 'voice'
    };

    const response = await axios.post(url, null, {
      params: params,
      headers: {
        'authkey': process.env.MSG91_AUTHKEY
      }
    });

    console.log('✅ Retry OTP sent!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    return true;
  } catch (error) {
    console.log('❌ Retry failed');
    console.log('Error:', error.response?.data || error.message);

    return false;
  }
}

async function main() {
  console.log('🚀 Starting MSG91 OTP Debug Tests\n');

  if (!process.env.MSG91_AUTHKEY) {
    console.log('❌ CRITICAL: MSG91_AUTHKEY is not set in .env file!');
    console.log('   Please add: MSG91_AUTHKEY=your_auth_key_here');
    process.exit(1);
  }

  // Test 1: Direct API
  const test1 = await testDirectAPI();

  if (!test1) {
    // Test 2: Alternative API
    await testAlternativeAPI();
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 Summary & Next Steps:');
  console.log('='.repeat(60));
  console.log('\n1. If OTP was sent successfully:');
  console.log('   - Check your phone for SMS');
  console.log('   - Use the OTP to test verification');
  console.log('   - Run: node server/test_otp_integration.js verify <OTP>');
  console.log('\n2. If OTP failed:');
  console.log('   - Check the error messages above');
  console.log('   - Verify MSG91 dashboard settings');
  console.log('   - Check account balance');
  console.log('   - Ensure DLT template is approved');
  console.log('\n3. Common Issues:');
  console.log('   - Wrong auth key → Update .env file');
  console.log('   - Template not approved → Check DLT platform');
  console.log('   - Low balance → Recharge MSG91 account');
  console.log('   - Wrong sender ID → Update in MSG91 dashboard');
  console.log('\n');
}

main().catch(console.error);
