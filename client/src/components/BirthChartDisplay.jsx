import { useState } from 'react';
import { Download, Share2, Globe } from 'lucide-react';

const BirthChartDisplay = ({ data, onBack, onClose }) => {
  const [language, setLanguage] = useState('tamil'); // Default to Tamil
  const [showNavamsa, setShowNavamsa] = useState(false); // Toggle between Rasi and Navamsa

  // Safety check
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3 justify-between">
          <button onClick={onBack} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors">← Back</button>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-700 mb-2">No Chart Data</h3>
          <p className="text-red-600">Unable to display chart. Please try again.</p>
        </div>
      </div>
    );
  }

  const { houses, planets, lagna, moonSign, moonNakshatra, ascendant, ayanamsa, birthData, positions, rawPlanets } = data;

  // Translations
  const translations = {
    english: {
      title: 'Birth Chart',
      details: 'Birth Details',
      date: 'Date',
      time: 'Time',
      lagna: 'Lagna (Asc)',
      moonSign: 'Moon Sign',
      nakshatra: 'Nakshatra',
      ayanamsa: 'Ayanamsa',
      planetaryPositions: 'Planetary Positions',
      planet: 'Planet',
      sign: 'Sign',
      degree: 'Degree',
      house: 'House',
      southIndian: 'South Indian Style',
      northIndian: 'North Indian Style',
      download: 'Download PDF',
      back: 'Back',
      done: 'Done',
      rasi: 'Rasi',
      amsam: 'Amsam'
    },
    tamil: {
      title: 'ஜாதக கட்டம்',
      details: 'பிறப்பு விவரங்கள்',
      date: 'தேதி',
      time: 'நேரம்',
      lagna: 'லக்னம்',
      moonSign: 'ராசி',
      nakshatra: 'நட்சத்திரம்',
      ayanamsa: 'அயனாம்சம்',
      planetaryPositions: 'கிரக நிலைகள்',
      planet: 'கிரகம்',
      sign: 'ராசி',
      degree: 'பாகை',
      house: 'பாவம்',
      southIndian: 'தென்னிந்திய முறை',
      northIndian: 'வடஇந்திய முறை',
      download: 'பதிவிறக்கம்',
      back: 'பின்செல்',
      done: 'முடிந்தது',
      rasi: 'ராசி',
      amsam: 'அம்சம்'
    },
    hindi: {
      title: 'जन्म कुंडली',
      details: 'जन्म विवरण',
      date: 'तारीख',
      time: 'समय',
      lagna: 'लग्न',
      moonSign: 'चंद्र राशि',
      nakshatra: 'नक्षत्र',
      ayanamsa: 'अयनांश',
      planetaryPositions: 'ग्रह स्थिति',
      planet: 'ग्रह',
      sign: 'राशि',
      degree: 'अंश',
      house: 'भाव',
      southIndian: 'दक्षिण भारतीय शैली',
      northIndian: 'उत्तर भारतीय शैली',
      download: 'डाउनलोड',
      back: 'वापस',
      done: 'हो गया',
      rasi: 'राशि',
      amsam: 'अंश'
    }
  };

  const t = translations[language];

  // Planet Symbols
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

  // Planet Names
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

  // Rashi Names
  const rashiNamesList = [
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

  // Helper to get translated planet name
  const getPlanetName = (planet) => planetNames[planet]?.[language] || planet;

  // Helper to get translated rashi name
  const getRashiName = (longitude) => {
    if (typeof longitude !== 'number') return 'N/A';
    const index = Math.floor(longitude / 30);
    return rashiNamesList[index]?.[language] || 'N/A';
  };

  // Helper to format degrees
  const formatDegree = (longitude) => {
    if (typeof longitude !== 'number') return 'N/A';
    const degree = longitude % 30;
    const minutes = Math.floor((degree % 1) * 60);
    const wholeDegree = Math.floor(degree);
    return `${wholeDegree}°${minutes}'`;
  };

  // Organize planets by Sign (Rashi) for South Indian Chart
  // South Indian chart has fixed signs. We need to know which planets are in which sign.
  const planetsBySign = Array(12).fill(null).map(() => []);

  if (positions) {
    Object.entries(positions).forEach(([planet, data]) => {
      const signIndex = Math.floor(data.longitude / 30);
      if (signIndex >= 0 && signIndex < 12) {
        planetsBySign[signIndex].push(planet);
      }
    });
  }

  // Calculate Ascendant Sign Index
  const ascendantSignIndex = ascendant ? Math.floor(ascendant / 30) : -1;

  // Calculate Navamsa (D9) positions
  const calculateNavamsa = (longitude) => {
    // Each sign is divided into 9 parts (Navamsa)
    // Each Navamsa is 3°20' (3.333...)
    const sign = Math.floor(longitude / 30);
    const degreeInSign = longitude % 30;
    const navamsaNumber = Math.floor(degreeInSign / (30 / 9)); // 0-8

    // Navamsa calculation based on sign type
    // Movable signs (0,3,6,9): Start from same sign
    // Fixed signs (1,4,7,10): Start from 9th sign
    // Dual signs (2,5,8,11): Start from 5th sign
    let navamsaSign;
    if ([0, 3, 6, 9].includes(sign)) {
      // Movable: Aries, Cancer, Libra, Capricorn
      navamsaSign = (sign + navamsaNumber) % 12;
    } else if ([1, 4, 7, 10].includes(sign)) {
      // Fixed: Taurus, Leo, Scorpio, Aquarius
      navamsaSign = ((sign + 8) + navamsaNumber) % 12;
    } else {
      // Dual: Gemini, Virgo, Sagittarius, Pisces
      navamsaSign = ((sign + 4) + navamsaNumber) % 12;
    }

    return navamsaSign;
  };

  // Organize planets by Navamsa Sign
  const planetsByNavamsaSign = Array(12).fill(null).map(() => []);

  if (positions) {
    Object.entries(positions).forEach(([planet, data]) => {
      const navamsaSignIndex = calculateNavamsa(data.longitude);
      if (navamsaSignIndex >= 0 && navamsaSignIndex < 12) {
        planetsByNavamsaSign[navamsaSignIndex].push(planet);
      }
    });
  }

  // Calculate Navamsa Ascendant
  const navamsaAscendantIndex = ascendant ? calculateNavamsa(ascendant) : -1;

  // South Indian Chart Grid Layout (Fixed Signs)
  // Row 1: Pisces (11), Aries (0), Taurus (1), Gemini (2)
  // Row 2: Aquarius (10), [Center], Cancer (3)
  // Row 3: Capricorn (9), [Center], Leo (4)
  // Row 4: Sagittarius (8), Scorpio (7), Libra (6), Virgo (5)
  // Note: Array indices are 0-11 (Aries=0)

  const renderSouthIndianCell = (signIndex, isNavamsa = false) => {
    const isAscendant = isNavamsa
      ? signIndex === navamsaAscendantIndex
      : signIndex === ascendantSignIndex;
    const planetsInSign = isNavamsa
      ? planetsByNavamsaSign[signIndex]
      : planetsBySign[signIndex];

    return (
      <div className={`relative bg-[#FFFEF0] min-h-[100px] sm:min-h-[120px] p-2 sm:p-3 flex flex-col justify-start ${isAscendant ? 'bg-yellow-100' : ''}`}>
        {/* Ascendant Marker - Top Right */}
        {isAscendant && (
          <div className="absolute top-1 right-1 text-red-600 font-bold text-sm">
            {language === 'tamil' ? 'ல' : language === 'hindi' ? 'ल' : 'L'}
          </div>
        )}

        {/* Planets - Each on separate line with degree below */}
        <div className="space-y-1.5">
          {planetsInSign.length > 0 ? (
            planetsInSign.map((planet, idx) => (
              <div key={idx} className="leading-tight">
                <div className="text-blue-700 font-semibold text-xs sm:text-sm flex items-center gap-1">
                  <span>{planetSymbols[planet]}</span>
                  <span>{getPlanetName(planet)}</span>
                </div>
                <div className="text-blue-600 text-[10px] sm:text-xs font-medium ml-4">
                  {formatDegree(positions[planet].longitude)}
                </div>
              </div>
            ))
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex gap-2">
          <button onClick={onBack} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm">
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
            onClick={() => setShowNavamsa(!showNavamsa)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
              showNavamsa
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
            }`}
          >
            {showNavamsa ? (language === 'tamil' ? 'ராசி' : language === 'hindi' ? 'राशि' : 'Rasi') : (language === 'tamil' ? 'நவாம்சம்' : language === 'hindi' ? 'नवांश' : 'Navamsa')}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm shadow-md hover:shadow-lg"
          >
            <Download className="w-4 h-4" />
            {t.download}
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors text-sm">
            {t.done}
          </button>
        </div>
      </div>

      {/* Birth Details Card */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>📜</span> {t.details}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-8 text-sm">
          <div>
            <div className="text-orange-100 text-xs uppercase tracking-wider">{t.date}</div>
            <div className="font-bold text-lg">{birthData?.date}</div>
          </div>
          <div>
            <div className="text-orange-100 text-xs uppercase tracking-wider">{t.time}</div>
            <div className="font-bold text-lg">{birthData?.time}</div>
          </div>
          <div>
            <div className="text-orange-100 text-xs uppercase tracking-wider">{t.lagna}</div>
            <div className="font-bold text-lg">{lagna?.name || 'N/A'}</div>
          </div>
          <div>
            <div className="text-orange-100 text-xs uppercase tracking-wider">{t.moonSign}</div>
            <div className="font-bold text-lg">{moonSign?.name || 'N/A'}</div>
          </div>
          <div>
            <div className="text-orange-100 text-xs uppercase tracking-wider">{t.nakshatra}</div>
            <div className="font-bold text-lg">{moonNakshatra?.name || 'N/A'}</div>
          </div>
          <div>
            <div className="text-orange-100 text-xs uppercase tracking-wider">{t.ayanamsa}</div>
            <div className="font-bold text-lg">{ayanamsa ? `${ayanamsa.toFixed(2)}°` : 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Rasi Chart (South Indian Style) */}
      {!showNavamsa && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-orange-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-2xl">🕉️</span>
            {language === 'tamil' ? 'ராசி கட்டம்' : language === 'hindi' ? 'राशि चक्र' : 'Rasi Chart (D1)'}
          </h3>

          <div className="max-w-2xl mx-auto border-[3px] border-teal-600 bg-[#FFFEF0] shadow-lg">
            <div className="grid grid-cols-4 divide-x divide-y divide-teal-600">
              {/* Row 1 */}
              {renderSouthIndianCell(11, false)} {/* Pisces */}
              {renderSouthIndianCell(0, false)}  {/* Aries */}
              {renderSouthIndianCell(1, false)}  {/* Taurus */}
              {renderSouthIndianCell(2, false)}  {/* Gemini */}

              {/* Row 2 */}
              {renderSouthIndianCell(10, false)} {/* Aquarius */}
              <div className="col-span-2 row-span-2 bg-white flex flex-col items-center justify-center relative overflow-hidden border-teal-600">
                <div className="relative z-10 text-center space-y-2">
                  <div className="text-teal-800 font-bold text-2xl">{language === 'tamil' ? 'ராசி' : language === 'hindi' ? 'राशि' : 'Rasi'}</div>
                  <div className="text-sm font-semibold text-gray-600">{birthData?.date}</div>
                  <div className="text-sm font-semibold text-gray-600">{birthData?.time}</div>
                </div>
              </div>
              {renderSouthIndianCell(3, false)}  {/* Cancer */}

              {/* Row 3 */}
              {renderSouthIndianCell(9, false)}  {/* Capricorn */}
              {renderSouthIndianCell(4, false)}  {/* Leo */}

              {/* Row 4 */}
              {renderSouthIndianCell(8, false)}  {/* Sagittarius */}
              {renderSouthIndianCell(7, false)}  {/* Scorpio */}
              {renderSouthIndianCell(6, false)}  {/* Libra */}
              {renderSouthIndianCell(5, false)}  {/* Virgo */}
            </div>
          </div>
        </div>
      )}

      {/* Navamsa Chart (D9) - South Indian Style */}
      {showNavamsa && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-purple-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            {language === 'tamil' ? 'நவாம்சம் கட்டம்' : language === 'hindi' ? 'नवांश चक्र' : 'Navamsa Chart (D9)'}
          </h3>

          <div className="max-w-2xl mx-auto border-[3px] border-teal-600 bg-[#FFFEF0] shadow-lg">
            <div className="grid grid-cols-4 divide-x divide-y divide-teal-600">
              {/* Row 1 */}
              {renderSouthIndianCell(11, true)} {/* Pisces */}
              {renderSouthIndianCell(0, true)}  {/* Aries */}
              {renderSouthIndianCell(1, true)}  {/* Taurus */}
              {renderSouthIndianCell(2, true)}  {/* Gemini */}

              {/* Row 2 */}
              {renderSouthIndianCell(10, true)} {/* Aquarius */}
              <div className="col-span-2 row-span-2 bg-white flex flex-col items-center justify-center relative overflow-hidden border-teal-600">
                <div className="relative z-10 text-center space-y-2">
                  <div className="text-teal-800 font-bold text-2xl">{language === 'tamil' ? 'அம்சம்' : language === 'hindi' ? 'अंश' : 'Amsam'}</div>
                  <div className="text-sm font-semibold text-gray-600">{birthData?.date}</div>
                  <div className="text-sm font-semibold text-gray-600">{birthData?.time}</div>
                </div>
              </div>
              {renderSouthIndianCell(3, true)}  {/* Cancer */}

              {/* Row 3 */}
              {renderSouthIndianCell(9, true)}  {/* Capricorn */}
              {renderSouthIndianCell(4, true)}  {/* Leo */}

              {/* Row 4 */}
              {renderSouthIndianCell(8, true)}  {/* Sagittarius */}
              {renderSouthIndianCell(7, true)}  {/* Scorpio */}
              {renderSouthIndianCell(6, true)}  {/* Libra */}
              {renderSouthIndianCell(5, true)}  {/* Virgo */}
            </div>
          </div>
        </div>
      )}

      {/* Planetary Positions Table */}
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
                <th className="py-3 px-4">{t.house}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {positions && Object.entries(positions).map(([planetName, planetData], idx) => {
                const houseNum = rawPlanets?.[planetName]?.house || '-';
                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-blue-700">
                      {getPlanetName(planetName)}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {getRashiName(planetData.longitude)}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600">
                      {formatDegree(planetData.longitude)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                        {houseNum}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Houses */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          {t.house} {t.details}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {houses && Object.entries(houses).map(([houseNum, rashiData]) => (
            <div key={houseNum} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200">
              <div className="text-xs text-blue-600 font-semibold mb-1">{t.house} {houseNum}</div>
              <div className="font-bold text-gray-800">{rashiData?.name || 'N/A'}</div>
              <div className="text-xs text-gray-600 mt-1">{rashiData?.lord || ''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Visualization - North Indian Style */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          {t.northIndian}
        </h3>

        <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto">
          {/* Row 1: Houses 12, 1, 2, 3 */}
          <div className="aspect-square border-2 border-purple-400 rounded-lg p-1 bg-purple-50 flex flex-col justify-between text-center">
            <div className="text-[10px] font-bold text-purple-700">12</div>
            <div className="text-xs">{Array.isArray(planets?.[12]) ? planets[12].map(p => planetSymbols[p] || p).join(' ') : ''}</div>
            <div className="text-[9px] text-gray-600">{houses?.[12]?.name || ''}</div>
          </div>
          <div className="aspect-square border-2 border-pink-400 rounded-lg p-1 bg-gradient-to-br from-pink-100 to-purple-100 flex flex-col justify-between text-center">
            <div className="text-[10px] font-bold text-pink-700">1 (ASC)</div>
            <div className="text-xs font-bold">{Array.isArray(planets?.[1]) ? planets[1].map(p => planetSymbols[p] || p).join(' ') : ''}</div>
            <div className="text-[9px] text-gray-700 font-semibold">{lagna?.name || houses?.[1]?.name || ''}</div>
          </div>
          <div className="aspect-square border-2 border-purple-400 rounded-lg p-1 bg-purple-50 flex flex-col justify-between text-center">
            <div className="text-[10px] font-bold text-purple-700">2</div>
            <div className="text-xs">{Array.isArray(planets?.[2]) ? planets[2].map(p => planetSymbols[p] || p).join(' ') : ''}</div>
            <div className="text-[9px] text-gray-600">{houses?.[2]?.name || ''}</div>
          </div>
          <div className="aspect-square border-2 border-purple-400 rounded-lg p-1 bg-purple-50 flex flex-col justify-between text-center">
            <div className="text-[10px] font-bold text-purple-700">3</div>
            <div className="text-xs">{Array.isArray(planets?.[3]) ? planets[3].map(p => planetSymbols[p] || p).join(' ') : ''}</div>
            <div className="text-[9px] text-gray-600">{houses?.[3]?.name || ''}</div>
          </div>

          {/* Row 2: Houses 11, empty, empty, 4 */}
          <div className="aspect-square border-2 border-purple-400 rounded-lg p-1 bg-purple-50 flex flex-col justify-between text-center">
            <div className="text-[10px] font-bold text-purple-700">11</div>
            <div className="text-xs">{Array.isArray(planets?.[11]) ? planets[11].map(p => planetSymbols[p] || p).join(' ') : ''}</div>
            <div className="text-[9px] text-gray-600">{houses?.[11]?.name || ''}</div>
          </div>
          <div className="aspect-square border border-gray-300 bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs font-bold text-purple-700">Rasi</div>
              <div className="text-xs text-gray-600">Chart</div>
            </div>
          </div>
          <div className="aspect-square border border-gray-300 bg-gray-50"></div>
          <div className="aspect-square border-2 border-purple-400 rounded-lg p-1 bg-purple-50 flex flex-col justify-between text-center">
            <div className="text-[10px] font-bold text-purple-700">4</div>
            <div className="text-xs">{Array.isArray(planets?.[4]) ? planets[4].map(p => planetSymbols[p] || p).join(' ') : ''}</div>
            <div className="text-[9px] text-gray-600">{houses?.[4]?.name || ''}</div>
          </div>

          {/* Row 3: Houses 10, empty, empty, 5 */}
          <div className="aspect-square border-2 border-purple-400 rounded-lg p-1 bg-purple-50 flex flex-col justify-between text-center">
            <div className="text-[10px] font-bold text-purple-700">10</div>
            <div className="text-xs">{Array.isArray(planets?.[10]) ? planets[10].map(p => planetSymbols[p] || p).join(' ') : ''}</div>
            <div className="text-[9px] text-gray-600">{houses?.[10]?.name || ''}</div>
          </div>
          <div className="aspect-square border border-gray-300 bg-gray-50"></div>
          <div className="aspect-square border border-gray-300 bg-gray-50"></div>
          <div className="aspect-square border-2 border-purple-400 rounded-lg p-1 bg-purple-50 flex flex-col justify-between text-center">
            <div className="text-[10px] font-bold text-purple-700">5</div>
            <div className="text-xs">{Array.isArray(planets?.[5]) ? planets[5].map(p => planetSymbols[p] || p).join(' ') : ''}</div>
            <div className="text-[9px] text-gray-600">{houses?.[5]?.name || ''}</div>
          </div>

          {/* Row 4: Houses 9, 8, 7, 6 */}
          <div className="aspect-square border-2 border-purple-400 rounded-lg p-1 bg-purple-50 flex flex-col justify-between text-center">
            <div className="text-[10px] font-bold text-purple-700">9</div>
            <div className="text-xs">{Array.isArray(planets?.[9]) ? planets[9].map(p => planetSymbols[p] || p).join(' ') : ''}</div>
            <div className="text-[9px] text-gray-600">{houses?.[9]?.name || ''}</div>
          </div>
          <div className="aspect-square border-2 border-purple-400 rounded-lg p-1 bg-purple-50 flex flex-col justify-between text-center">
            <div className="text-[10px] font-bold text-purple-700">8</div>
            <div className="text-xs">{Array.isArray(planets?.[8]) ? planets[8].map(p => planetSymbols[p] || p).join(' ') : ''}</div>
            <div className="text-[9px] text-gray-600">{houses?.[8]?.name || ''}</div>
          </div>
          <div className="aspect-square border-2 border-purple-400 rounded-lg p-1 bg-purple-50 flex flex-col justify-between text-center">
            <div className="text-[10px] font-bold text-purple-700">7</div>
            <div className="text-xs">{Array.isArray(planets?.[7]) ? planets[7].map(p => planetSymbols[p] || p).join(' ') : ''}</div>
            <div className="text-[9px] text-gray-600">{houses?.[7]?.name || ''}</div>
          </div>
          <div className="aspect-square border-2 border-purple-400 rounded-lg p-1 bg-purple-50 flex flex-col justify-between text-center">
            <div className="text-[10px] font-bold text-purple-700">6</div>
            <div className="text-xs">{Array.isArray(planets?.[6]) ? planets[6].map(p => planetSymbols[p] || p).join(' ') : ''}</div>
            <div className="text-[9px] text-gray-600">{houses?.[6]?.name || ''}</div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center space-y-1">
          <div>💡 North Indian Chart Style (Diamond Layout)</div>
          <div className="text-[10px]">
            <span className="font-semibold">Legend:</span> House Number | Planets | Sign Name
          </div>
        </div>
      </div>
    </div>
  );
};

export default BirthChartDisplay;
