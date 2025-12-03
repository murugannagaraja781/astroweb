const {
    calculatePlanetaryPositions,
    calculateAscendant,
    createDate
} = require('vedic-astrology-api/lib/utils/common');
const { BirthChartGenerator } = require('vedic-astrology-api/lib/utils/birthchart');

try {
    console.log("Testing BirthChartGenerator...");

    const date = createDate(1990, 5, 15, 10, 30, 5.5);
    const lat = 13.0827;
    const lon = 80.2707;

    const { positions, ayanamsa } = calculatePlanetaryPositions(date, lat, lon);
    const ascendant = calculateAscendant(date, lat, lon);

    console.log("Positions keys:", Object.keys(positions));
    console.log("Ascendant:", ascendant);

    const generator = new BirthChartGenerator();
    const chart = generator.generateBirthChart(positions, ascendant);

    console.log("Chart Result:", JSON.stringify(chart, null, 2));

} catch (error) {
    console.error("Error during calculation:", error);
}
