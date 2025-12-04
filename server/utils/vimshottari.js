// utils/vimshottari.js

// Vimshottari Mahadasha + Bhukti + Pratyantar calculation

const DASA_ORDER = [
    "Ketu",
    "Venus",
    "Sun",
    "Moon",
    "Mars",
    "Rahu",
    "Jupiter",
    "Saturn",
    "Mercury"
];

const DASA_YEARS = {
    Ketu: 7,
    Venus: 20,
    Sun: 6,
    Moon: 10,
    Mars: 7,
    Rahu: 18,
    Jupiter: 16,
    Saturn: 19,
    Mercury: 17
};

// 360° / 27 nakshatras = 13°20' per nakshatra
const NAK_LENGTH_DEG = 360 / 27;

// Nakshatra lords order (Ashwini to Revati)
const NAKSHATRA_LORDS = [
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury", // Ashwini – Ashlesha
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury", // Magha – Jyeshta
    "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"  // Mula – Revati
];

/**
 * Get Nakshatra lord based on Moon longitude
 */
function getNakshatraLord(moonLongDeg) {
    console.log("moonlongdegree", moonLongDeg)
    const index = Math.floor(moonLongDeg / NAK_LENGTH_DEG); // 0–26
    return NAKSHATRA_LORDS[index];
}

/**
 * Get remaining fraction in current nakshatra
 */
function getBalanceFractionInNakshatra(moonLongDeg) {
    const posInNak = moonLongDeg % NAK_LENGTH_DEG;
    const fraction = posInNak / NAK_LENGTH_DEG;
    return 1 - fraction; // remaining part
}

/**
 * Convert years to days
 */
function yearsToDays(years) {
    return years * 365.25; // approximate
}

/**
 * Add days to a date
 */
function addDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Rotate dasa order starting from given lord
 */
function rotateDasaOrderFrom(startLord) {
    const idx = DASA_ORDER.indexOf(startLord);
    if (idx === -1) throw new Error(`Invalid startLord: ${startLord}`);
    return DASA_ORDER.slice(idx).concat(DASA_ORDER.slice(0, idx));
}

/**
 * Compute Mahadasha sequence
 */
function computeMahadashaSequence(birthDate, moonLongDeg, totalYears = 120) {
    const startLord = getNakshatraLord(moonLongDeg);
    const balanceFraction = getBalanceFractionInNakshatra(moonLongDeg);
    const orderFromStart = rotateDasaOrderFrom(startLord);

    let result = [];
    let currentStart = new Date(birthDate);

    // First Mahadasha – only balance part
    const firstTotalYears = DASA_YEARS[startLord];
    const firstBalanceYears = firstTotalYears * balanceFraction;
    let firstEnd = addDays(currentStart, yearsToDays(firstBalanceYears));

    result.push({
        lord: startLord,
        start: new Date(currentStart),
        end: new Date(firstEnd),
        years: firstBalanceYears
    });

    currentStart = new Date(firstEnd);
    let passedYears = firstBalanceYears;

    // Remaining Mahadashas
    for (let i = 1; i < orderFromStart.length && passedYears < totalYears; i++) {
        const lord = orderFromStart[i];
        const y = DASA_YEARS[lord];
        const end = addDays(currentStart, yearsToDays(y));

        result.push({
            lord,
            start: new Date(currentStart),
            end,
            years: y
        });

        currentStart = end;
        passedYears += y;
    }

    return result;
}

/**
 * Compute Bhuktis (Antardashas) for a given Mahadasha
 */
function computeBhuktisForMahadasha(mahadasha) {
    const orderFromMaha = rotateDasaOrderFrom(mahadasha.lord);
    const mahaYears = mahadasha.years;

    const bhuktis = [];
    let currentStart = new Date(mahadasha.start);

    for (const subLord of orderFromMaha) {
        const subYears = DASA_YEARS[subLord];
        const subYearsActual = (mahaYears * subYears) / 120.0;
        const end = addDays(currentStart, yearsToDays(subYearsActual));

        bhuktis.push({
            mahaLord: mahadasha.lord,
            subLord,
            start: new Date(currentStart),
            end,
            years: subYearsActual
        });

        currentStart = end;
    }

    return bhuktis;
}

/**
 * Compute Pratyantars for a given Bhukti
 */
function computePratyantarsForBhukti(bhukti) {
    const orderFromBhukti = rotateDasaOrderFrom(bhukti.subLord);
    const bhuktiYears = bhukti.years;

    const pratyantars = [];
    let currentStart = new Date(bhukti.start);

    for (const pratyantarLord of orderFromBhukti) {
        const pratyantarYears = DASA_YEARS[pratyantarLord];
        const pratyantarYearsActual = (bhuktiYears * pratyantarYears) / 120.0;
        const end = addDays(currentStart, yearsToDays(pratyantarYearsActual));

        pratyantars.push({
            mahaLord: bhukti.mahaLord,
            subLord: bhukti.subLord,
            pratyantarLord,
            start: new Date(currentStart),
            end,
            years: pratyantarYearsActual
        });

        currentStart = end;
    }

    return pratyantars;
}

/**
 * Find current running Dasha-Bhukti for a given date
 */
function getCurrentDasha(birthDate, moonLongDeg, targetDate = new Date()) {
    const mahadashas = computeMahadashaSequence(birthDate, moonLongDeg);

    // Find current Mahadasha
    const currentMaha = mahadashas.find(m =>
        targetDate >= m.start && targetDate < m.end
    );

    if (!currentMaha) {
        return { error: 'Target date outside Dasha cycle' };
    }

    // Find current Bhukti
    const bhuktis = computeBhuktisForMahadasha(currentMaha);
    const currentBhukti = bhuktis.find(b =>
        targetDate >= b.start && targetDate < b.end
    );

    if (!currentBhukti) {
        return { currentMaha, error: 'Bhukti not found' };
    }

    // Find current Pratyantar
    const pratyantars = computePratyantarsForBhukti(currentBhukti);
    const currentPratyantar = pratyantars.find(p =>
        targetDate >= p.start && targetDate < p.end
    );

    return {
        mahadasha: currentMaha,
        bhukti: currentBhukti,
        pratyantar: currentPratyantar
    };
}

module.exports = {
    computeMahadashaSequence,
    computeBhuktisForMahadasha,
    computePratyantarsForBhukti,
    getCurrentDasha,
    getNakshatraLord,
    DASA_ORDER,
    DASA_YEARS
};
