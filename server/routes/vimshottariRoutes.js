const express = require('express');
const router = express.Router();
const {
    calculatePlanetaryPositions,
    createDate
} = require('vedic-astrology-api/lib/utils/common');

const {
    computeMahadashaSequence,
    computeBhuktisForMahadasha,
    computePratyantarsForBhukti,
    getCurrentDasha
} = require('../utils/vimshottari');

/**
 * GET /api/vimshottari/mahadashas
 * Get complete Mahadasha sequence
 */
router.get('/mahadashas', (req, res) => {
    try {
        const year = Number(req.query.year);
        const month = Number(req.query.month);
        const day = Number(req.query.day);
        const hour = Number(req.query.hour || 0);
        const minute = Number(req.query.minute || 0);
        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);
        const tz = Number(req.query.tz || 5.5);

        const date = createDate(year, month, day, hour, minute, tz);
        const { positions } = calculatePlanetaryPositions(date, lat, lon);
        const moonLong = positions.Moon.longitude;

        const mahadashas = computeMahadashaSequence(date, moonLong);

        res.json({
            input: { year, month, day, hour, minute, lat, lon, tz },
            moonLongitude: moonLong,
            mahadashas: mahadashas.map(m => ({
                lord: m.lord,
                start: m.start.toISOString(),
                end: m.end.toISOString(),
                years: m.years.toFixed(2)
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Error in Mahadasha calculation' });
    }
});

/**
 * GET /api/vimshottari/bhuktis
 * Get Bhuktis for a specific Mahadasha
 */
router.get('/bhuktis', (req, res) => {
    try {
        const year = Number(req.query.year);
        const month = Number(req.query.month);
        const day = Number(req.query.day);
        const hour = Number(req.query.hour || 0);
        const minute = Number(req.query.minute || 0);
        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);
        const tz = Number(req.query.tz || 5.5);
        const mahaIndex = Number(req.query.mahaIndex || 0);

        const date = createDate(year, month, day, hour, minute, tz);
        const { positions } = calculatePlanetaryPositions(date, lat, lon);
        const moonLong = positions.Moon.longitude;

        const mahadashas = computeMahadashaSequence(date, moonLong);
        const selectedMaha = mahadashas[mahaIndex];

        if (!selectedMaha) {
            return res.status(400).json({ error: 'Invalid Mahadasha index' });
        }

        const bhuktis = computeBhuktisForMahadasha(selectedMaha);

        res.json({
            mahadasha: {
                lord: selectedMaha.lord,
                start: selectedMaha.start.toISOString(),
                end: selectedMaha.end.toISOString()
            },
            bhuktis: bhuktis.map(b => ({
                mahaLord: b.mahaLord,
                subLord: b.subLord,
                start: b.start.toISOString(),
                end: b.end.toISOString(),
                years: b.years.toFixed(3)
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Error in Bhukti calculation' });
    }
});

/**
 * GET /api/vimshottari/current
 * Get current running Dasha-Bhukti-Pratyantar
 */
router.get('/current', (req, res) => {
    try {
        const year = Number(req.query.year);
        const month = Number(req.query.month);
        const day = Number(req.query.day);
        const hour = Number(req.query.hour || 0);
        const minute = Number(req.query.minute || 0);
        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);
        const tz = Number(req.query.tz || 5.5);

        const birthDate = createDate(year, month, day, hour, minute, tz);
        const { positions } = calculatePlanetaryPositions(birthDate, lat, lon);
        const moonLong = positions.Moon.longitude;

        // Target date (default: today)
        const targetDate = req.query.targetDate
            ? new Date(req.query.targetDate)
            : new Date();

        const current = getCurrentDasha(birthDate, moonLong, targetDate);

        if (current.error) {
            return res.status(400).json(current);
        }

        res.json({
            birthDate: birthDate.toISOString(),
            targetDate: targetDate.toISOString(),
            moonLongitude: moonLong,
            current: {
                mahadasha: {
                    lord: current.mahadasha.lord,
                    start: current.mahadasha.start.toISOString(),
                    end: current.mahadasha.end.toISOString()
                },
                bhukti: {
                    lord: current.bhukti.subLord,
                    start: current.bhukti.start.toISOString(),
                    end: current.bhukti.end.toISOString()
                },
                pratyantar: current.pratyantar ? {
                    lord: current.pratyantar.pratyantarLord,
                    start: current.pratyantar.start.toISOString(),
                    end: current.pratyantar.end.toISOString()
                } : null
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Error in current Dasha calculation' });
    }
});

/**
 * GET /api/vimshottari/complete
 * Get complete Dasha system (Maha + all Bhuktis)
 */
router.get('/complete', (req, res) => {
    try {
        const year = Number(req.query.year);
        const month = Number(req.query.month);
        const day = Number(req.query.day);
        const hour = Number(req.query.hour || 0);
        const minute = Number(req.query.minute || 0);
        const lat = Number(req.query.lat);
        const lon = Number(req.query.lon);
        const tz = Number(req.query.tz || 5.5);

        const date = createDate(year, month, day, hour, minute, tz);
        const { positions } = calculatePlanetaryPositions(date, lat, lon);
        const moonLong = positions.Moon.longitude;

        const mahadashas = computeMahadashaSequence(date, moonLong);

        const complete = mahadashas.map(maha => {
            const bhuktis = computeBhuktisForMahadasha(maha);
            return {
                lord: maha.lord,
                start: maha.start.toISOString(),
                end: maha.end.toISOString(),
                years: maha.years.toFixed(2),
                bhuktis: bhuktis.map(b => ({
                    lord: b.subLord,
                    start: b.start.toISOString(),
                    end: b.end.toISOString(),
                    years: b.years.toFixed(3)
                }))
            };
        });

        res.json({
            input: { year, month, day, hour, minute, lat, lon, tz },
            moonLongitude: moonLong,
            dashaSystem: complete
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Error in complete Dasha calculation' });
    }
});

module.exports = router;
