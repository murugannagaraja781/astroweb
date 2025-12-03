// Quick MSG91 API Test
const axios = require('axios');

const AUTH_KEY = '478312AgHesvjV691c86b3P1';
const TEMPLATE_ID = '1407172294566795685';
const SENDER_ID = 'ASTRO9';
const TEST_PHONE = '9876543210'; // Replace with your actual number

console.log('🧪 Testing MSG91 API Configuration\n');
console.log('Auth Key:', AUTH_KEY);
console.log('Template ID:', TEMPLATE_ID);
console.log('Sender ID:', SENDER_ID);
console.log('Test Phone:', TEST_PHONE);
console.log('\n' + '='.repeat(60) + '\n');

async function testMethod1() {
  console.log('📡 Method 1: Control API (v5) with Query Params\n');

  try {
    const url = 'https://control.msg91.com/api/v5/otp';
    const params = {
      template_id: TEMPLATE_ID,
      mobile: `91${TEST_PHONE}`,
      authkey: AUTH_KEY,
      sender: SENDER_ID,
      otp_expiry: 5,
      otp_length: 6
    };

    console.log('URL:', url);
    console.log('Params:', params);
    console.log('');

    const response = await axios.post(url, null, {
      params: params,
      headers: {
        'Content-Type': 'application/json',
        'authkey': AUTH_KEY
      }
    });

    console.log('✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

async function testMethod2() {
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('📡 Method 2: API Domain (v5) with Body\n');

  try {
    const url = 'https://api.msg91.com/api/v5/otp';
    const data = {
      template_id: TEMPLATE_ID,
      mobile: TEST_PHONE,
      authkey: AUTH_KEY,
      otp_expiry: 5,
      otp_length: 6
    };

    console.log('URL:', url);
    console.log('Data:', data);
    console.log('');

    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'authkey': AUTH_KEY
      }
    });

    console.log('✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

async function testMethod3() {
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('📡 Method 3: Legacy sendotp.php API\n');

  try {
    const url = 'https://api.msg91.com/api/sendotp.php';
    const params = {
      authkey: AUTH_KEY,
      mobile: TEST_PHONE,
      sender: SENDER_ID,
      message: 'Your OTP for Astro5star is ##OTP##. Valid for 5 minutes.',
      otp_length: 6,
      otp_expiry: 5
    };

    console.log('URL:', url);
    console.log('Params:', params);
    console.log('');

    const response = await axios.get(url, { params });

    console.log('✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

async function testMethod4() {
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('📡 Method 4: Control API with Mobile in Body\n');

  try {
    const url = 'https://control.msg91.com/api/v5/otp';
    const data = {
      template_id: TEMPLATE_ID,
      mobile: `91${TEST_PHONE}`,
      authkey: AUTH_KEY
    };

    console.log('URL:', url);
    console.log('Data:', data);
    console.log('');

    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json',
        'authkey': AUTH_KEY
      }
    });

    console.log('✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Status:', error.response?.status);
    console.log('Error:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

async function main() {
  console.log('🚀 Starting MSG91 API Tests...\n');

  const results = {
    method1: await testMethod1(),
    method2: await testMethod2(),
    method3: await testMethod3(),
    method4: await testMethod4()
  };

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log('Method 1 (Control API - Query):', results.method1 ? '✅ PASS' : '❌ FAIL');
  console.log('Method 2 (API Domain - Body):', results.method2 ? '✅ PASS' : '❌ FAIL');
  console.log('Method 3 (Legacy sendotp.php):', results.method3 ? '✅ PASS' : '❌ FAIL');
  console.log('Method 4 (Control API - Body):', results.method4 ? '✅ PASS' : '❌ FAIL');
  console.log('='.repeat(60));

  const anySuccess = Object.values(results).some(r => r);

  if (anySuccess) {
    console.log('\n✅ At least one method worked! Check your phone for OTP.');
    console.log('📱 Use the successful method in your application.');
  } else {
    console.log('\n❌ All methods failed. Possible issues:');
    console.log('   1. Auth key is invalid or expired');
    console.log('   2. Template ID not approved on DLT');
    console.log('   3. Sender ID not registered');
    console.log('   4. MSG91 account balance is low');
    console.log('   5. Phone number format issue');
    console.log('\n💡 Next steps:');
    console.log('   - Login to MSG91 dashboard');
    console.log('   - Check account balance');
    console.log('   - Verify template approval status');
    console.log('   - Check sender ID registration');
  }

  console.log('\n');
}

main().catch(console.error);
