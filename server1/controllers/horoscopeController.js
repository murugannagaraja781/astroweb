const { generateDailyHoroscope } = require('../services/aiClient');

// Valid zodiac signs in Tamil
const VALID_SIGNS = [
    'mesham', 'rishabam', 'mithunam', 'kadagam',
    'simmam', 'kanni', 'thulam', 'viruchigam',
    'dhanusu', 'magaram', 'kumbam', 'meenam'
];

const SIGN_NAMES_TA = {
    mesham: 'மேஷம்',
    rishabam: 'ரிஷபம்',
    mithunam: 'மிதுனம்',
    kadagam: 'கடகம்',
    simmam: 'சிம்மம்',
    kanni: 'கன்னி',
    thulam: 'துலாம்',
    viruchigam: 'விருச்சிகம்',
    dhanusu: 'தனுசு',
    magaram: 'மகரம்',
    kumbam: 'கும்பம்',
    meenam: 'மீனம்'
};

function normalizeSign(sign) {
    if (!sign) return null;
    const s = sign.toLowerCase();
    if (VALID_SIGNS.includes(s)) return s;
    return null;
}

// Get daily horoscope for a specific sign
exports.getDailyHoroscope = async (req, res) => {
    try {
        const { sign, date, lang } = req.query;

        const normSign = normalizeSign(sign);
        if (!normSign) {
            return res.status(400).json({
                error: 'Invalid or missing sign',
                validSigns: VALID_SIGNS
            });
        }

        const today = new Date();
        const isoDate = date || today.toISOString().slice(0, 10);
        const language = lang === 'en' ? 'en' : 'ta';

        // Generate horoscope using AI
        const horoscopeText = await generateDailyHoroscope(normSign, isoDate, language);
        const horoscopeData = JSON.parse(horoscopeText);

        return res.json({
            sign: normSign,
            signName: SIGN_NAMES_TA[normSign],
            date: isoDate,
            language,
            horoscope: horoscopeData,
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        console.error('Error in getDailyHoroscope:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all horoscopes for today
exports.getAllDailyHoroscopes = async (req, res) => {
    try {
        const { date, lang } = req.query;
        const today = new Date();
        const isoDate = date || today.toISOString().slice(0, 10);
        const language = lang === 'en' ? 'en' : 'ta';

        const allHoroscopes = [];

        for (const sign of VALID_SIGNS) {
            try {
                const horoscopeText = await generateDailyHoroscope(sign, isoDate, language);
                const horoscopeData = JSON.parse(horoscopeText);

                allHoroscopes.push({
                    sign,
                    signName: SIGN_NAMES_TA[sign],
                    horoscope: horoscopeData
                });
            } catch (err) {
                console.error(`Error generating horoscope for ${sign}:`, err);
            }
        }

        return res.json({
            date: isoDate,
            language,
            horoscopes: allHoroscopes,
            generatedAt: new Date().toISOString()
        });

    } catch (err) {
        console.error('Error in getAllDailyHoroscopes:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Get list of available signs
exports.getZodiacSigns = async (req, res) => {
    const signs = VALID_SIGNS.map(sign => ({
        id: sign,
        name: SIGN_NAMES_TA[sign],
        nameEn: sign.charAt(0).toUpperCase() + sign.slice(1)
    }));

    return res.json({ signs });
};
