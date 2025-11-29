function computeNavamsa(lon) {
    const normalized = ((lon % 360) + 360) % 360;
    const sign = Math.floor(normalized / 30); // 0..11
    const degInSign = normalized % 30;
    const navIndexInSign = Math.floor(degInSign / (30 / 9));
    const d9Index = sign * 9 + navIndexInSign; // 0..107
    const navSign = Math.floor(d9Index / 9) % 12;
    const navDeg = (d9Index % 9) * (30 / 9);
    return { d9Index, navSign, navDeg, navSignName: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'][navSign] };
}

module.exports = { computeNavamsa };
