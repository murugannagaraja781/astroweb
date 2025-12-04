const axios = require('axios');

const payload = {
    year: 1993,
    month: 10,
    day: 29,
    hour: 6,
    minute: 45,
    lat: 8.964,
    lon: 77.315,
    tz: 5.5
};

axios.post('https://apidash-production.up.railway.app/api/vimshottari', payload)
    .then(response => {
        console.log(JSON.stringify(response.data, null, 2));
    })
    .catch(error => {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    });
