import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const Login = () => {
  const [loginMode, setLoginMode] = useState('email'); // 'email' or 'otp'
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpWidgetLoaded, setOtpWidgetLoaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { email, password } = formData;
  const MSG91_AUTHKEY = import.meta.env.VITE_MSG91_AUTHKEY;

  // Load MSG91 OTP widget script
  useEffect(() => {
    if (loginMode === 'otp' && !otpWidgetLoaded) {
      const script = document.createElement('script');
      script.src = 'https://control.msg91.com/app/assets/otp-provider/otp-provider.js';
      script.async = true;
      script.onload = () => {
        setOtpWidgetLoaded(true);
        console.log('MSG91 OTP widget loaded');
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [loginMode, otpWidgetLoaded]);

  // Initialize MSG91 OTP widget
  useEffect(() => {
    if (otpWidgetLoaded && loginMode === 'otp') {
      const configuration = {
        widgetId: MSG91_AUTHKEY,
        tokenAuth: MSG91_AUTHKEY,
        exposeMethods: true,
        success: (data) => {
          console.log('OTP Success:', data);
          verifyAccessToken(data);
        },
        failure: (error) => {
          console.error('OTP Failure:', error);
          alert('OTP verification failed. Please try again.');
        },
      };

      if (window.initSendOTP) {
        window.initSendOTP(configuration);
      }
    }
  }, [otpWidgetLoaded, loginMode, MSG91_AUTHKEY]);

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  };

  const handleOtpLogin = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }

    if (window.sendOtp) {
      window.sendOtp();
    } else {
      alert('OTP widget not loaded. Please try again.');
    }
  };

  const verifyAccessToken = async (otpData) => {
    setIsVerifying(true);
    try {
      const response = await axios.post(
        'https://control.msg91.com/api/v5/widget/verifyAccessToken',
        {
          authkey: MSG91_AUTHKEY,
          'access-token': otpData.message || otpData.token || otpData,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Access token verification response:', response.data);

      if (response.data.type === 'success') {
        // Successfully verified OTP
        alert('OTP verified successfully!');
        // You can now proceed with your login logic
        // For example, create a session or redirect to dashboard
        navigate('/dashboard');
      } else {
        alert('OTP verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying access token:', error);
      alert('Error verifying OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-light">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-border w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-black">Login</h2>

        {/* Login Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setLoginMode('email')}
            className={`flex-1 py-2 px-4 rounded ${
              loginMode === 'email'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Email Login
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('otp')}
            className={`flex-1 py-2 px-4 rounded ${
              loginMode === 'otp'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            OTP Login
          </button>
        </div>

        {/* Email/Password Login Form */}
        {loginMode === 'email' && (
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700">{t('email')}</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">{t('password')}</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 rounded"
              style={{ background: 'red', color: 'white' }}
            >
              {t('login')}
            </button>
          </form>
        )}

        {/* OTP Login Form */}
        {loginMode === 'otp' && (
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full p-2 border rounded"
                maxLength="10"
              />
            </div>

            {/* MSG91 OTP Widget Container */}
            <div id="send_otp" className="mb-4"></div>

            <button
              type="button"
              onClick={handleOtpLogin}
              disabled={isVerifying}
              className="w-full py-2 px-4 rounded"
              style={{
                background: isVerifying ? '#ccc' : 'red',
                color: 'white',
                cursor: isVerifying ? 'not-allowed' : 'pointer',
              }}
            >
              {isVerifying ? 'Verifying...' : 'Send OTP'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
