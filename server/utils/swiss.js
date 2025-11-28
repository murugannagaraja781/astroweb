let swe;
try {
    swe = require('swisseph');
    // set path to your ephemeris folder
    swe.swe_set_ephe_path(__dirname + '/../ephe');
} catch (e) {
    console.info("ℹ️  swisseph module not found, using mock data (safe for dev)");
    swe = null;
}

function julianDayFromDate(date) {
    if (swe) {
        const y = date.getUTCFullYear();
        const m = date.getUTCMonth() + 1;
        const d = date.getUTCDate();
        const hr = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
        return swe.swe_julday(y, m, d, hr, swe.SE_GREG_CAL);
    }
    // Mock JD
    return 2451545 + (date.getTime() / 86400000);
}

function calcPlanet(jd, id) {
    return new Promise((resolve, reject) => {
        if (swe) {
            swe.swe_calc_ut(jd, id, swe.FLG_SWIEPH | swe.FLG_SPEED, (res) => {
                if (!res || !res.x) return reject(new Error('swe error'));
                const lon = res.x[0];
                const lat = res.x[1];
                const dist = res.x[2];
                const speed = res.x[3];
                resolve({ lon: lon % 360, lat, dist, speed, retrograde: speed < 0 });
            });
        } else {
            // Mock planet positions
            // Random-ish but deterministic based on JD and ID to avoid jitter if called repeatedly
            const lon = (jd * (id + 1) * 13) % 360;
            resolve({ lon, lat: 0, dist: 1, speed: 1, retrograde: false });
        }
    });
}

async function computePlanets(jd) {
    // IDs: Sun=0, Moon=1, Mercury=2, Venus=3, Mars=4, Jupiter=5, Saturn=6
    // We need to map them correctly if we use swe constants, but here we just use 0-6
    // swe.SE_SUN is 0
    const ids = [0, 1, 2, 3, 4, 5, 6];
    const names = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
    const out = {};
    for (let i = 0; i < ids.length; i++) {
        out[names[i]] = await calcPlanet(jd, ids[i]);
    }
    // Nodes (mean node = 10)
    const node = await calcPlanet(jd, 10);
    out['Rahu'] = { lon: node.lon };
    out['Ketu'] = { lon: (node.lon + 180) % 360 };
    return out;
}

module.exports = { computePlanets, julianDayFromDate };
