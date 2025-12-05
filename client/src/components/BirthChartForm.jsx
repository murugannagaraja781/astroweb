import { useState, useEffect } from 'react';
import axios from 'axios';
import { City } from 'country-state-city';
import BirthChartDisplay from './BirthChartDisplay';

const BirthChartForm = ({ onClose, initialData }) => {
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

  useEffect(() => {
    if (initialData) {
       // Parse Date: YYYY-MM-DD
       if (initialData.dateOfBirth) {
           const [y, m, d] = initialData.dateOfBirth.split('-').map(Number);
           setFormData(prev => ({ ...prev, year: y, month: m, day: d }));
       }
       // Parse Time: HH:mm
       if (initialData.timeOfBirth) {
           const [h, min] = initialData.timeOfBirth.split(':').map(Number);
           setFormData(prev => ({ ...prev, hour: h, minute: min }));
       }
       // Location (if lat/long provided)
       if (initialData.latitude && initialData.longitude) {
           setFormData(prev => ({
               ...prev,
               latitude: parseFloat(initialData.latitude),
               longitude: parseFloat(initialData.longitude)
           }));
           // Also set city search text if name avail
           if(initialData.placeOfBirth) {
              setCitySearch(initialData.placeOfBirth);
           }
       }
    }
  }, [initialData]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState(null);

  // City Search State
  const [citySearch, setCitySearch] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Handle City Search
  const handleCitySearch = (e) => {
    const value = e.target.value;
    setCitySearch(value);

    if (value.length > 2) {
      // Filter Indian cities
      const cities = City.getCitiesOfCountry('IN');
      const filtered = cities.filter(city =>
        city.name.toLowerCase().startsWith(value.toLowerCase())
      ).slice(0, 5); // Limit to 5 results for speed
      setCitySuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setCitySuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Select City
  const selectCity = (city) => {
    setFormData(prev => ({
      ...prev,
      latitude: parseFloat(city.latitude),
      longitude: parseFloat(city.longitude)
    }));
    setCitySearch(city.name);
    setShowSuggestions(false);
  };

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
    return <BirthChartDisplay data={chartData} formData={formData} onBack={() => setChartData(null)} onClose={onClose} />;
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

          {/* City Search */}
          <div className="mb-4 relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Search City (India)
            </label>
            <input
              type="text"
              value={citySearch}
              onChange={handleCitySearch}
              placeholder="Type city name (e.g., Chennai)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && citySuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {citySuggestions.map((city, index) => (
                  <div
                    key={`${city.name}-${index}`}
                    onClick={() => selectCity(city)}
                    className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <div className="font-semibold text-gray-800">{city.name}</div>
                    <div className="text-xs text-gray-500">
                      {city.stateCode}, India • Lat: {city.latitude}, Long: {city.longitude}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                step="0.0001"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                step="0.0001"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none"
                required
              />
            </div>
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
