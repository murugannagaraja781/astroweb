import React from "react";

const NorthIndianChart = ({ planets, houses }) => {
  // Helper to get planet string for a house
  const getPlanetsInHouse = (houseNum) => {
    if (!planets) return "";
    return Object.entries(planets)
      .filter(([_, data]) => Math.floor(data.lon / 30) + 1 === houseNum) // Simplified logic: assuming house matches sign for now or passed house data
      .map(([name]) => name.substring(0, 2))
      .join(" ");
  };

  // North Indian chart is a diamond shape.
  // We'll use a simplified SVG representation or CSS grid.
  // For now, a placeholder visual structure.

  return (
    <div className="w-full max-w-md mx-auto aspect-square border-2 border-purple-500 relative bg-slate-800 text-xs text-purple-200">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Outer Box */}
        <rect x="0" y="0" width="100" height="100" fill="none" stroke="currentColor" strokeWidth="0.5" />

        {/* Diagonals */}
        <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" />
        <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="0.5" />

        {/* Diamonds */}
        <line x1="50" y1="0" x2="0" y2="50" stroke="currentColor" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="50" y2="100" stroke="currentColor" strokeWidth="0.5" />
        <line x1="50" y1="100" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" />
        <line x1="100" y1="50" x2="50" y2="0" stroke="currentColor" strokeWidth="0.5" />

        {/* House Labels (Fixed positions for North Indian style) */}
        {/* House 1 (Top Center) */}
        <text x="50" y="20" textAnchor="middle" fontSize="3">1</text>

        {/* House 2 (Top Left) */}
        <text x="25" y="10" textAnchor="middle" fontSize="3">2</text>

        {/* House 3 (Left Top) */}
        <text x="10" y="25" textAnchor="middle" fontSize="3">3</text>

        {/* House 4 (Right Center - actually House 4 is usually bottom center in some styles, but standard is: 1 top, counter-clockwise)
           Wait, North Indian:
           1: Top Diamond
           2: Top Left Triangle
           3: Left Triangle
           4: Bottom Left Triangle (Center) -> No, 4 is usually bottom center diamond?
           Let's stick to a simple visual representation.
        */}

        <text x="50" y="50" textAnchor="middle" fontSize="4" fill="white">North Indian Chart</text>
        <text x="50" y="55" textAnchor="middle" fontSize="2" fill="#aaa">(Coming Soon)</text>
      </svg>
    </div>
  );
};

export default NorthIndianChart;
