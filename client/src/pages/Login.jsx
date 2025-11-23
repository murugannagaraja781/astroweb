import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const Login = () => {
  const [loginMode, setLoginMode] = useState('email'); // 'email' or 'otp'
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { email, password } = formData;
  const MSG91_AUTHKEY = import.meta.env.VITE_MSG91_AUTHKEY;
  const API_URL = import.meta.env.VITE_API_URL;

  // Load MSG91 OTP widget script
  // Removed MSG91 widget useEffects

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

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/otp/send`,
        { phoneNumber },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('OTP Send Response:', response.data);

      if (response.data.type === 'success') {
        setOtpSent(true);
        alert('OTP sent successfully! Please check your phone.');
      } else {
        alert('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      console.error('Error response:', error.response?.data);
      alert(`Error sending OTP: ${error.response?.data?.msg || error.message}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      alert('Please enter a valid OTP');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/otp/verify`,
        { phoneNumber, otp },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('OTP Verification Response:', response.data);

      if (response.data.type === 'success' && response.data.token) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        alert('OTP verified successfully!');
        navigate('/dashboard');
        window.location.reload(); // Reload to update AuthContext
      } else {
        alert('Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      console.error('Error response:', error.response?.data);
      alert(`Error verifying OTP: ${error.response?.data?.msg || error.message}`);
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
                placeholder="Enter 10-digit phone number"
                className="w-full p-2 border rounded"
                maxLength="10"
                disabled={otpSent}
              />
            </div>

            {otpSent && (
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full p-2 border rounded"
                  maxLength="6"
                />
              </div>
            )}

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp}
                className="w-full py-2 px-4 rounded"
                style={{
                  background: isSendingOtp ? '#ccc' : 'red',
                  color: 'white',
                  cursor: isSendingOtp ? 'not-allowed' : 'pointer',
                }}
              >
                {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isVerifying}
                  className="w-full py-2 px-4 rounded"
                  style={{
                    background: isVerifying ? '#ccc' : 'red',
                    color: 'white',
                    cursor: isVerifying ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isVerifying ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp('');
                  }}
                  className="w-full py-2 px-4 rounded bg-gray-200 text-gray-700"
                >
                  Change Number
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
