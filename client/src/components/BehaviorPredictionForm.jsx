import { useState } from 'react';
import axios from 'axios';
import {
  Brain, Heart, Briefcase, Users, Sparkles, TrendingUp,
  AlertCircle, Star, Target, Zap, Shield, Award, Download
} from 'lucide-react';

const BehaviorPredictionForm = ({ onClose }) => {
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
  const [predictions, setPredictions] = useState(null);

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
        `${import.meta.env.VITE_API_URL}/api/charts/behavior`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setPredictions(response.data.data);
      } else {
        setError('Failed to generate predictions');
      }
    } catch (err) {
      console.error('Behavior prediction error:', err);
      setError(err.response?.data?.error || 'Failed to generate behavior predictions');
    } finally {
      setLoading(false);
    }
  };

  if (predictions) {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header Controls */}
        <div className="flex gap-3 justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
          <button
            onClick={() => setPredictions(null)}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
          >
            ← Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
            >
              ✓ Done
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-white/20 p-4 rounded-full">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-3xl font-bold">Behavior Analysis</h3>
              <p className="text-indigo-100">Comprehensive personality insights based on Vedic astrology</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{predictions.personality?.traits?.dominant?.length || 0}</div>
              <div className="text-xs text-indigo-100">Core Traits</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{predictions.strengths?.length || 0}</div>
              <div className="text-xs text-indigo-100">Strengths</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{predictions.career?.suitableFields?.length || 0}</div>
              <div className="text-xs text-indigo-100">Career Paths</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{predictions.planetaryInfluences?.length || 0}</div>
              <div className="text-xs text-indigo-100">Influences</div>
            </div>
          </div>
        </div>

        {/* Personality Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-100 p-3 rounded-full">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Personality Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Dominant Traits */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-purple-600" />
                <h4 className="font-bold text-purple-900">Dominant Traits</h4>
              </div>
              <div className="space-y-2">
                {predictions.personality?.traits?.dominant?.map((trait, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <span className="text-sm text-gray-700">{trait}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary Traits */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-blue-900">Secondary Traits</h4>
              </div>
              <div className="space-y-2">
                {predictions.personality?.traits?.secondary?.map((trait, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-700">{trait}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hidden Traits */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-indigo-900">Hidden Traits</h4>
              </div>
              <div className="space-y-2">
                {predictions.personality?.traits?.hidden?.map((trait, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                    <span className="text-sm text-gray-700">{trait}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Temperament */}
          <div className="mt-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 border border-purple-200">
            <h4 className="font-bold text-purple-900 mb-3">Temperament Profile</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-purple-700 mb-1">Type</div>
                <div className="font-semibold text-gray-800">{predictions.personality?.temperament?.type}</div>
              </div>
              <div>
                <div className="text-xs text-purple-700 mb-1">Intensity</div>
                <div className="font-semibold text-gray-800">{predictions.personality?.temperament?.intensity}</div>
              </div>
              <div>
                <div className="text-xs text-purple-700 mb-1">Stability</div>
                <div className="font-semibold text-gray-800">{predictions.personality?.temperament?.stability}</div>
              </div>
              <div>
                <div className="text-xs text-purple-700 mb-1">Adaptability</div>
                <div className="font-semibold text-gray-800">{predictions.personality?.temperament?.adaptability}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Strengths</h3>
            </div>
            <div className="space-y-4">
              {predictions.strengths?.map((strength, idx) => (
                <div key={idx} className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-green-900">{strength.area}</span>
                    <span className="text-xs bg-green-200 text-green-800 px-3 py-1 rounded-full font-semibold">
                      {strength.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{strength.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-orange-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-100 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Areas to Improve</h3>
            </div>
            <div className="space-y-4">
              {predictions.weaknesses?.map((weakness, idx) => (
                <div key={idx} className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-orange-900">{weakness.area}</span>
                    <span className="text-xs bg-orange-200 text-orange-800 px-3 py-1 rounded-full font-semibold">
                      {weakness.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{weakness.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Career Analysis */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Career Insights</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Suitable Fields
              </h4>
              <div className="flex flex-wrap gap-2">
                {predictions.career?.suitableFields?.map((field, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                    {field}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Best Roles
              </h4>
              <div className="flex flex-wrap gap-2">
                {predictions.career?.bestRoles?.map((role, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium border border-blue-200">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-xs text-blue-700 mb-1">Work Style</div>
              <div className="font-semibold text-gray-800">{predictions.career?.workStyle}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-xs text-blue-700 mb-1">Leadership</div>
              <div className="font-semibold text-gray-800">{predictions.career?.leadership}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-xs text-blue-700 mb-1">Innovation</div>
              <div className="font-semibold text-gray-800">{predictions.career?.innovation}</div>
            </div>
          </div>
        </div>

        {/* Relationships */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-pink-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Relationship Style</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-pink-50 rounded-lg p-4">
                <div className="text-sm text-pink-700 mb-2 font-semibold">Style</div>
                <div className="text-gray-800">{predictions.relationships?.style}</div>
              </div>
              <div className="bg-pink-50 rounded-lg p-4">
                <div className="text-sm text-pink-700 mb-2 font-semibold">Communication</div>
                <div className="text-gray-800">{predictions.relationships?.communication}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-pink-700 mb-2 font-semibold">Strengths</div>
                <div className="flex flex-wrap gap-2">
                  {predictions.relationships?.strengths?.map((strength, idx) => (
                    <span key={idx} className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm">
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm text-pink-700 mb-2 font-semibold">Compatibility</div>
                <div className="flex flex-wrap gap-2">
                  {predictions.relationships?.compatibility?.map((comp, idx) => (
                    <span key={idx} className="bg-pink-50 text-pink-600 px-3 py-1 rounded-full text-sm border border-pink-200">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emotional & Mental */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Emotional */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 p-3 rounded-full">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Emotional Nature</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(predictions.emotional || {}).map(([key, value], idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-sm font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mental */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-100 p-3 rounded-full">
                <Brain className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Mental Characteristics</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(predictions.mental || {}).map(([key, value], idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-sm font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Physical & Spiritual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Physical */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 p-3 rounded-full">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Physical Attributes</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-green-700 mb-1">Constitution</div>
                <div className="font-semibold text-gray-800">{predictions.physical?.constitution}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-green-700 mb-1">Energy Levels</div>
                <div className="font-semibold text-gray-800">{predictions.physical?.energy}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-green-700 mb-1">Vitality</div>
                <div className="font-semibold text-gray-800">{predictions.physical?.vitality}</div>
              </div>
            </div>
          </div>

          {/* Spiritual */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-yellow-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Sparkles className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Spiritual Inclination</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-xs text-yellow-700 mb-1">Inclination</div>
                <div className="font-semibold text-gray-800">{predictions.spiritual?.inclination}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-xs text-yellow-700 mb-1">Growth</div>
                <div className="font-semibold text-gray-800">{predictions.spiritual?.growth}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3">
                <div className="text-xs text-yellow-700 mb-1">Practices</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {predictions.spiritual?.practices?.map((practice, idx) => (
                    <span key={idx} className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                      {practice}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Planetary Influences */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-2xl">🪐</span>
            Planetary Influences
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left font-bold text-gray-700">Planet</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-700">Sign</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-700">Degree</th>
                  <th className="py-3 px-4 text-left font-bold text-gray-700">Influence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {predictions.planetaryInfluences?.map((influence, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-indigo-700">{influence.planet}</td>
                    <td className="py-3 px-4 text-gray-700">{influence.sign}</td>
                    <td className="py-3 px-4 font-mono text-gray-600">{influence.degree}°</td>
                    <td className="py-3 px-4 text-xs text-gray-600">{influence.influence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100">
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📍</span>
            Birth Location
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Latitude</label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                step="0.0001"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Longitude</label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                step="0.0001"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                required
              />
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
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing Behavior...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>🧠</span>
              Generate Predictions
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

export default BehaviorPredictionForm;
