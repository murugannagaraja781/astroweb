// Simplified: full 5-level chain is complex; this generates main Dasa chain and current/balance
const dasaOrder = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const dasaYears = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };

function getMoonNakshatra(moonLon) {
    const idx = Math.floor(moonLon / (360 / 27));
    const frac = (moonLon - idx * (360 / 27)) / (360 / 27);
    const ruler = dasaOrder[idx % 9];
    const balance = (1 - frac) * dasaYears[ruler];
    return { nakIndex: idx, ruler, balanceYears: balance };
}

function getDasaChain(jd, planets) {
    // planets must include Moon lon
    if (!planets.Moon) return [];
    const moonLon = planets.Moon.lon;
    const start = getMoonNakshatra(moonLon);
    // build chain from starting ruler
    const startIndex = dasaOrder.indexOf(start.ruler);
    const chain = [];
    // remaining years in starting dasa
    chain.push({ planet: start.ruler, years: start.balanceYears });
    // then next dasas
    for (let i = 1; i < 9; i++) {
        const p = dasaOrder[(startIndex + i) % 9];
        chain.push({ planet: p, years: dasaYears[p] });
    }
    return chain;
}

function getDasaSummary(chain) {
    // produce current dasa (approx) and order
    if (!chain || chain.length === 0) return { sequence: [], current: null };
    return { sequence: chain, current: chain[0] };
}

module.exports = { getDasaChain, getDasaSummary };
