const request = require('supertest');
const express = require('express');
const chartController = require('../controllers/chartController');

// Mock the vedic-astrology-api modules
jest.mock('vedic-astrology-api/lib/utils/birthchart');
jest.mock('vedic-astrology-api/lib/utils/navamsachart');
jest.mock('vedic-astrology-api/lib/utils/porutham');
jest.mock('vedic-astrology-api/lib/utils/behaviorPredictor');
jest.mock('vedic-astrology-api/lib/utils/common');

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

// Create express app for testing
const app = express();
app.use(express.json());

// Add routes
app.post('/birth-chart', chartController.generateBirthChart);
app.post('/navamsa', chartController.generateNavamsaChart);
app.post('/porutham', chartController.calculatePorutham);
app.post('/behavior', chartController.generateBehaviorPredictions);
app.post('/complete-report', chartController.generateCompleteReport);

describe('Chart Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock validateInput to return no errors
        validateInput.mockReturnValue([]);

        // Mock common functions
        createDate.mockReturnValue(new Date('1990-05-15T10:30:00Z'));
        calculatePlanetaryPositions.mockReturnValue({
            positions: {
                Sun: { longitude: 50.5 },
                Moon: { longitude: 120.3 },
                Mars: { longitude: 200.1 },
                Mercury: { longitude: 45.7 },
                Jupiter: { longitude: 180.9 },
                Venus: { longitude: 75.2 },
                Saturn: { longitude: 290.6 },
                Rahu: { longitude: 100.4 },
                Ketu: { longitude: 280.4 }
            },
            ayanamsa: 24.12
        });
        calculateAscendant.mockReturnValue(85.5);
        getRashiFromLongitude.mockReturnValue({ name: 'Gemini', number: 3 });
        getNakshatraFromLongitude.mockReturnValue({ name: 'Punarvasu', number: 7 });

        // Mock BirthChartGenerator
        BirthChartGenerator.mockImplementation(() => ({
            generateBirthChart: jest.fn().mockReturnValue({
                houses: {
                    1: { name: 'Gemini', lord: 'Mercury' },
                    2: { name: 'Cancer', lord: 'Moon' }
                },
                planets: {
                    1: ['Sun', 'Mercury'],
                    5: ['Moon']
                }
            })
        }));

        // Mock NavamsaChart
        ImprovedNavamsaChart.mockImplementation(() => ({
            generateNavamsaChart: jest.fn().mockReturnValue({
                houses: {},
                planets: {}
            })
        }));

        // Mock Porutham Calculator
        AccuratePoruthamCalculator.mockImplementation(() => ({
            getSimplifiedCompatibility: jest.fn().mockResolvedValue({
                compatibility: { percentage: 75, verdict: 'Good' }
            }),
            calculatePortuthamWithValidation: jest.fn().mockResolvedValue({
                poruthams: [
                    { name: 'Dina Porutham', isCompatible: true, score: 3 },
                    { name: 'Gana Porutham', isCompatible: true, score: 6 }
                ]
            })
        }));

        // Mock Behavior Predictor
        BehaviorPredictor.mockImplementation(() => ({
            generateBehaviorPredictions: jest.fn().mockReturnValue({
                personality: ['Creative', 'Analytical'],
                career: ['Technology', 'Arts']
            })
        }));
    });

    describe('POST /birth-chart', () => {
        it('should generate birth chart successfully', async () => {
            const response = await request(app)
                .post('/birth-chart')
                .send({
                    year: 1990,
                    month: 5,
                    day: 15,
                    hour: 10,
                    minute: 30,
                    latitude: 13.0827,
                    longitude: 80.2707,
                    timezone: 5.5
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('houses');
            expect(response.body.data).toHaveProperty('planets');
            expect(response.body.data).toHaveProperty('ascendant');
            expect(response.body.data).toHaveProperty('lagna');
            expect(response.body.data).toHaveProperty('moonSign');
            expect(response.body.data).toHaveProperty('moonNakshatra');
        });

        it('should return 400 for invalid input', async () => {
            validateInput.mockReturnValue(['Invalid date']);

            const response = await request(app)
                .post('/birth-chart')
                .send({
                    year: 'invalid',
                    month: 5,
                    day: 15
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should handle errors gracefully', async () => {
            calculatePlanetaryPositions.mockImplementation(() => {
                throw new Error('Calculation failed');
            });

            const response = await request(app)
                .post('/birth-chart')
                .send({
                    year: 1990,
                    month: 5,
                    day: 15,
                    hour: 10,
                    minute: 30,
                    latitude: 13.0827,
                    longitude: 80.2707,
                    timezone: 5.5
                });

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /navamsa', () => {
        it('should generate navamsa chart successfully', async () => {
            const response = await request(app)
                .post('/navamsa')
                .send({
                    year: 1990,
                    month: 5,
                    day: 15,
                    hour: 10,
                    minute: 30,
                    latitude: 13.0827,
                    longitude: 80.2707,
                    timezone: 5.5
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('navamsaChart');
            expect(response.body.data).toHaveProperty('ayanamsa');
        });
    });

    describe('POST /porutham', () => {
        it('should calculate compatibility successfully', async () => {
            const response = await request(app)
                .post('/porutham')
                .send({
                    person1: {
                        name: 'John',
                        gender: 'male',
                        year: 1990,
                        month: 5,
                        day: 15,
                        hour: 10,
                        minute: 30,
                        latitude: 13.0827,
                        longitude: 80.2707,
                        timezone: 5.5
                    },
                    person2: {
                        name: 'Jane',
                        gender: 'female',
                        year: 1992,
                        month: 8,
                        day: 22,
                        hour: 14,
                        minute: 45,
                        latitude: 12.9716,
                        longitude: 77.5946,
                        timezone: 5.5
                    }
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('compatibility');
            expect(response.body.data).toHaveProperty('poruthams');
            expect(response.body.data.compatibility.percentage).toBe(75);
        });

        it('should return 400 if person data is missing', async () => {
            const response = await request(app)
                .post('/porutham')
                .send({
                    person1: {
                        year: 1990,
                        month: 5,
                        day: 15
                    }
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('person1 and person2');
        });
    });

    describe('POST /behavior', () => {
        it('should generate behavior predictions successfully', async () => {
            const response = await request(app)
                .post('/behavior')
                .send({
                    year: 1990,
                    month: 5,
                    day: 15,
                    hour: 10,
                    minute: 30,
                    latitude: 13.0827,
                    longitude: 80.2707,
                    timezone: 5.5
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('predictions');
            expect(response.body.data.predictions).toHaveProperty('personality');
            expect(response.body.data.predictions).toHaveProperty('career');
        });
    });

    describe('POST /complete-report', () => {
        it('should generate complete report with all charts', async () => {
            const response = await request(app)
                .post('/complete-report')
                .send({
                    year: 1990,
                    month: 5,
                    day: 15,
                    hour: 10,
                    minute: 30,
                    latitude: 13.0827,
                    longitude: 80.2707,
                    timezone: 5.5
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('birthChart');
            expect(response.body.data).toHaveProperty('navamsaChart');
            expect(response.body.data).toHaveProperty('behaviorPredictions');
            expect(response.body.data).toHaveProperty('planetaryPositions');
            expect(response.body.data).toHaveProperty('ascendant');
            expect(response.body.data).toHaveProperty('ayanamsa');
        });
    });
});
