jest.mock('axios');

describe('placeLookup', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('returns results from CSV when present', async () => {
    jest.doMock('fs', () => ({
      existsSync: () => true,
      readFileSync: () => Buffer.from(
        'place,state,district,lat,lon\nChennai,Tamil Nadu,Chennai,13.0827,80.2707\nMumbai,Maharashtra,Mumbai,19.0760,72.8777\n'
      )
    }));
    const { findPlace } = require('../utils/placeLookup');
    const results = await findPlace('Che');
    expect(Array.isArray(results)).toBe(true);
    expect(results[0]).toMatchObject({ place: 'Chennai', state: 'Tamil Nadu' });
    expect(typeof results[0].lat).toBe('number');
    expect(typeof results[0].lon).toBe('number');
  });

  test('queries Nominatim when CSV missing', async () => {
    const axios = require('axios');
    jest.doMock('fs', () => ({ existsSync: () => false }));
    axios.get.mockResolvedValue({
      data: [
        {
          display_name: 'Chennai, Tamil Nadu, India',
          address: { state: 'Tamil Nadu', state_district: 'Chennai' },
          lat: '13.0827',
          lon: '80.2707'
        }
      ]
    });
    const { findPlace } = require('../utils/placeLookup');
    const results = await findPlace('Che');
    expect(axios.get).toHaveBeenCalled();
    expect(results[0]).toMatchObject({ place: 'Chennai', state: 'Tamil Nadu' });
  });
});

