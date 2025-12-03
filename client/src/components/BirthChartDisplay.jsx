const BirthChartDisplay = ({ data, onBack, onClose }) => {
  // Safety check - if no data, show error message instead of blank screen
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3 justify-between">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
          >
            ← Back
          </button>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-700 mb-2">No Chart Data</h3>
          <p className="text-red-600">Unable to display chart. Please try again.</p>
        </div>
      </div>
    );
  }

  const { houses, planets, lagna, moonSign, moonNakshatra, ascendant, ayanamsa, birthData } = data;

  // Planet symbols
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

  // Rashi names
  const rashiNames = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-3 justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
          >
            🖨️ Print
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
          >
            ✓ Done
          </button>
        </div>
      </div>

      {/* Birth Details Summary */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-3">Birth Chart Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-purple-200">Date</div>
            <div className="font-bold">{birthData?.date}</div>
          </div>
          <div>
            <div className="text-purple-200">Time</div>
            <div className="font-bold">{birthData?.time}</div>
          </div>
          <div>
            <div className="text-purple-200">Lagna (Ascendant)</div>
            <div className="font-bold">{lagna?.name || 'N/A'}</div>
          </div>
          <div>
            <div className="text-purple-200">Moon Sign</div>
            <div className="font-bold">{moonSign?.name || 'N/A'}</div>
          </div>
          <div>
            <div className="text-purple-200">Nakshatra</div>
            <div className="font-bold">{moonNakshatra?.name || 'N/A'}</div>
          </div>
          <div>
            <div className="text-purple-200">Ayanamsa</div>
            <div className="font-bold">{ayanamsa ? `${ayanamsa.toFixed(2)}°` : 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Planetary Positions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">🪐</span>
          Planetary Positions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {planets && Object.entries(planets).map(([house, planetsInHouse]) => {
            // Ensure planetsInHouse is an array
            const planetList = Array.isArray(planetsInHouse) ? planetsInHouse : [];
            if (planetList.length === 0) return null;

            return (
              <div key={house} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <div className="font-bold text-purple-700 mb-2">
                  House {house}
                </div>
                <div className="space-y-1">
                  {planetList.map((planet, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="text-lg">{planetSymbols[planet] || '•'}</span>
                      <span className="font-semibold text-gray-800">{planet}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Houses */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          House Information
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {houses && Object.entries(houses).map(([houseNum, rashiData]) => (
            <div key={houseNum} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200">
              <div className="text-xs text-blue-600 font-semibold mb-1">House {houseNum}</div>
              <div className="font-bold text-gray-800">{rashiData?.name || 'N/A'}</div>
              <div className="text-xs text-gray-600 mt-1">{rashiData?.lord || ''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Visualization - Simple Table */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Birth Chart (Rasi Chart)
        </h3>

        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          {/* Top row - Houses 12, 1, 2 */}
          <div className="aspect-square border-2 border-purple-300 rounded-lg p-2 bg-purple-50 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-purple-700">H12</div>
            <div className="text-lg">{Array.isArray(planets?.[12]) ? planets[12].map(p => planetSymbols[p] || p[0]).join(' ') : '-'}</div>
          </div>
          <div className="aspect-square border-2 border-pink-300 rounded-lg p-2 bg-pink-50 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-pink-700">H1</div>
            <div className="text-lg">{Array.isArray(planets?.[1]) ? planets[1].map(p => planetSymbols[p] || p[0]).join(' ') : '-'}</div>
          </div>
          <div className="aspect-square border-2 border-purple-300 rounded-lg p-2 bg-purple-50 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-purple-700">H2</div>
            <div className="text-lg">{Array.isArray(planets?.[2]) ? planets[2].map(p => planetSymbols[p] || p[0]).join(' ') : '-'}</div>
          </div>

          {/* Middle row - Houses 11, center, 3 */}
          <div className="aspect-square border-2 border-purple-300 rounded-lg p-2 bg-purple-50 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-purple-700">H11</div>
            <div className="text-lg">{Array.isArray(planets?.[11]) ? planets[11].map(p => planetSymbols[p] || p[0]).join(' ') : '-'}</div>
          </div>
          <div className="aspect-square border-2 border-gradient-to-br from-purple-400 to-pink-400 rounded-lg p-2 bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-purple-700">📍</div>
            <div className="text-xs font-semibold">{lagna?.name || 'Lagna'}</div>
          </div>
          <div className="aspect-square border-2 border-purple-300 rounded-lg p-2 bg-purple-50 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-purple-700">H3</div>
            <div className="text-lg">{Array.isArray(planets?.[3]) ? planets[3].map(p => planetSymbols[p] || p[0]).join(' ') : '-'}</div>
          </div>

          {/* Bottom row - Houses 10, 9, 4 */}
          <div className="aspect-square border-2 border-purple-300 rounded-lg p-2 bg-purple-50 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-purple-700">H10</div>
            <div className="text-lg">{Array.isArray(planets?.[10]) ? planets[10].map(p => planetSymbols[p] || p[0]).join(' ') : '-'}</div>
          </div>
          <div className="aspect-square border-2 border-purple-300 rounded-lg p-2 bg-purple-50 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-purple-700">H9</div>
            <div className="text-lg">{Array.isArray(planets?.[9]) ? planets[9].map(p => planetSymbols[p] || p[0]).join(' ') : '-'}</div>
          </div>
          <div className="aspect-square border-2 border-purple-300 rounded-lg p-2 bg-purple-50 flex flex-col items-center justify-center text-center">
            <div className="text-xs font-bold text-purple-700">H4</div>
            <div className="text-lg">{Array.isArray(planets?.[4]) ? planets[4].map(p => planetSymbols[p] || p[0]).join(' ') : '-'}</div>
          </div>

          {/* Fourth row - Houses 8, 7, 6, 5 */}
          <div className="col-span-3 grid grid-cols-4 gap-3">
            <div className="aspect-square border-2 border-purple-300 rounded-lg p-2 bg-purple-50 flex flex-col items-center justify-center text-center">
              <div className="text-xs font-bold text-purple-700">H8</div>
              <div className="text-sm">{Array.isArray(planets?.[8]) ? planets[8].map(p => planetSymbols[p] || p[0]).join(' ') : '-'}</div>
            </div>
            <div className="aspect-square border-2 border-purple-300 rounded-lg p-2 bg-purple-50 flex flex-col items-center justify-center text-center">
              <div className="text-xs font-bold text-purple-700">H7</div>
              <div className="text-sm">{Array.isArray(planets?.[7]) ? planets[7].map(p => planetSymbols[p] || p[0]).join(' ') : '-'}</div>
            </div>
            <div className="aspect-square border-2 border-purple-300 rounded-lg p-2 bg-purple-50 flex flex-col items-center justify-center text-center">
              <div className="text-xs font-bold text-purple-700">H6</div>
              <div className="text-sm">{Array.isArray(planets?.[6]) ? planets[6].map(p => planetSymbols[p] || p[0]).join(' ') : '-'}</div>
            </div>
            <div className="aspect-square border-2 border-purple-300 rounded-lg p-2 bg-purple-50 flex flex-col items-center justify-center text-center">
              <div className="text-xs font-bold text-purple-700">H5</div>
              <div className="text-sm">{Array.isArray(planets?.[5]) ? planets[5].map(p => planetSymbols[p] || p[0]).join(' ') : '-'}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          💡 North Indian Chart Style
        </div>
      </div>
    </div>
  );
};

export default BirthChartDisplay;
