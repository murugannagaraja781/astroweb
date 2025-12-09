import { useState } from 'react';
import axios from 'axios';

const PoruthamForm = ({ onClose, initialData }) => {
  const [person1, setPerson1] = useState({
    name: '',
    gender: 'male',
    year: initialData?.year || 1990,
    month: initialData?.month || 1,
    day: initialData?.day || 1,
    hour: initialData?.hour !== undefined ? initialData.hour : 12,
    minute: initialData?.minute !== undefined ? initialData.minute : 0,
    latitude: initialData?.latitude || 13.0827,
    longitude: initialData?.longitude || 80.2707,
    timezone: initialData?.timezone || 5.5
  });

  const [person2, setPerson2] = useState({
    name: '',
    gender: 'female',
    year: 1992,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    latitude: 12.9716,
    longitude: 77.5946,
    timezone: 5.5
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handlePerson1Change = (e) => {
    const { name, value } = e.target;
    setPerson1(prev => ({
      ...prev,
      [name]: name === 'name' || name === 'gender' ? value : parseFloat(value) || value
    }));
  };

  const handlePerson2Change = (e) => {
    const { name, value } = e.target;
    setPerson2(prev => ({
      ...prev,
      [name]: name === 'name' || name === 'gender' ? value : parseFloat(value) || value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/charts/porutham`,
        { person1, person2 },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setResult(response.data.data);
      } else {
        setError('Failed to calculate porutham');
      }
    } catch (err) {
      console.error('Porutham calculation error:', err);
      setError(err.response?.data?.error || 'Failed to calculate compatibility');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3 justify-between">
          <button
            onClick={() => setResult(null)}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
          >
            ✓ Done
          </button>
        </div>

        {/* Compatibility Score */}
        <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-2xl p-8 shadow-lg text-center">
          <h3 className="text-2xl font-bold mb-4">💑 Compatibility Score</h3>
          <div className="text-6xl font-bold mb-2">{result.compatibility?.percentage || 'N/A'}%</div>
          <p className="text-pink-100">{result.compatibility?.verdict || 'Compatibility analysis complete'}</p>
        </div>

        {/* Porutham Details */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Detailed Porutham Analysis
          </h3>

          {result.poruthams && result.poruthams.length > 0 ? (
            <div className="space-y-3">
              {result.poruthams.map((porutham, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-4 border-2 ${
                    porutham.isCompatible
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-gray-800">{porutham.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      porutham.isCompatible
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {porutham.isCompatible ? '✓ Compatible' : '✗ Not Compatible'}
                    </span>
                  </div>
                  {porutham.score !== undefined && (
                    <div className="text-sm text-gray-600 mb-2">
                      Score: {porutham.score}
                    </div>
                  )}
                  {porutham.description && (
                    <p className="text-sm text-gray-700">{porutham.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <pre className="bg-gray-50 rounded-lg p-4 overflow-auto text-left text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Person 1 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">👨</span>
            Person 1 Details
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={person1.name}
                  onChange={handlePerson1Change}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={person1.gender}
                  onChange={handlePerson1Change}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                <input
                  type="number"
                  name="year"
                  value={person1.year}
                  onChange={handlePerson1Change}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
                <input
                  type="number"
                  name="month"
                  value={person1.month}
                  onChange={handlePerson1Change}
                  min="1"
                  max="12"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Day</label>
                <input
                  type="number"
                  name="day"
                  value={person1.day}
                  onChange={handlePerson1Change}
                  min="1"
                  max="31"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hour</label>
                <input
                  type="number"
                  name="hour"
                  value={person1.hour}
                  onChange={handlePerson1Change}
                  min="0"
                  max="23"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Minute</label>
                <input
                  type="number"
                  name="minute"
                  value={person1.minute}
                  onChange={handlePerson1Change}
                  min="0"
                  max="59"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
                <input
                  type="number"
                  name="latitude"
                  value={person1.latitude}
                  onChange={handlePerson1Change}
                  step="0.0001"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
                <input
                  type="number"
                  name="longitude"
                  value={person1.longitude}
                  onChange={handlePerson1Change}
                  step="0.0001"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Person 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">👩</span>
            Person 2 Details
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={person2.name}
                  onChange={handlePerson2Change}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={person2.gender}
                  onChange={handlePerson2Change}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                <input
                  type="number"
                  name="year"
                  value={person2.year}
                  onChange={handlePerson2Change}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Month</label>
                <input
                  type="number"
                  name="month"
                  value={person2.month}
                  onChange={handlePerson2Change}
                  min="1"
                  max="12"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Day</label>
                <input
                  type="number"
                  name="day"
                  value={person2.day}
                  onChange={handlePerson2Change}
                  min="1"
                  max="31"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hour</label>
                <input
                  type="number"
                  name="hour"
                  value={person2.hour}
                  onChange={handlePerson2Change}
                  min="0"
                  max="23"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Minute</label>
                <input
                  type="number"
                  name="minute"
                  value={person2.minute}
                  onChange={handlePerson2Change}
                  min="0"
                  max="59"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
                <input
                  type="number"
                  name="latitude"
                  value={person2.latitude}
                  onChange={handlePerson2Change}
                  step="0.0001"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
                <input
                  type="number"
                  name="longitude"
                  value={person2.longitude}
                  onChange={handlePerson2Change}
                  step="0.0001"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all outline-none"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Calculating Compatibility...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>💑</span>
              Calculate Porutham
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

export default PoruthamForm;
