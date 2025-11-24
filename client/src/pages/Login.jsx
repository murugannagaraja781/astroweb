 import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const Login = () => {
  const [loginMode, setLoginMode] = useState('email');
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
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        alert('OTP verified successfully!');
        navigate('/dashboard');
        window.location.reload();
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      {/* Stars Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-2 h-2 bg-white rounded-full animate-pulse" style={{ top: '20%', left: '10%' }}></div>
        <div className="absolute w-1 h-1 bg-yellow-200 rounded-full animate-pulse" style={{ top: '40%', left: '80%' }}></div>
        <div className="absolute w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse" style={{ top: '60%', left: '30%' }}></div>
        <div className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: '80%', left: '60%' }}></div>
        <div className="absolute w-2 h-2 bg-yellow-100 rounded-full animate-pulse" style={{ top: '30%', left: '50%' }}></div>
      </div>

      <div className="relative w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-8">
        {/* Left Side - Astrological Illustration */}
        <div className="w-full lg:w-1/2 flex justify-center items-center">
          <div className="relative w-80 h-80 lg:w-96 lg:h-96">
            {/* Zodiac Circle */}
            <div className="absolute inset-0 border-4 border-yellow-400 rounded-full animate-spin-slow">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-3 text-white text-lg">♈</div>
              <div className="absolute top-1/4 right-4 transform translate-y-1 text-white text-lg">♉</div>
              <div className="absolute bottom-1/4 right-4 transform -translate-y-1 text-white text-lg">♊</div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-3 text-white text-lg">♋</div>
              <div className="absolute bottom-1/4 left-4 transform -translate-y-1 text-white text-lg">♌</div>
            </div>

            {/* Central Moon */}
            <div className="absolute inset-0 m-auto w-32 h-32 bg-gradient-to-br from-gray-200 to-gray-400 rounded-full shadow-2xl flex items-center justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-900 to-blue-900 rounded-full shadow-inner"></div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-8 left-8 w-16 h-16 bg-purple-500 rounded-full opacity-20 animate-bounce"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 bg-blue-400 rounded-full opacity-30 animate-bounce delay-1000"></div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-6 lg:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">☯</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
                Cosmic Login
              </h1>
              <p className="text-gray-300 text-sm lg:text-base">
                Unlock your celestial journey
              </p>
            </div>

            {/* Login Mode Toggle */}
            <div className="flex gap-2 mb-8 p-1 bg-white/10 rounded-2xl">
              <button
                type="button"
                onClick={() => setLoginMode('email')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm lg:text-base font-medium transition-all duration-300 ${
                  loginMode === 'email'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                ✨ Email Login
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('otp')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm lg:text-base font-medium transition-all duration-300 ${
                  loginMode === 'otp'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                🔮 OTP Login
              </button>
            </div>

            {/* Email/Password Login Form */}
            {loginMode === 'email' && (
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      🌟 {t('email')}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={onChange}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your cosmic email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      🔑 {t('password')}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={password}
                      onChange={onChange}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your secret key"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  🚀 {t('login')}
                </button>
              </form>
            )}

            {/* OTP Login Form */}
            {loginMode === 'otp' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    📱 Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter 10-digit cosmic number"
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    maxLength="10"
                    disabled={otpSent}
                  />
                </div>

                {otpSent && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      ✉️ Enter Cosmic OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-center text-lg tracking-widest"
                      maxLength="6"
                    />
                  </div>
                )}

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSendingOtp ? (
                      <span className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending Cosmic OTP...
                      </span>
                    ) : (
                      '📨 Send Cosmic OTP'
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isVerifying}
                      className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isVerifying ? (
                        <span className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Verifying...
                        </span>
                      ) : (
                        '✅ Verify Cosmic OTP'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp('');
                      }}
                      className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 text-gray-300 font-medium rounded-xl border border-white/10 transition-all duration-300"
                    >
                      🔄 Change Number
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-xs lg:text-sm">
                By logging in, you agree to our{' '}
                <a href="#" className="text-yellow-400 hover:text-yellow-300 underline">
                  Cosmic Terms
                </a>{' '}
                and{' '}
                <a href="#" className="text-yellow-400 hover:text-yellow-300 underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;