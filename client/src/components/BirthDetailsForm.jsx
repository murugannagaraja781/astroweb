
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

const BirthDetailsForm = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    year: 1990,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    latitude: 13.0827,
    longitude: 80.2707,
    timezone: 5.5
  });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        year: user.birthDetails?.year || 1990,
        month: user.birthDetails?.month || 1,
        day: user.birthDetails?.day || 1,
        hour: user.birthDetails?.hour || 12,
        minute: user.birthDetails?.minute || 0,
        latitude: user.birthDetails?.latitude || 13.0827,
        longitude: user.birthDetails?.longitude || 80.2707,
        timezone: user.birthDetails?.timezone || 5.5
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'name' ? value : parseFloat(value) || value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: formData.name,
        birthDetails: {
          year: parseInt(formData.year),
          month: parseInt(formData.month),
          day: parseInt(formData.day),
          hour: parseInt(formData.hour),
          minute: parseInt(formData.minute),
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          timezone: parseFloat(formData.timezone)
        }
      };

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/auth/profile/update`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      addToast('Profile updated successfully', 'success');
      if (onUpdate) onUpdate(res.data);
    } catch (error) {
        console.error("Update error", error);
        addToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Personal & Birth Details</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-200 outline-none"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Year</label>
          <input type="number" name="year" value={formData.year} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Month</label>
          <input type="number" name="month" value={formData.month} onChange={handleChange} min="1" max="12" className="w-full px-4 py-2 border rounded-lg outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Day</label>
          <input type="number" name="day" value={formData.day} onChange={handleChange} min="1" max="31" className="w-full px-4 py-2 border rounded-lg outline-none" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Hour (0-23)</label>
          <input type="number" name="hour" value={formData.hour} onChange={handleChange} min="0" max="23" className="w-full px-4 py-2 border rounded-lg outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Minute</label>
          <input type="number" name="minute" value={formData.minute} onChange={handleChange} min="0" max="59" className="w-full px-4 py-2 border rounded-lg outline-none" required />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Lat</label>
          <input type="number" name="latitude" value={formData.latitude} onChange={handleChange} step="0.0001" className="w-full px-4 py-2 border rounded-lg outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Lon</label>
          <input type="number" name="longitude" value={formData.longitude} onChange={handleChange} step="0.0001" className="w-full px-4 py-2 border rounded-lg outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Timezone</label>
          <input type="number" name="timezone" value={formData.timezone} onChange={handleChange} step="0.5" className="w-full px-4 py-2 border rounded-lg outline-none" required />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Save Profile'}
      </button>
    </form>
  );
};

export default BirthDetailsForm;
