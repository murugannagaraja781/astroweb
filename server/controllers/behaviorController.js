// Import from vedic-astrology-api
const { BehaviorPredictor } = require('vedic-astrology-api/lib/utils/behaviorPredictor');
const {
    validateInput,
    createDate,
    calculatePlanetaryPositions,
    calculateAscendant
} = require('vedic-astrology-api/lib/utils/common');

// Initialize behavior predictor
const behaviorPredictor = new BehaviorPredictor();

exports.generateBehaviorAnalysis = async (req, res) => {
  try {
    const { year, month, day, hour, minute, latitude, longitude, timezone } = req.body;

    // Validate input
    const errors = validateInput({
      year,
      month,
      day,
      hour,
      minute,
      latitude,
      longitude,
      timezone
    });

    if (errors.length > 0) {
      return res.status(400).json({ msg: 'Invalid input', details: errors });
    }

    // Create date and calculate positions
    const date = createDate(year, month, day, hour, minute, timezone);
    const { positions, ayanamsa } = calculatePlanetaryPositions(date, latitude, longitude);
    const ascendant = calculateAscendant(date, latitude, longitude);

    // Generate behavior analysis
    const behaviorAnalysis = {
      metadata: {
        date: `${year}-${month}-${day}`,
        time: `${hour}:${minute}`,
        latitude: latitude,
        longitude: longitude,
        ascendant: ascendant,
        generatedAt: new Date().toISOString()
      },
      personality: generatePersonalityAnalysis(positions, ascendant),
      strengths: generateStrengths(positions),
      weaknesses: generateWeaknesses(positions),
      career: generateCareerAnalysis(positions),
      relationships: generateRelationshipAnalysis(positions),
      emotional: generateEmotionalAnalysis(positions),
      mental: generateMentalAnalysis(positions),
      physical: generatePhysicalAnalysis(positions),
      spiritual: generateSpiritualAnalysis(positions),
      planetaryInfluences: generatePlanetaryInfluences(positions)
    };

    res.json({
      success: true,
      data: behaviorAnalysis,
      positions: positions,
      ascendant: ascendant
    });

  } catch (error) {
    console.error('Error generating behavior analysis:', error);
    res.status(500).json({ msg: 'Error generating behavior analysis', error: error.message });
  }
};

// Helper functions
function generatePersonalityAnalysis(positions, ascendant) {
  const traits = [];
  if (positions.Sun) traits.push('Leadership qualities', 'Strong willpower', 'Confident');
  if (positions.Moon) traits.push('Emotional', 'Intuitive', 'Caring');
  if (positions.Mars) traits.push('Energetic', 'Courageous', 'Action-oriented');

  return {
    core: traits,
    traits: {
      dominant: ['Determined', 'Ambitious', 'Practical'],
      secondary: ['Creative', 'Analytical', 'Social'],
      hidden: ['Sensitive', 'Philosophical', 'Perfectionist']
    },
    temperament: {
      type: 'Balanced',
      intensity: 'Moderate to High',
      stability: 'Generally Stable',
      adaptability: 'Flexible'
    }
  };
}

function generateStrengths(positions) {
  return [
    { area: 'Communication', level: 'High', description: 'Excellent verbal and written skills' },
    { area: 'Leadership', level: 'Strong', description: 'Natural ability to guide others' },
    { area: 'Creativity', level: 'Moderate', description: 'Good creative problem-solving' },
    { area: 'Analytical', level: 'High', description: 'Strong logical reasoning' },
    { area: 'Emotional Intelligence', level: 'Moderate', description: 'Good understanding of emotions' }
  ];
}

function generateWeaknesses(positions) {
  return [
    { area: 'Impatience', level: 'Moderate', description: 'May rush decisions' },
    { area: 'Stubbornness', level: 'Low', description: 'Occasionally inflexible' },
    { area: 'Overthinking', level: 'Moderate', description: 'Tendency to overanalyze' },
    { area: 'Perfectionism', level: 'High', description: 'May set unrealistic standards' }
  ];
}

function generateCareerAnalysis(positions) {
  return {
    suitableFields: ['Technology', 'Business', 'Education', 'Healthcare', 'Creative Arts'],
    workStyle: 'Independent with team collaboration',
    leadership: 'Strong leadership potential',
    innovation: 'High innovative capacity',
    bestRoles: ['Manager', 'Consultant', 'Entrepreneur', 'Specialist', 'Advisor']
  };
}

function generateRelationshipAnalysis(positions) {
  return {
    style: 'Loyal and committed',
    communication: 'Open and honest',
    compatibility: ['Water signs', 'Earth signs'],
    challenges: ['Need for independence', 'High expectations'],
    strengths: ['Supportive', 'Understanding', 'Protective']
  };
}

function generateEmotionalAnalysis(positions) {
  return {
    expression: 'Moderate to reserved',
    depth: 'Deep emotional capacity',
    stability: 'Generally stable with occasional fluctuations',
    sensitivity: 'Moderately sensitive',
    coping: 'Rational approach with emotional awareness'
  };
}

function generateMentalAnalysis(positions) {
  return {
    intelligence: 'Above average',
    learningStyle: 'Visual and practical',
    focus: 'Good concentration ability',
    memory: 'Strong long-term memory',
    decisionMaking: 'Logical with intuitive insights',
    creativity: 'Innovative thinking'
  };
}

function generatePhysicalAnalysis(positions) {
  return {
    constitution: 'Moderate to strong',
    energy: 'High energy levels',
    health: 'Generally good health',
    vitality: 'Strong vitality',
    vulnerabilities: ['Stress-related issues', 'Digestive system'],
    recommendations: ['Regular exercise', 'Balanced diet', 'Stress management']
  };
}

function generateSpiritualAnalysis(positions) {
  return {
    inclination: 'Moderate to high',
    practices: ['Meditation', 'Yoga', 'Contemplation'],
    beliefs: 'Open-minded and philosophical',
    growth: 'Steady spiritual development',
    connection: 'Strong connection to higher consciousness'
  };
}

function generatePlanetaryInfluences(positions) {
  const influences = [];
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

  const planetInfluences = {
    Sun: 'Ego, vitality, leadership',
    Moon: 'Emotions, mind, intuition',
    Mars: 'Energy, courage, action',
    Mercury: 'Communication, intellect',
    Jupiter: 'Wisdom, expansion, luck',
    Venus: 'Love, beauty, harmony',
    Saturn: 'Discipline, responsibility',
    Rahu: 'Desires, ambitions',
    Ketu: 'Spirituality, detachment'
  };

  Object.entries(positions).forEach(([planet, data]) => {
    const signIndex = Math.floor(data.longitude / 30);
    influences.push({
      planet: planet,
      sign: signs[signIndex],
      degree: (data.longitude % 30).toFixed(2),
      influence: planetInfluences[planet] || 'General influence'
    });
  });

  return influences;
}
