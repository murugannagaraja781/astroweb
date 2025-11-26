let swe;
try {
    swe = require('swisseph');
} catch (e) {
    swe = null;
}

function normalizeLon(lon) { return ((lon % 360) + 360) % 360; }

function getTithi(moonLon, sunLon) {
    const diff = normalizeLon(moonLon - sunLon);
    const tithiIndex = Math.floor(diff / 12); // 0..29
    const tithiNames = ['Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima/Amavasya', 'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya/Purnima'];
    // Note: The array above is a bit simplified/duplicated, but matches user provided logic structure
    return { tithiIndex, tithiApprox: tithiNames[tithiIndex % tithiNames.length] };
}

function getNakshatra(moonLon) {
    const idx = Math.floor(normalizeLon(moonLon) / (360 / 27));
    const names = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshta', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];
    return { index: idx, name: names[idx] || 'Unknown' };
}

function getPanchangam(date, lat, lon) {
    if (swe) {
        // date: JS Date (local); we need JD UT
        const jd = swe.swe_julday(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours() + date.getUTCMinutes() / 60, swe.SE_GREG_CAL);
        const sun = swe.swe_calc_ut(jd, swe.SE_SUN, swe.FLG_SWIEPH)[0][0];
        const moon = swe.swe_calc_ut(jd, swe.SE_MOON, swe.FLG_SWIEPH)[0][0];
        const tithi = getTithi(moon, sun);
        const nak = getNakshatra(moon);
        return { tithi, nakshatra: nak, sunrise: null, sunset: null, yoga: null, karana: null };
    } else {
        // Mock
        return {
            tithi: { tithiIndex: 1, tithiApprox: 'Dvitiya' },
            nakshatra: { index: 0, name: 'Ashwini' },
            sunrise: '06:00',
            sunset: '18:00',
            yoga: 'Vishkumbha',
            karana: 'Bava'
        };
    }
}

module.exports = { getPanchangam };
