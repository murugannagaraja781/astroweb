import { useState } from 'react';
import axios from 'axios';
import { Download, Globe } from 'lucide-react';

const NavamsaChartForm = ({ onClose, initialData }) => {
  // Navamsa uses same form as birth chart, so we can reuse BirthChartForm
  // but point to different API endpoint

  const [formData, setFormData] = useState({
    year: initialData?.year || new Date().getFullYear(),
    month: initialData?.month || new Date().getMonth() + 1,
    day: initialData?.day || new Date().getDate(),
    hour: initialData?.hour !== undefined ? initialData.hour : 12,
    minute: initialData?.minute !== undefined ? initialData.minute : 0,
    latitude: initialData?.latitude || 13.0827,
    longitude: initialData?.longitude || 80.2707,
    timezone: initialData?.timezone || 5.5
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
        `${import.meta.env.VITE_API_URL}/api/charts/navamsa`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setChartData(response.data.data);
      } else {
        setError('Failed to generate navamsa chart');
      }
    } catch (err) {
      console.error('Navamsa chart error:', err);
      setError(err.response?.data?.error || 'Failed to generate navamsa chart');
    } finally {
      setLoading(false);
    }
  };

  const [language, setLanguage] = useState('tamil');

  // Translations
  const translations = {
    english: {
      title: 'Navamsa Chart (D9)',
      back: 'Back',
      done: 'Done',
      download: 'Download',
      birthDetails: 'Birth Details',
      date: 'Date',
      time: 'Time',
      place: 'Place',
      ascendant: 'Navamsa Lagna',
      planetaryPositions: 'Planetary Positions in Navamsa',
      planet: 'Planet',
      sign: 'Sign',
      degree: 'Degree'
    },
    tamil: {
      title: 'நவாம்சம் கட்டம் (D9)',
      back: 'பின்செல்',
      done: 'முடிந்தது',
      download: 'பதிவிறக்கம்',
      birthDetails: 'பிறப்பு விவரங்கள்',
      date: 'தேதி',
      time: 'நேரம்',
      place: 'இடம்',
      ascendant: 'நவாம்ச லக்னம்',
      planetaryPositions: 'நவாம்சத்தில் கிரக நிலைகள்',
      planet: 'கிரகம்',
      sign: 'ராசி',
      degree: 'பாகை'
    },
    hindi: {
      title: 'नवांश चक्र (D9)',
      back: 'वापस',
      done: 'हो गया',
      download: 'डाउनलोड',
      birthDetails: 'जन्म विवरण',
      date: 'तारीख',
      time: 'समय',
      place: 'स्थान',
      ascendant: 'नवांश लग्न',
      planetaryPositions: 'नवांश में ग्रह स्थिति',
      planet: 'ग्रह',
      sign: 'राशि',
      degree: 'अंश'
    }
  };

  const t = translations[language];

  // Planet symbols and names
  const planetSymbols = {
    Sun: '☉',
    Moon: '☽',
    Mars: '♂',
    Mercury: '☿',
    Jupiter: '♃',
    Venus: '♀',
    Saturn: '♄',
    Rahu: '☊',
    Ketu: '☋'
  };

  const planetNames = {
    Sun: { english: 'Sun', tamil: 'சூரியன்', hindi: 'सूर्य' },
    Moon: { english: 'Moon', tamil: 'சந்திரன்', hindi: 'चंद्र' },
    Mars: { english: 'Mars', tamil: 'செவ்வாய்', hindi: 'मंगल' },
    Mercury: { english: 'Mercury', tamil: 'புதன்', hindi: 'बुध' },
    Jupiter: { english: 'Jupiter', tamil: 'குரு', hindi: 'गुरु' },
    Venus: { english: 'Venus', tamil: 'சுக்கிரன்', hindi: 'शुक्र' },
    Saturn: { english: 'Saturn', tamil: 'சனி', hindi: 'शनि' },
    Rahu: { english: 'Rahu', tamil: 'ராகு', hindi: 'राहु' },
    Ketu: { english: 'Ketu', tamil: 'கேது', hindi: 'केतु' }
  };

  const rashiNames = [
    { english: 'Aries', tamil: 'மேஷம்', hindi: 'मेष' },
    { english: 'Taurus', tamil: 'ரிஷபம்', hindi: 'वृषभ' },
    { english: 'Gemini', tamil: 'மிதுனம்', hindi: 'मिथुन' },
    { english: 'Cancer', tamil: 'கடகம்', hindi: 'कर्क' },
    { english: 'Leo', tamil: 'சிம்மம்', hindi: 'सिंह' },
    { english: 'Virgo', tamil: 'கன்னி', hindi: 'कन्या' },
    { english: 'Libra', tamil: 'துலாம்', hindi: 'तुला' },
    { english: 'Scorpio', tamil: 'விருச்சிகம்', hindi: 'वृश्चिक' },
    { english: 'Sagittarius', tamil: 'தனுசு', hindi: 'धनु' },
    { english: 'Capricorn', tamil: 'மகரம்', hindi: 'मकर' },
    { english: 'Aquarius', tamil: 'கும்பம்', hindi: 'कुंभ' },
    { english: 'Pisces', tamil: 'மீனம்', hindi: 'मीन' }
  ];

  const getPlanetName = (planet) => planetNames[planet]?.[language] || planet;
  const getRashiName = (signIndex) => rashiNames[signIndex]?.[language] || 'N/A';

  const formatDegree = (longitude) => {
    if (typeof longitude !== 'number') return 'N/A';
    const degree = longitude % 30;
    const minutes = Math.floor((degree % 1) * 60);
    const wholeDegree = Math.floor(degree);
    return `${wholeDegree}°${minutes}'`;
  };

  // Organize planets by Navamsa sign
  const organizePlanetsBySign = () => {
    const planetsBySign = Array(12).fill(null).map(() => []);

    // Handle different API response structures
    const navamsaData = chartData?.navamsaChart || chartData;
    const positions = navamsaData?.planets || navamsaData?.navamsaPositions || {};

    console.log('Navamsa Chart Data:', chartData);
    console.log('Navamsa Positions:', positions);

    if (positions && typeof positions === 'object') {
      Object.entries(positions).forEach(([planet, data]) => {
        // Handle different data structures
        let signIndex, longitude;

        if (typeof data === 'object') {
          signIndex = data?.sign !== undefined ? data.sign :
                     data?.navamsaSign !== undefined ? data.navamsaSign :
                     Math.floor((data?.longitude || data?.navamsaLongitude || 0) / 30);
          longitude = data?.longitude || data?.navamsaLongitude || 0;
        } else if (typeof data === 'number') {
          // If data is just a number (longitude)
          signIndex = Math.floor(data / 30);
          longitude = data;
        }

        if (signIndex >= 0 && signIndex < 12 && longitude !== undefined) {
          planetsBySign[signIndex].push({
            name: planet,
            longitude: longitude
          });
        }
      });
    }

    return planetsBySign;
  };

  const renderNavamsaCell = (signIndex) => {
    const planetsBySign = organizePlanetsBySign();

    // Get Navamsa Lagna from different possible locations
    const navamsaData = chartData?.navamsaChart || chartData;
    const lagnaData = navamsaData?.lagna || navamsaData?.navamsaLagna || navamsaData?.ascendant;

    let navamsaLagnaSign = -1;
    if (typeof lagnaData === 'object') {
      navamsaLagnaSign = lagnaData?.sign !== undefined ? lagnaData.sign : Math.floor((lagnaData?.longitude || 0) / 30);
    } else if (typeof lagnaData === 'number') {
      navamsaLagnaSign = Math.floor(lagnaData / 30);
    }

    const isLagna = navamsaLagnaSign === signIndex;
    const planetsInSign = planetsBySign[signIndex];

    return (
      <div className={`relative bg-[#FFFEF0] min-h-[100px] sm:min-h-[120px] p-2 sm:p-3 flex flex-col justify-start border border-teal-600 ${isLagna ? 'bg-yellow-100' : ''}`}>
        {/* Lagna Marker */}
        {isLagna && (
          <div className="absolute top-1 right-1 text-red-600 font-bold text-sm">
            {language === 'tamil' ? 'ல' : language === 'hindi' ? 'ल' : 'L'}
          </div>
        )}

        {/* Planets */}
        <div className="space-y-1.5">
          {planetsInSign && planetsInSign.length > 0 ? (
            planetsInSign.map((planet, idx) => (
              <div key={idx} className="leading-tight">
                <div className="text-blue-700 font-semibold text-xs sm:text-sm flex items-center gap-1">
                  <span>{planetSymbols[planet.name]}</span>
                  <span>{getPlanetName(planet.name)}</span>
                </div>
                <div className="text-blue-600 text-[10px] sm:text-xs font-medium ml-4">
                  {formatDegree(planet.longitude)}
                </div>
              </div>
            ))
          ) : null}
        </div>
      </div>
    );
  };

  if (chartData) {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={() => setChartData(null)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm"
            >
              {t.back}
            </button>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors text-sm cursor-pointer outline-none focus:ring-2 focus:ring-purple-200"
              >
                <option value="english">English</option>
                <option value="tamil">தமிழ்</option>
                <option value="hindi">हिंदी</option>
              </select>
              <Globe className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm shadow-md hover:shadow-lg"
            >
              <Download className="w-4 h-4" />
              {t.download}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors text-sm"
            >
              {t.done}
            </button>
          </div>
        </div>

        {/* Birth Details Card */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>✨</span> {t.birthDetails}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-8 text-sm">
            <div>
              <div className="text-purple-100 text-xs uppercase tracking-wider">{t.date}</div>
              <div className="font-bold text-lg">{formData.year}-{formData.month}-{formData.day}</div>
            </div>
            <div>
              <div className="text-purple-100 text-xs uppercase tracking-wider">{t.time}</div>
              <div className="font-bold text-lg">{formData.hour}:{String(formData.minute).padStart(2, '0')}</div>
            </div>
            <div>
              <div className="text-purple-100 text-xs uppercase tracking-wider">{t.ascendant}</div>
              <div className="font-bold text-lg">
                {(() => {
                  const navamsaData = chartData?.navamsaChart || chartData;
                  const lagnaData = navamsaData?.lagna || navamsaData?.navamsaLagna || navamsaData?.ascendant;
                  let lagnaSign = -1;

                  if (typeof lagnaData === 'object') {
                    lagnaSign = lagnaData?.sign !== undefined ? lagnaData.sign : Math.floor((lagnaData?.longitude || 0) / 30);
                  } else if (typeof lagnaData === 'number') {
                    lagnaSign = Math.floor(lagnaData / 30);
                  }

                  return lagnaSign >= 0 ? getRashiName(lagnaSign) : 'N/A';
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Navamsa Chart - South Indian Style */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-purple-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            {t.title}
          </h3>

          <div className="max-w-2xl mx-auto border-[3px] border-teal-600 bg-[#FFFEF0] shadow-lg">
            <div className="grid grid-cols-4">
              {/* Row 1 */}
              {renderNavamsaCell(11)} {/* Pisces */}
              {renderNavamsaCell(0)}  {/* Aries */}
              {renderNavamsaCell(1)}  {/* Taurus */}
              {renderNavamsaCell(2)}  {/* Gemini */}

              {/* Row 2 */}
              {renderNavamsaCell(10)} {/* Aquarius */}
              <div className="col-span-2 row-span-2 bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center justify-center relative overflow-hidden border-2 border-teal-600">
                <div className="relative z-10 text-center space-y-2 p-4">
                  <div className="text-purple-800 font-bold text-2xl">
                    {language === 'tamil' ? 'நவாம்சம்' : language === 'hindi' ? 'नवांश' : 'Navamsa'}
                  </div>
                  <div className="text-sm font-semibold text-gray-600">D9</div>
                  <div className="text-xs text-gray-500">{formData.year}-{formData.month}-{formData.day}</div>
                </div>
              </div>
              {renderNavamsaCell(3)}  {/* Cancer */}

              {/* Row 3 */}
              {renderNavamsaCell(9)}  {/* Capricorn */}
              {renderNavamsaCell(4)}  {/* Leo */}

              {/* Row 4 */}
              {renderNavamsaCell(8)}  {/* Sagittarius */}
              {renderNavamsaCell(7)}  {/* Scorpio */}
              {renderNavamsaCell(6)}  {/* Libra */}
              {renderNavamsaCell(5)}  {/* Virgo */}
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            <div>💡 {language === 'tamil' ? 'தென்னிந்திய முறை நவாம்ச கட்டம்' : language === 'hindi' ? 'दक्षिण भारतीय नवांश चक्र' : 'South Indian Style Navamsa Chart'}</div>
          </div>
        </div>

        {/* Planetary Positions Table */}
        {(() => {
          const navamsaData = chartData?.navamsaChart || chartData;
          const positions = navamsaData?.planets || navamsaData?.navamsaPositions || {};
          const hasPositions = positions && Object.keys(positions).length > 0;

          return hasPositions && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🪐</span>
                {t.planetaryPositions}
              </h3>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 uppercase font-bold">
                    <tr>
                      <th className="py-3 px-4">{t.planet}</th>
                      <th className="py-3 px-4">{t.sign}</th>
                      <th className="py-3 px-4">{t.degree}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Object.entries(positions).map(([planetName, planetData], idx) => {
                      let signIndex, longitude;

                      if (typeof planetData === 'object') {
                        signIndex = planetData?.sign !== undefined ? planetData.sign :
                                   planetData?.navamsaSign !== undefined ? planetData.navamsaSign :
                                   Math.floor((planetData?.longitude || planetData?.navamsaLongitude || 0) / 30);
                        longitude = planetData?.longitude || planetData?.navamsaLongitude || 0;
                      } else if (typeof planetData === 'number') {
                        signIndex = Math.floor(planetData / 30);
                        longitude = planetData;
                      }

                      return (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-medium text-purple-700">
                            <span className="flex items-center gap-2">
                              <span>{planetSymbols[planetName]}</span>
                              <span>{getPlanetName(planetName)}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {signIndex >= 0 ? getRashiName(signIndex) : 'N/A'}
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-600">
                            {longitude !== undefined ? formatDegree(longitude) : 'N/A'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date & Time Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
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
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Navamsa Chart...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>✨</span>
              Generate Navamsa Chart
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

export default NavamsaChartForm;
