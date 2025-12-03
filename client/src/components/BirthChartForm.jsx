import { useState } from 'react';
import axios from 'axios';
import BirthChartDisplay from './BirthChartDisplay';

const BirthChartForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    hour: 12,
    minute: 0,
    latitude: 13.0827,
    longitude: 80.2707,
    timezone: 5.5
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/charts/birth-chart`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setChartData(response.data.data);
      } else {
        setError('Failed to generate birth chart');
      }
    } catch (err) {
      console.error('Birth chart error:', err);
      setError(err.response?.data?.error || 'Failed to generate birth chart');
    } finally {
      setLoading(false);
    }
  };

  if (chartData) {
    return <BirthChartDisplay data={chartData} onBack={() => setChartData(null)} onClose={onClose} />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date & Time Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Birth Date & Time
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                min="1900"
                max="2100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
              <input
                type="number"
                name="month"
                value={formData.month}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                min="1"
                max="12"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Day</label>
              <input
                type="number"
                name="day"
                value={formData.day}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                min="1"
                max="31"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hour (24h)</label>
              <input
                type="number"
                name="hour"
                value={formData.hour}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                min="0"
                max="23"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Minute</label>
              <input
                type="number"
                name="minute"
                value={formData.minute}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                min="0"
                max="59"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
              <input
                type="number"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                step="0.5"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📍</span>
            Birth Location
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Latitude
                <span className="text-xs text-gray-500 ml-1">(e.g., 13.0827 for Chennai)</span>
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                step="0.0001"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Longitude
                <span className="text-xs text-gray-500 ml-1">(e.g., 80.2707 for Chennai)</span>
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                step="0.0001"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500 bg-purple-50 p-3 rounded-lg">
            💡 Use <a href="https://www.latlong.net/" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline">latlong.net</a> to find coordinates
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Chart...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🌟</span>
              Generate Birth Chart
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

export default BirthChartForm;
