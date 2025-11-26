const moment = require('moment-timezone');
const { findPlace } = require('../utils/placeLookup');
const { computePlanets, julianDayFromDate } = require('../utils/swiss');
const { computeHouses } = require('../utils/houses');
const { computeNavamsa } = require('../utils/navamsa');
const { getDasaChain, getDasaSummary } = require('../utils/dasa');
const { getPanchangam } = require('../utils/panchangam');
const { matchHoroscopes } = require('../utils/matching');

// GET /api/horoscope/places?q=Chennai
const searchPlaces = async (req, res) => {
    const q = req.query.q || '';
    const results = await findPlace(q);
    return res.json(results);
};

// POST /api/horoscope/generate
// Body: { name, date, time, place }
const generateHoroscope = async (req, res) => {
    try {
        const { name, date, time, place } = req.body;
        if (!date || !time || !place) return res.status(400).json({ error: 'date,time,place required' });

        const candidates = findPlace(place);
        if (!candidates || candidates.length === 0) return res.status(404).json({ error: 'place not found' });
        const best = candidates[0];

        // Use geo-tz to find timezone if possible, else default to UTC or IST
        let tz = 'UTC';
        try {
            const geoTz = require('geo-tz');
            tz = geoTz.find(best.lat, best.lon)[0] || 'UTC';
        } catch (e) {
            console.warn("geo-tz error", e);
        }

        const dt = moment.tz(`${date} ${time}`, tz);

        const jd = julianDayFromDate(dt.toDate());

        const planets = await computePlanets(jd);
        const houses = await computeHouses(jd, best.lat, best.lon);

        // rasi mapping
        const rasi = {};
        for (const p in planets) {
            const lon = planets[p].lon % 360;
            const signIndex = Math.floor(lon / 30); // 0..11
            rasi[p] = { lon, signIndex, signName: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][signIndex] };
        }

        // navamsa
        const navamsa = {};
        for (const p in planets) navamsa[p] = computeNavamsa(planets[p].lon);

        // dasa
        const dasaChain = getDasaChain(jd, planets);
        const dasaSummary = getDasaSummary(dasaChain);

        // panchangam
        const panch = getPanchangam(dt.toDate(), best.lat, best.lon);

        const out = {
            name: name || null,
            input: { date, time, place: best, timezone: tz },
            julian_day: jd,
            planets,
            rasi,
            houses,
            navamsa,
            dasa: dasaSummary,
            panchangam: panch
        };

        return res.json(out);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: e.message });
    }
};

// POST /api/horoscope/match
// Body: { male: {date, time, place}, female: {date, time, place} }
// Note: This implementation re-calculates charts. In a real app, you might pass chart IDs or full chart objects.
// The user's code assumed passing full chart objects or re-calculating.
// Let's assume we re-calculate for simplicity as per user's snippet "For speed, assume callers call /generate and reuse resulting planets/houses; here we accept full charts"
// Actually, the user's snippet says: "expect compact birth objects: {date,time,place}" AND "For speed, assume callers call /generate... here we accept full charts".
// Wait, the user's snippet says: "const { male, female } = req.body; // expect compact birth objects: {date,time,place}"
// But then calls `matchHoroscopes(male, female)`.
// `matchHoroscopes` expects `chart.planets.Moon.lon`.
// So we MUST generate the charts first if we only get date/time/place.
// Or we expect the client to pass the *result* of /generate.
// Let's implement it to accept *either* full chart OR birth details and generate on fly.
// For now, let's assume the client passes the *generated* chart data (planets) because that's faster.
const matchCharts = async (req, res) => {
    try {
        const { male, female } = req.body;
        if (!male || !female) return res.status(400).json({ error: 'male and female charts required' });

        // Check if we have planets data
        let maleChart = male;
        let femaleChart = female;

        // Helper to generate if missing
        const gen = async (details) => {
            if (details.planets) return details; // already has planets
            // Generate
            const { date, time, place } = details;
            const candidates = findPlace(place);
            const best = candidates[0] || { lat: 0, lon: 0 };
            let tz = 'UTC';
            try { const geoTz = require('geo-tz'); tz = geoTz.find(best.lat, best.lon)[0] || 'UTC'; } catch (e) { }
            const dt = moment.tz(`${date} ${time}`, tz);
            const jd = julianDayFromDate(dt.toDate());
            const planets = await computePlanets(jd);
            return { planets };
        };

        if (!male.planets) maleChart = await gen(male);
        if (!female.planets) femaleChart = await gen(female);

        const score = matchHoroscopes(maleChart, femaleChart);
        return res.json(score);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

module.exports = { searchPlaces, generateHoroscope, matchCharts };
