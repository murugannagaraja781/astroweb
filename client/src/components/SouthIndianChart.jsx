import React from 'react';

const SouthIndianChart = ({ planets, ascendant }) => {
  // Signs mapping
  const signs = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  // Helper to get sign index from longitude
  const getSign = (lon) => Math.floor(lon / 30);

  // Group planets by sign
  const planetsBySign = {};

  // Add Ascendant (Lagna)
  const ascSign = getSign(ascendant);
  if (!planetsBySign[ascSign]) planetsBySign[ascSign] = [];
  planetsBySign[ascSign].push("Lagna");

  // Add other planets
  Object.entries(planets).forEach(([name, data]) => {
    const sign = getSign(data.lon);
    if (!planetsBySign[sign]) planetsBySign[sign] = [];
    // Shorten names
    const shortName = name.slice(0, 2);
    planetsBySign[sign].push(shortName);
  });

  // Cell renderer
  const Cell = ({ signIndex, className = "" }) => {
    const items = planetsBySign[signIndex] || [];
    return (
      <div className={`border border-orange-800 relative p-1 min-h-[80px] flex flex-wrap content-start gap-1 ${className}`}>
        {/* Sign Name (Optional, usually implied) */}
        <span className="absolute bottom-0 right-0 text-[10px] text-gray-400 p-1">
            {signs[signIndex]}
        </span>

        {items.map((p, i) => (
          <span key={i} className={`text-xs font-bold px-1 rounded ${p === 'Lagna' ? 'text-red-600' : 'text-blue-800'}`}>
            {p}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto border-2 border-orange-900 bg-orange-50 text-orange-900">
      <div className="grid grid-cols-4 grid-rows-4 aspect-square">
        {/* Row 1 */}
        <Cell signIndex={11} /> {/* Pisces */}
        <Cell signIndex={0} />  {/* Aries */}
        <Cell signIndex={1} />  {/* Taurus */}
        <Cell signIndex={2} />  {/* Gemini */}

        {/* Row 2 */}
        <Cell signIndex={10} /> {/* Aquarius */}
        <div className="col-span-2 row-span-2 flex items-center justify-center border border-orange-200 bg-white">
            <div className="text-center">
                <h3 className="font-bold text-lg text-orange-800">Rasi Chart</h3>
                <p className="text-xs text-gray-500">South Indian Style</p>
            </div>
        </div>
        <Cell signIndex={3} />  {/* Cancer */}

        {/* Row 3 */}
        <Cell signIndex={9} />  {/* Capricorn */}
        {/* Middle area occupied by col-span-2 row-span-2 above */}
        <Cell signIndex={4} />  {/* Leo */}

        {/* Row 4 */}
        <Cell signIndex={8} />  {/* Sagittarius */}
        <Cell signIndex={7} />  {/* Scorpio */}
        <Cell signIndex={6} />  {/* Libra */}
        <Cell signIndex={5} />  {/* Virgo */}
      </div>
    </div>
  );
};

export default SouthIndianChart;
