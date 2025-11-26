const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/sync").parse;
const axios = require("axios");

// Load CSV once
let rows = [];
try {
  const csvPath = path.join(__dirname, "./city.csv");

  if (fs.existsSync(csvPath)) {
    rows = parse(fs.readFileSync(csvPath), {
      columns: true,
      skip_empty_lines: true,
    });
    console.log("Loaded city.csv");
  } else {
    console.warn("city.csv not found, loading mock data");
    rows = [
      {
        place: "Chennai",
        state: "Tamil Nadu",
        district: "Chennai",
        lat: 13.0827,
        lon: 80.2707,
      },
      {
        place: "Mumbai",
        state: "Maharashtra",
        district: "Mumbai",
        lat: 19.076,
        lon: 72.8777,
      },
      {
        place: "Delhi",
        state: "Delhi",
        district: "Delhi",
        lat: 28.7041,
        lon: 77.1025,
      },
    ];
  }
} catch (e) {
  console.error("Error loading CSV:", e);
}

// FIXED FUNCTION
async function findPlace(q) {
  if (!q) return [];

  const qq = q.toLowerCase();

  // STEP 1 — Search CSV
  const localMatches = rows
    .filter((r) => (r.place || "").toLowerCase().includes(qq))
    .slice(0, 10)
    .map((r) => ({
      place: r.place,
      state: r.state,
      district: r.district,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
    }));

  // If found locally → return
  if (localMatches.length > 0) {
    return localMatches;
  }

  // STEP 2 — Fallback to Nominatim (API lookup)
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        format: "json",
        limit: 10,
        q: q,
        countrycodes: "in",
        addressdetails: 1,
      },
      headers: {
        "User-Agent": "PlaceLookup/1.0 (contact: example@example.com)",
      },
    });

    return (res.data || []).map((item) => ({
      place: item.display_name?.split(",")[0] || q,
      state: item.address?.state || "",
      district: item.address?.county || item.address?.state_district || "",
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }));
  } catch (e) {
    console.error("API lookup failed", e);
    return [];
  }
}

module.exports = { findPlace };
