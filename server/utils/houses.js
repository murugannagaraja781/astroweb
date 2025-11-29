let swe;
try {
    swe = require('swisseph');
} catch (e) {
    swe = null;
}

function computeHouses(jd, lat, lon, houseSystem = 'P') {
    return new Promise((resolve, reject) => {
        if (swe) {
            swe.swe_houses(jd, lat, lon, houseSystem, (res) => {
                if (!res) return reject(new Error('swe.houses error'));
                const cusps = {};
                for (let i = 1; i <= 12; i++) cusps[i] = res.cusps[i];
                resolve({ cusps, ascendant: res.ascmc[0], mc: res.ascmc[1] });
            });
        } else {
            // Mock houses
            const cusps = {};
            let start = (jd * 360) % 360; // Random start
            for (let i = 1; i <= 12; i++) cusps[i] = (start + (i - 1) * 30) % 360;
            resolve({ cusps, ascendant: start, mc: (start + 270) % 360 });
        }
    });
}

module.exports = { computeHouses };
