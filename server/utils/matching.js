// Simplified marriage matching engine: star-porutham (Nakshatra based) + basic checks

const poruthamRules = {
    dina: (a, b) => (a === b ? 1 : 0),
    gana: (a, b) => (Math.abs(a - b) <= 1 ? 1 : 0) // placeholder
};

function nakFromPlanetMoon(chart) {
    // assumes chart.planets.Moon.lon exists
    if (!chart || !chart.planets || !chart.planets.Moon) return 0;
    const idx = Math.floor(((chart.planets.Moon.lon % 360) + 360) % 360 / (360 / 27));
    return idx;
}

function matchHoroscopes(maleChart, femaleChart) {
    const maleNak = nakFromPlanetMoon(maleChart);
    const femaleNak = nakFromPlanetMoon(femaleChart);
    const por = { din: poruthamRules.dina(maleNak, femaleNak), gana: poruthamRules.gana(maleNak, femaleNak) };
    const score = por.din + por.gana; // naive
    return { porutham: por, score, recommendation: score >= 1 ? 'Likely Compatible' : 'Low Compatibility' };
}

module.exports = { matchHoroscopes };
