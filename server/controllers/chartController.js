// Import individual modules from vedic-astrology-api
const { BirthChartGenerator } = require('vedic-astrology-api/lib/utils/birthchart');
const { ImprovedNavamsaChart } = require('vedic-astrology-api/lib/utils/navamsachart');
const { AccuratePoruthamCalculator } = require('vedic-astrology-api/lib/utils/porutham');
const { BehaviorPredictor } = require('vedic-astrology-api/lib/utils/behaviorPredictor');
const {
    validateInput,
    createDate,
    calculatePlanetaryPositions,
    calculateAscendant,
    getRashiFromLongitude,
    getNakshatraFromLongitude
} = require('vedic-astrology-api/lib/utils/common');
const { calculatePanchangam } = require('../utils/panchangamCalculator');

// Initialize generators
const birthChartGenerator = new BirthChartGenerator();
const navamsaCalculator = new ImprovedNavamsaChart();
const poruthamCalculator = new AccuratePoruthamCalculator();
const behaviorPredictor = new BehaviorPredictor();

/**
 * Generate Birth Chart (Rasi Chart)
 * POST /api/charts/birth-chart
 */
exports.generateBirthChart = async (req, res) => {
    try {
        const { year, month, day, hour, minute, latitude, longitude, timezone } = req.body;

        // Validate input
        const errors = validateInput({
            year,
            month,
            day,
            hour,
            minute,
            latitude,
            longitude,
            timezone
        });

        if (errors.length > 0) {
            return res.status(400).json({ error: 'Invalid input', details: errors });
        }

        // Create date and calculate positions
        const date = createDate(year, month, day, hour, minute, timezone);
        const { positions, ayanamsa } = calculatePlanetaryPositions(date, latitude, longitude);
        const ascendant = calculateAscendant(date, latitude, longitude);

        // Generate birth chart
        const birthChart = birthChartGenerator.generateBirthChart(positions, ascendant);

        // Transform planets to be grouped by house for the frontend
        const planetsByHouse = {};
        Object.entries(birthChart.planets).forEach(([planet, data]) => {
            const house = data.house;
            if (!planetsByHouse[house]) {
                planetsByHouse[house] = [];
            }
            planetsByHouse[house].push(planet);
        });

        // Add additional details
        const moonLongitude = positions.Moon.longitude;
        const moonRashi = getRashiFromLongitude(moonLongitude);
        const moonNakshatra = getNakshatraFromLongitude(moonLongitude);
        const lagna = getRashiFromLongitude(ascendant);

        // Calculate Panchangam
        const panchangam = calculatePanchangam(date, positions.Sun.longitude, positions.Moon.longitude);

        res.json({
            success: true,
            data: {
                houses: birthChart.houses,
                planets: planetsByHouse, // Send grouped planets
                rawPlanets: birthChart.planets, // Send raw data just in case
                ascendant,
                ayanamsa,
                lagna,
                moonSign: moonRashi,
                moonNakshatra,
                panchangam,
                positions,
                birthData: {
                    date: `${year}-${month}-${day}`,
                    time: `${hour}:${minute}`,
                    location: { latitude, longitude },
                    timezone
                }
            }
        });
    } catch (error) {
        console.error('Birth chart generation error:', error);
        res.status(500).json({ error: 'Failed to generate birth chart', message: error.message });
    }
};

/**
 * Generate Navamsa Chart (D9)
 * POST /api/charts/navamsa
 */
exports.generateNavamsaChart = async (req, res) => {
    try {
        const { year, month, day, hour, minute, latitude, longitude, timezone } = req.body;

        // Validate input
        const errors = validateInput({
            year,
            month,
            day,
            hour,
            minute,
            latitude,
            longitude,
            timezone
        });

        if (errors.length > 0) {
            return res.status(400).json({ error: 'Invalid input', details: errors });
        }

        // Create date and calculate positions
        const date = createDate(year, month, day, hour, minute, timezone);
        const { positions, ayanamsa } = calculatePlanetaryPositions(date, latitude, longitude);
        const ascendant = calculateAscendant(date, latitude, longitude);

        // Generate navamsa chart
        const navamsaChart = navamsaCalculator.generateNavamsaChart(
            Object.fromEntries(Object.entries(positions).map(([planet, data]) => [planet, data.longitude])),
            ayanamsa,
            ascendant,
            {
                date: `${year}-${month}-${day}`,
                time: `${hour}:${minute}`,
                latitude,
                longitude,
                timezone
            }
        );

        res.json({
            success: true,
            data: {
                navamsaChart,
                ayanamsa,
                birthData: {
                    date: `${year}-${month}-${day}`,
                    time: `${hour}:${minute}`,
                    location: { latitude, longitude },
                    timezone
                }
            }
        });
    } catch (error) {
        console.error('Navamsa chart generation error:', error);
        res.status(500).json({ error: 'Failed to generate navamsa chart', message: error.message });
    }
};

/**
 * Calculate Porutham (Compatibility)
 * POST /api/charts/porutham
 */
exports.calculatePorutham = async (req, res) => {
    try {
        const { person1, person2 } = req.body;

        if (!person1 || !person2) {
            return res.status(400).json({ error: 'Both person1 and person2 data required' });
        }

        // Validate person1 data
        const errors1 = validateInput({
            year: person1.year,
            month: person1.month,
            day: person1.day,
            hour: person1.hour,
            minute: person1.minute,
            latitude: person1.latitude,
            longitude: person1.longitude,
            timezone: person1.timezone
        });

        // Validate person2 data
        const errors2 = validateInput({
            year: person2.year,
            month: person2.month,
            day: person2.day,
            hour: person2.hour,
            minute: person2.minute,
            latitude: person2.latitude,
            longitude: person2.longitude,
            timezone: person2.timezone
        });

        if (errors1.length > 0 || errors2.length > 0) {
            return res.status(400).json({
                error: 'Invalid input',
                details: { person1: errors1, person2: errors2 }
            });
        }

        // Prepare data for porutham calculation
        const person1Data = {
            name: person1.name || 'Person 1',
            gender: person1.gender || 'male',
            date: new Date(person1.year, person1.month - 1, person1.day, person1.hour, person1.minute),
            latitude: person1.latitude,
            longitude: person1.longitude
        };

        const person2Data = {
            name: person2.name || 'Person 2',
            gender: person2.gender || 'female',
            date: new Date(person2.year, person2.month - 1, person2.day, person2.hour, person2.minute),
            latitude: person2.latitude,
            longitude: person2.longitude
        };

        // Calculate simplified compatibility
        const simplifiedResponse = await poruthamCalculator.getSimplifiedCompatibility(person1Data, person2Data);
        const simplified = simplifiedResponse.data || simplifiedResponse;

        // Calculate detailed porutham
        const detailedResponse = await poruthamCalculator.calculatePortuthamWithValidation(person1Data, person2Data);
        const detailed = detailedResponse.data || detailedResponse;

        res.json({
            success: true,
            data: {
                compatibility: simplified.compatibility,
                poruthams: detailed.poruthams,
                summary: detailed.summary || simplified.summary,
                person1: {
                    name: person1Data.name,
                    gender: person1Data.gender
                },
                person2: {
                    name: person2Data.name,
                    gender: person2Data.gender
                }
            }
        });
    } catch (error) {
        console.error('Porutham calculation error:', error);
        res.status(500).json({ error: 'Failed to calculate porutham', message: error.message });
    }
};

/**
 * Generate Behavior Predictions
 * POST /api/charts/behavior
 */
exports.generateBehaviorPredictions = async (req, res) => {
    try {
        const { year, month, day, hour, minute, latitude, longitude, timezone } = req.body;

        // Validate input
        const errors = validateInput({
            year,
            month,
            day,
            hour,
            minute,
            latitude,
            longitude,
            timezone
        });

        if (errors.length > 0) {
            return res.status(400).json({ error: 'Invalid input', details: errors });
        }

        // Create date and calculate positions
        const date = createDate(year, month, day, hour, minute, timezone);
        const { positions, ayanamsa } = calculatePlanetaryPositions(date, latitude, longitude);
        const ascendant = calculateAscendant(date, latitude, longitude);

        // Generate birth chart first
        const birthChart = birthChartGenerator.generateBirthChart(positions, ascendant);

        // Generate behavior predictions
        const behaviorPredictions = behaviorPredictor.generateBehaviorPredictions(
            birthChart,
            {
                ayanamsa,
                ascendant,
                rawPositions: Object.fromEntries(Object.entries(positions).map(([planet, data]) => [planet, data.longitude]))
            },
            ascendant,
            {
                birthDateTime: date.toISOString(),
                coordinates: { latitude, longitude },
                timezone
            }
        );

        res.json({
            success: true,
            data: {
                predictions: behaviorPredictions,
                birthData: {
                    date: `${year}-${month}-${day}`,
                    time: `${hour}:${minute}`,
                    location: { latitude, longitude },
                    timezone
                }
            }
        });
    } catch (error) {
        console.error('Behavior prediction error:', error);
        res.status(500).json({ error: 'Failed to generate behavior predictions', message: error.message });
    }
};

/**
 * Get complete astrological report (all charts)
 * POST /api/charts/complete-report
 */
exports.generateCompleteReport = async (req, res) => {
    try {
        const { year, month, day, hour, minute, latitude, longitude, timezone } = req.body;

        // Validate input
        const errors = validateInput({
            year,
            month,
            day,
            hour,
            minute,
            latitude,
            longitude,
            timezone
        });

        if (errors.length > 0) {
            return res.status(400).json({ error: 'Invalid input', details: errors });
        }

        // Create date and calculate positions
        const date = createDate(year, month, day, hour, minute, timezone);
        const { positions, ayanamsa } = calculatePlanetaryPositions(date, latitude, longitude);
        const ascendant = calculateAscendant(date, latitude, longitude);

        // Generate all charts
        const birthChart = birthChartGenerator.generateBirthChart(positions, ascendant);

        const navamsaChart = navamsaCalculator.generateNavamsaChart(
            Object.fromEntries(Object.entries(positions).map(([planet, data]) => [planet, data.longitude])),
            ayanamsa,
            ascendant,
            {
                date: `${year}-${month}-${day}`,
                time: `${hour}:${minute}`,
                latitude,
                longitude,
                timezone
            }
        );

        const behaviorPredictions = behaviorPredictor.generateBehaviorPredictions(
            birthChart,
            {
                ayanamsa,
                ascendant,
                rawPositions: Object.fromEntries(Object.entries(positions).map(([planet, data]) => [planet, data.longitude]))
            },
            ascendant,
            {
                birthDateTime: date.toISOString(),
                coordinates: { latitude, longitude },
                timezone
            }
        );

        // Transform planets to be grouped by house for the frontend
        const planetsByHouse = {};
        Object.entries(birthChart.planets).forEach(([planet, data]) => {
            const house = data.house;
            if (!planetsByHouse[house]) {
                planetsByHouse[house] = [];
            }
            planetsByHouse[house].push(planet);
        });

        // Add additional details
        const moonLongitude = positions.Moon.longitude;
        const moonRashi = getRashiFromLongitude(moonLongitude);
        const moonNakshatra = getNakshatraFromLongitude(moonLongitude);
        const lagna = getRashiFromLongitude(ascendant);

        res.json({
            success: true,
            data: {
                birthChart: {
                    houses: birthChart.houses,
                    planets: planetsByHouse, // Send grouped planets
                    rawPlanets: birthChart.planets,
                    lagna,
                    moonSign: moonRashi,
                    moonNakshatra
                },
                navamsaChart,
                behaviorPredictions,
                planetaryPositions: positions,
                ascendant,
                ayanamsa,
                birthData: {
                    date: `${year}-${month}-${day}`,
                    time: `${hour}:${minute}`,
                    location: { latitude, longitude },
                    timezone
                }
            }
        });
    } catch (error) {
        console.error('Complete report generation error:', error);
        res.status(500).json({ error: 'Failed to generate complete report', message: error.message });
    }
};
