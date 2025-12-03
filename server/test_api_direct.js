const {
    calculatePlanetaryPositions,
    calculateAscendant,
    createDate
} = require('vedic-astrology-api/lib/utils/common');

try {
    console.log("Testing vedic-astrology-api calculations...");

    const date = createDate(1990, 5, 15, 10, 30, 5.5);
    console.log("Date created:", date);

    const lat = 13.0827;
    const lon = 80.2707;

    console.log(`Calculating positions for Lat: ${lat}, Lon: ${lon}`);

    const positionsResult = calculatePlanetaryPositions(date, lat, lon);
    console.log("Positions Result:", JSON.stringify(positionsResult, null, 2));

    const ascendant = calculateAscendant(date, lat, lon);
    console.log("Ascendant:", ascendant);

} catch (error) {
    console.error("Error during calculation:", error);
}
