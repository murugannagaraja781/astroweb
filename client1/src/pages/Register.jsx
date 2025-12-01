import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { name, email, password, confirmPassword, role } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password, role);
      alert('Registration successful! Welcome to the cosmic journey ✨');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
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

            {/* Central Star */}
            <div className="absolute inset-0 m-auto w-32 h-32 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-full shadow-2xl flex items-center justify-center animate-pulse">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-900 to-blue-900 rounded-full shadow-inner flex items-center justify-center">
                <span className="text-4xl">✨</span>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-8 left-8 w-16 h-16 bg-purple-500 rounded-full opacity-20 animate-bounce"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 bg-blue-400 rounded-full opacity-30 animate-bounce delay-1000"></div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-6 lg:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">🌟</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
                Cosmic Registration
              </h1>
              <p className="text-gray-300 text-sm lg:text-base">
                Begin your celestial journey with us
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={onSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  👤 Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={onChange}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  placeholder="Enter your cosmic name"
                  required
                />
              </div>

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
                  placeholder="Create a secret key (min 6 characters)"
                  required
                  minLength="6"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  🔐 Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  placeholder="Confirm your secret key"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  🎭 {t('role')}
                </label>
                <select
                  name="role"
                  value={role}
                  onChange={onChange}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 cursor-pointer"
                >
                  <option value="client" className="bg-gray-800">{t('client')}</option>
                  <option value="astrologer" className="bg-gray-800">{t('astrologer')}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </span>
                ) : (
                  '🚀 Create Cosmic Account'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center space-y-3">
              <p className="text-gray-300 text-sm">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-yellow-400 hover:text-yellow-300 underline font-semibold"
                >
                  Login Here ✨
                </button>
              </p>
              <p className="text-gray-400 text-xs lg:text-sm">
                By registering, you agree to our{' '}
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

export default Register;
