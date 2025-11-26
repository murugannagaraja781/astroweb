const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/sync").parse;
const axios = require("axios");

let rows = [];
try {
  const csvPath = path.join(__dirname, "./city.csv");
  if (fs.existsSync(csvPath)) {
    rows = parse(fs.readFileSync(csvPath), {
      columns: true,
      skip_empty_lines: true,
    });
  } else {
    console.warn("city.csv not found, no local places loaded");
    rows = [];
  }
} catch (e) {
  console.error("Error loading places.csv", e);
}

async function findPlace(q) {
  if (!q) return [];
  const hasLocal = rows && rows.length > 0;
  if (hasLocal) {
    const qq = q.toLowerCase();
    return rows
      .map((r) => ({
        place: r.place || r.name || r.iPlace || "",
        state: r.state || r.iState || "",
        district: r.district || r.iDistrict || r.icountry || "",
        lat: parseFloat(r.lat ?? r.latitude ?? r.iLatitude ?? r.ilatitudeindia),
        lon: parseFloat(
          r.lon ?? r.longitude ?? r.iLongitude ?? r.iLongitudeindia
        ),
      }))
      .filter((r) => (r.place || "").toLowerCase().includes(qq))
      .slice(0, 10);
  }
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        format: "json",
        limit: 10,
        countrycodes: "in",
        addressdetails: 1,
        q,
      },
      headers: { "User-Agent": "AstroWeb/1.0 (contact: support@example.com)" },
    });
    return (res.data || []).map((item) => ({
      place: item.display_name?.split(",")[0] || q,
      state: item.address?.state || "",
      district: item.address?.county || item.address?.state_district || "",
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }));
  } catch (e) {
    return [];
  }
}

module.exports = { findPlace };
