const express = require('express');
const request = require('supertest');

jest.mock('../utils/placeLookup', () => ({
  findPlace: jest.fn(async (q) => [
    { place: 'Chennai', state: 'Tamil Nadu', district: 'Chennai', lat: 13.0827, lon: 80.2707 }
  ])
}));

jest.mock('geo-tz', () => ({
  find: jest.fn(() => ['Asia/Kolkata'])
}));

const horoscopeRoutes = require('../routes/horoscopeRoutes');

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/horoscope', horoscopeRoutes);
  return app;
}

describe('Horoscope API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/horoscope/places returns suggestions', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/horoscope/places?q=Che');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toMatchObject({ place: 'Chennai' });
  });

  test('POST /api/horoscope/generate returns chart data', async () => {
    const app = makeApp();
    const payload = { name: 'Test User', date: '2000-11-04', time: '11:11', place: 'Chennai' };
    const res = await request(app).post('/api/horoscope/generate').send(payload);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('planets');
    expect(res.body).toHaveProperty('rasi');
    expect(res.body).toHaveProperty('houses');
    expect(res.body).toHaveProperty('navamsa');
    expect(res.body).toHaveProperty('dasa');
    expect(res.body).toHaveProperty('panchangam');
  });

  test('POST /api/horoscope/generate returns 404 when place not found', async () => {
    const { findPlace } = require('../utils/placeLookup');
    findPlace.mockResolvedValueOnce([]);
    const app = makeApp();
    const payload = { name: 'Test', date: '2000-11-04', time: '11:11', place: 'UnknownCity' };
    const res = await request(app).post('/api/horoscope/generate').send(payload);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'place not found');
  });
});

