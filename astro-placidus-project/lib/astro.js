// lib/astro.js
const swe = require('swisseph');
const path = require('path');

const EPHE_DIR = path.join(__dirname, '..', 'ephe');
swe.swe_set_ephe_path(EPHE_DIR);

// Helpers
const mod360 = v => ((v % 360) + 360) % 360;
const degToDMS = deg => {
    deg = mod360(deg);
    const d = Math.floor(deg);
    const m = Math.floor((deg - d) * 60);
    const s = ((deg - d) * 60 - m) * 60;
    return `${d}° ${m}' ${s.toFixed(2)}"`;
};
const rasiNames = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const rasiName = i => rasiNames[(i - 1 + 12) % 12];

// Convert input to Julian Day (UT)
function toJulianDayUTC({ date, time, tzOffsetHours }) {
    const [Y, M, D] = date.split('-').map(Number);
    const [h, m, s] = time.split(':').map(Number);
    const localH = h + m / 60 + s / 3600;
    const ut = localH - tzOffsetHours;
    return swe.swe_julday(Y, M, D, ut, swe.SE_GREG_CAL);
}

function setSidereal(enable = true, ayanamsa = swe.SE_SIDM_LAHIRI) {
    if (enable) {
        try { swe.swe_set_sid_mode(ayanamsa, 0, 0); } catch (e) { }
    } else {
        try { swe.swe_set_sid_mode(0, 0, 0); } catch (e) { }
    }
}

const PLANETS = [
    { key: 'Sun', id: swe.SE_SUN },
    { key: 'Moon', id: swe.SE_MOON },
    { key: 'Mars', id: swe.SE_MARS },
    { key: 'Mercury', id: swe.SE_MERCURY },
    { key: 'Jupiter', id: swe.SE_JUPITER },
    { key: 'Venus', id: swe.SE_VENUS },
    { key: 'Saturn', id: swe.SE_SATURN },
    { key: 'Uranus', id: swe.SE_URANUS },
    { key: 'Neptune', id: swe.SE_NEPTUNE }
];

function computePlanets(jd) {
    const out = {};
    for (const p of PLANETS) {
        const res = swe.swe_calc_ut(jd, p.id, swe.SEFLG_SWIEPH);
        let lon = null;
        if (Array.isArray(res)) lon = res[0];
        else if (res && typeof res === 'object') lon = res.longitude ?? res.lon ?? null;
        out[p.key] = { lon: lon === null ? null : +mod360(lon).toFixed(6), lonDMS: lon === null ? null : degToDMS(lon) };
    }
    // Nodes (true)
    const nodeId = typeof swe.SE_TRUE_NODE !== 'undefined' ? swe.SE_TRUE_NODE : swe.SE_MEAN_NODE;
    try {
        const rn = swe.swe_calc_ut(jd, nodeId, swe.SEFLG_SWIEPH);
        const nodeLon = Array.isArray(rn) ? rn[0] : (rn.longitude ?? rn.lon ?? null);
        if (nodeLon !== null) {
            out.Rahu = { lon: +mod360(nodeLon).toFixed(6), lonDMS: degToDMS(nodeLon) };
            out.Ketu = { lon: +mod360(nodeLon + 180).toFixed(6), lonDMS: degToDMS(nodeLon + 180) };
        } else {
            out.Rahu = out.Ketu = { lon: null, lonDMS: null };
        }
    } catch (e) { out.Rahu = out.Ketu = { lon: null, lonDMS: null }; }
    return out;
}

function computeHousesAndAsc(jd, lat, lon) {
    const h = swe.swe_houses(jd, lat, lon, 'P');
    if (!h) return { cusps: null, asc: null, mc: null };
    let cusps = null, asc = null, mc = null;
    if (Array.isArray(h) && h.length >= 3 && Array.isArray(h[2])) {
        asc = +mod360(h[0]).toFixed(6);
        mc = +mod360(h[1]).toFixed(6);
        cusps = h[2].slice(0, 12).map(v => +mod360(v).toFixed(6));
    } else if (h && typeof h === 'object') {
        if (Array.isArray(h.houses)) {
            cusps = h.houses.slice(0, 12).map(v => +mod360(v).toFixed(6));
            asc = h.ascendant ? +mod360(h.ascendant).toFixed(6) : null;
            mc = h.mc ? +mod360(h.mc).toFixed(6) : null;
        }
    }
    return { cusps, asc, mc };
}

function lonToRasi(lon) {
    if (lon === null) return null;
    const L = mod360(lon);
    const idx = Math.floor(L / 30) + 1;
    const within = +(L - Math.floor(L / 30) * 30).toFixed(6);
    return { rasiIndex: idx, rasiName: rasiName(idx), withinDeg: within };
}
function lonToNavamsa(lon) {
    if (lon === null) return null;
    const navDeg = mod360(lon * 9);
    const idx = Math.floor(navDeg / 30) + 1;
    const within = +(navDeg - Math.floor(navDeg / 30) * 30).toFixed(6);
    return { navamsaIndex: idx, navamsaName: rasiName(idx), navDeg: +navDeg.toFixed(6), withinDeg: within };
}

function computePanchang(sunLon, moonLon) {
    if (sunLon === null || moonLon === null) return { tithi: null, nakshatra: null, yoga: null, karana: null };
    const diff = mod360(moonLon - sunLon);
    const tithi = Math.floor(diff / 12) + 1;
    const nak = Math.floor(moonLon / (360 / 27)) + 1;
    const yoga = Math.floor(mod360(sunLon + moonLon) / (360 / 27)) + 1;
    const KAR = ["Kimstughna", "Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti", "Shakuni", "Chatushpada", "Naga"];
    const karIdx = Math.floor(((diff / 12) * 2)) % KAR.length;
    const kar = KAR[karIdx];
    return { tithi, nakshatra: nak, yoga, karana: kar };
}

// Vimshottari Dasha
const VIM_DASHAS = [
    { name: 'Ketu', years: 7 },
    { name: 'Venus', years: 20 },
    { name: 'Sun', years: 6 },
    { name: 'Moon', years: 10 },
    { name: 'Mars', years: 7 },
    { name: 'Rahu', years: 18 },
    { name: 'Jupiter', years: 16 },
    { name: 'Saturn', years: 19 },
    { name: 'Mercury', years: 17 }
];
function getNakshatraFraction(lon) {
    if (lon === null) return null;
    const total = mod360(lon);
    const nakIndex = Math.floor(total / (360 / 27)) + 1;
    const nakStart = (nakIndex - 1) * (360 / 27);
    const frac = (total - nakStart) / (360 / 27);
    return { nakIndex, frac };
}
function computeVimshottariDasha(jd, moonLon) {
    const nf = getNakshatraFraction(moonLon);
    if (!nf) return null;
    const startIdx = (nf.nakIndex - 1) % VIM_DASHAS.length;
    const current = VIM_DASHAS[startIdx];
    const remainingYears = (1 - nf.frac) * current.years;
    const sequence = [];
    let yearAcc = 0;
    sequence.push({ name: current.name, years: +remainingYears.toFixed(6), startYearOffset: +yearAcc.toFixed(6), endYearOffset: +(yearAcc + remainingYears).toFixed(6) });
    yearAcc += remainingYears;
    let idx = startIdx;
    for (let i = 1; i < 30; i++) {
        idx = (idx + 1) % VIM_DASHAS.length;
        const ylen = VIM_DASHAS[idx].years;
        sequence.push({ name: VIM_DASHAS[idx].name, years: ylen, startYearOffset: +yearAcc.toFixed(6), endYearOffset: +(yearAcc + ylen).toFixed(6) });
        yearAcc += ylen;
        if (yearAcc > 120) break;
    }
    return { nakshatraIndex: nf.nakIndex, nakshatraFrac: +nf.frac.toFixed(6), sequence };
}

// Compatibility (basic)
function approximateCompatibility(personA, personB) {
    const aMoon = personA.planets?.Moon?.lon;
    const bMoon = personB.planets?.Moon?.lon;
    const aVen = personA.planets?.Venus?.lon;
    const bVen = personB.planets?.Venus?.lon;
    if (aMoon == null || bMoon == null) return { score: null, reason: 'Missing moon positions' };
    const an = getNakshatraFraction(aMoon);
    const bn = getNakshatraFraction(bMoon);
    let nakScore = 0;
    if (an.nakIndex === bn.nakIndex) nakScore = 10;
    else if (Math.abs(an.nakIndex - bn.nakIndex) === 1 || Math.abs(an.nakIndex - bn.nakIndex) === 26) nakScore = 5;
    else nakScore = 2;
    const aVenR = aVen == null ? null : Math.floor(mod360(aVen) / 30) + 1;
    const bVenR = bVen == null ? null : Math.floor(mod360(bVen) / 30) + 1;
    const venScore = (aVenR && bVenR && aVenR === bVenR) ? 10 : 0;
    const aR = Math.floor(mod360(aMoon) / 30);
    const bR = Math.floor(mod360(bMoon) / 30);
    let rdist = Math.abs(aR - bR);
    if (rdist > 6) rdist = 12 - rdist;
    const rasiScore = Math.max(0, 10 - rdist);
    const crudeGuna = nakScore / 10 * 6;
    const total = nakScore + venScore + rasiScore + crudeGuna;
    return { score: Math.round(total), maxScore: 36, breakdown: { nakScore, venScore, rasiScore: +rasiScore.toFixed(2), crudeGuna: +crudeGuna.toFixed(2) }, nakshatra: { a: an.nakIndex, b: bn.nakIndex } };
}

function calculateAll(params) {
    const { date, time, tzOffsetHours, lat, lon, options } = params;
    const opts = Object.assign({ sidereal: true, ayanamsa: swe.SE_SIDM_LAHIRI }, options || {});
    setSidereal(!!opts.sidereal, opts.ayanamsa);
    const jd = toJulianDayUTC({ date, time, tzOffsetHours });
    const planets = computePlanets(jd);
    const houses = computeHousesAndAsc(jd, lat, lon);
    const bodies = {};
    for (const [k, v] of Object.entries(planets)) {
        bodies[k] = { lon: v.lon, lonDMS: v.lonDMS, rasi: lonToRasi(v.lon), navamsa: lonToNavamsa(v.lon) };
    }
    const panchang = computePanchang(planets.Sun?.lon, planets.Moon?.lon);
    return { input: { date, time, tzOffsetHours, lat, lon, options: opts }, julianDayUT: +jd.toFixed(6), planets: bodies, houses, panchang };
}

module.exports = { calculateAll, computeVimshottariDasha, approximateCompatibility };
