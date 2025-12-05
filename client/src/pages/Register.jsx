import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-8 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-3xl">✨</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-4">Registration Closed</h1>
        <p className="text-gray-300 mb-8">
          We are currently not accepting new registrations via email. Please use OTP login to access your account.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default Register;
