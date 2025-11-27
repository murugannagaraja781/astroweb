import React from 'react';

const SouthIndianChart = ({ planets, ascendant }) => {
  // Tamil zodiac signs (Rasi names)
  const tamilSigns = [
    "மேஷம்",      // Aries (Mesham)
    "ரிஷபம்",     // Taurus (Rishabam)
    "மிதுனம்",    // Gemini (Mithunam)
    "கடகம்",      // Cancer (Kadagam)
    "சிம்மம்",    // Leo (Simmam)
    "கன்னி",      // Virgo (Kanni)
    "துலாம்",     // Libra (Thulam)
    "விருச்சிகம்", // Scorpio (Viruchigam)
    "தனுசு",      // Sagittarius (Dhanusu)
    "மகரம்",      // Capricorn (Magaram)
    "கும்பம்",    // Aquarius (Kumbam)
    "மீனம்"       // Pisces (Meenam)
  ];

  // Tamil planet names
  const tamilPlanetNames = {
    'Sun': 'சூ',      // Surya
    'Moon': 'ச',     // Chandra
    'Mars': 'செ',    // Sevvai
    'Mercury': 'பு',  // Budhan
    'Jupiter': 'கு',  // Guru
    'Venus': 'சு',   // Sukran
    'Saturn': 'ச',   // Sani
    'Rahu': 'ரா',    // Rahu
    'Ketu': 'கே'     // Ketu
  };

  // Helper to get sign index from longitude
  const getSign = (lon) => Math.floor(lon / 30);

  // Group planets by sign
  const planetsBySign = {};

  // Add Ascendant (Lagna)
  const ascSign = getSign(ascendant);
  if (!planetsBySign[ascSign]) planetsBySign[ascSign] = [];
  planetsBySign[ascSign].push("லக்"); // "Lag" in Tamil

  // Add other planets
  Object.entries(planets).forEach(([name, data]) => {
    const sign = getSign(data.lon);
    if (!planetsBySign[sign]) planetsBySign[sign] = [];
    // Use Tamil abbreviation
    const tamilName = tamilPlanetNames[name] || name.slice(0, 2);
    planetsBySign[sign].push(tamilName);
  });

  // Cell renderer
  const Cell = ({ signIndex, className = "" }) => {
    const items = planetsBySign[signIndex] || [];
    return (
      <div className={`border border-purple-700 relative p-2 min-h-[80px] flex flex-wrap content-start gap-1 bg-gradient-to-br from-purple-50 to-indigo-50 ${className}`}>
        {/* Tamil Sign Name */}
        <span className="absolute bottom-1 right-1 text-[11px] font-semibold text-purple-600 bg-white/80 px-1 rounded">
            {tamilSigns[signIndex]}
        </span>

        {items.map((p, i) => (
          <span key={i} className={`text-sm font-bold px-1.5 py-0.5 rounded ${p === 'லக்' ? 'bg-red-500 text-white' : 'bg-purple-600 text-white'}`}>
            {p}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto border-4 border-purple-800 bg-purple-100 text-purple-900 rounded-lg overflow-hidden shadow-xl">
      <div className="grid grid-cols-4 grid-rows-4 aspect-square">
        {/* Row 1 */}
        <Cell signIndex={11} /> {/* மீனம் - Pisces */}
        <Cell signIndex={0} />  {/* மேஷம் - Aries */}
        <Cell signIndex={1} />  {/* ரிஷபம் - Taurus */}
        <Cell signIndex={2} />  {/* மிதுனம் - Gemini */}

        {/* Row 2 */}
        <Cell signIndex={10} /> {/* கும்பம் - Aquarius */}
        <div className="col-span-2 row-span-2 flex items-center justify-center border-2 border-purple-300 bg-gradient-to-br from-white to-purple-50">
            <div className="text-center">
                <h3 className="font-bold text-xl text-purple-800 mb-1">ராசி சக்கரம்</h3>
                <p className="text-xs text-purple-600">தென்னிந்திய முறை</p>
            </div>
        </div>
        <Cell signIndex={3} />  {/* கடகம் - Cancer */}

        {/* Row 3 */}
        <Cell signIndex={9} />  {/* மகரம் - Capricorn */}
        {/* Middle area occupied by col-span-2 row-span-2 above */}
        <Cell signIndex={4} />  {/* சிம்மம் - Leo */}

        {/* Row 4 */}
        <Cell signIndex={8} />  {/* தனுசு - Sagittarius */}
        <Cell signIndex={7} />  {/* விருச்சிகம் - Scorpio */}
        <Cell signIndex={6} />  {/* துலாம் - Libra */}
        <Cell signIndex={5} />  {/* கன்னி - Virgo */}
      </div>
    </div>
  );
};

export default SouthIndianChart;
