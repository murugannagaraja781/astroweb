const fs = require('fs');
const path = require('path');
const parse = require('csv-parse/sync').parse;

let rows = [];
try {
    const csvPath = path.join(__dirname, '../places.csv');
    if (fs.existsSync(csvPath)) {
        rows = parse(fs.readFileSync(csvPath), { columns: true, skip_empty_lines: true });
    } else {
        console.warn("places.csv not found, using mock data");
        rows = [
            { place: 'Chennai', state: 'Tamil Nadu', district: 'Chennai', lat: 13.0827, lon: 80.2707 },
            { place: 'Mumbai', state: 'Maharashtra', district: 'Mumbai', lat: 19.0760, lon: 72.8777 },
            { place: 'Delhi', state: 'Delhi', district: 'Delhi', lat: 28.7041, lon: 77.1025 },
            { place: 'Bangalore', state: 'Karnataka', district: 'Bangalore', lat: 12.9716, lon: 77.5946 },
            { place: 'Kolkata', state: 'West Bengal', district: 'Kolkata', lat: 22.5726, lon: 88.3639 }
        ];
    }
} catch (e) {
    console.error("Error loading places.csv", e);
}

function findPlace(q) {
    if (!q) return [];
    q = q.toLowerCase();
    return rows.filter(r => (r.place || r.name || '').toLowerCase().includes(q)).slice(0, 10).map(r => ({ place: r.place, state: r.state, district: r.district, lat: parseFloat(r.lat), lon: parseFloat(r.lon) }));
}

module.exports = { findPlace };
