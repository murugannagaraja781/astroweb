/**
 * Panchangam Calculator Utility
 * Calculates Tithi, Vara, Nakshatra, Yoga, and Karana based on planetary positions.
 */

const TITHI_NAMES = [
    'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
    'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya'
];

const NAKSHATRA_NAMES = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
    'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshta',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

const YOGA_NAMES = [
    'Vishkumbha', 'Priti', 'Ayushman', 'Saubhagya', 'Sobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda',
    'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyan', 'Parigha', 'Shiva',
    'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'
];

const KARANA_NAMES = [
    'Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti',
    'Shakuni', 'Chatushpada', 'Naga', 'Kimstughna'
];

const VARA_NAMES = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

/**
 * Normalize angle to 0-360 degrees
 */
const normalizeAngle = (angle) => {
    let normalized = angle % 360;
    if (normalized < 0) normalized += 360;
    return normalized;
};

/**
 * Calculate Tithi
 * Difference between Moon and Sun longitudes / 12 degrees
 */
const calculateTithi = (moonLon, sunLon) => {
    const diff = normalizeAngle(moonLon - sunLon);
    const index = Math.floor(diff / 12);
    // 0-14 is Shukla Paksha (Waxing), 15-29 is Krishna Paksha (Waning)
    const paksha = index < 15 ? 'Shukla' : 'Krishna';
    return {
        index: index + 1,
        name: TITHI_NAMES[index],
        paksha
    };
};

/**
 * Calculate Nakshatra
 * Moon longitude / 13.33 degrees (360/27)
 */
const calculateNakshatra = (moonLon) => {
    const index = Math.floor(moonLon / (360 / 27));
    const pada = Math.floor((moonLon % (360 / 27)) / (360 / 108)) + 1; // 4 padas per nakshatra
    return {
        index: index + 1,
        name: NAKSHATRA_NAMES[index],
        pada
    };
};

/**
 * Calculate Yoga
 * (Sun longitude + Moon longitude) / 13.33 degrees
 */
const calculateYoga = (moonLon, sunLon) => {
    const sum = normalizeAngle(moonLon + sunLon);
    const index = Math.floor(sum / (360 / 27));
    return {
        index: index + 1,
        name: YOGA_NAMES[index]
    };
};

/**
 * Calculate Karana
 * Half of a Tithi (6 degrees)
 */
const calculateKarana = (moonLon, sunLon) => {
    const diff = normalizeAngle(moonLon - sunLon);
    const index = Math.floor(diff / 6);

    // Logic for Karana names mapping is complex because of movable/fixed karanas
    // For simplicity, we use the standard cyclic mapping + fixed ones
    // But index 0-59 maps to specific named Karanas
    // Simple mapping for this implementation:
    let name;
    if (index === 0) name = 'Kimstughna';
    else if (index >= 57) {
        if (index === 57) name = 'Shakuni';
        else if (index === 58) name = 'Chatushpada';
        else name = 'Naga';
    } else {
        // Revolving Karanas: Bava, Balava, Kaulava, Taitila, Gara, Vanija, Vishti
        const adjustedIndex = (index - 1) % 7;
        name = KARANA_NAMES[adjustedIndex];
    }

    return {
        index: index + 1,
        name
    };
};

/**
 * Calculate Vara (Weekday)
 */
const calculateVara = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0 is Sunday
    return {
        index: day,
        name: VARA_NAMES[day]
    };
};

/**
 * Calculate full Panchangam
 */
exports.calculatePanchangam = (dateStr, sunLon, moonLon) => {
    return {
        tithi: calculateTithi(moonLon, sunLon),
        nakshatra: calculateNakshatra(moonLon),
        yoga: calculateYoga(moonLon, sunLon),
        karana: calculateKarana(moonLon, sunLon),
        vara: calculateVara(dateStr)
    };
};
