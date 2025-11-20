import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'client' });
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { name, email, password, role } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    try {
      await register(name, email, password, role);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Registration failed');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-light">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-border w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-black">Register</h2>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input type="text" name="name" value={name} onChange={onChange} className="w-full p-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">{t('email')}</label>
            <input type="email" name="email" value={email} onChange={onChange} className="w-full p-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">{t('password')}</label>
            <input type="password" name="password" value={password} onChange={onChange} className="w-full p-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">{t('role')}</label>
            <select name="role" value={role} onChange={onChange} className="w-full p-2 border rounded">
              <option value="client">{t('client')}</option>
              <option value="astrologer">{t('astrologer')}</option>
            </select>
          </div>
          <button type="submit" style={{background:'red',color:'white',borderRadius:'5px',padding:'10px 20px',cursor:'pointer'}}>{t('register')}</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
