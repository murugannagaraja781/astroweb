import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { email, password } = formData;

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

  return (
    <div className="flex justify-center items-center min-h-screen bg-light">
      <form onSubmit={onSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-border w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-black">Login</h2>
        <div className="mb-4">
          <label className="block text-gray-700">{t('email')}</label>
          <input type="email" name="email" value={email} onChange={onChange} className="w-full p-2 border rounded" required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">{t('password')}</label>
          <input type="password" name="password" value={password} onChange={onChange} className="w-full p-2 border rounded" required />
        </div>
          <button type="submit" style={{background:'red',color:'white'}}>{t('login')}</button>
      </form>
    </div>
  );
};

export default Login;
