import { useState } from 'react';
import { Download, Globe, Copy, Check } from 'lucide-react';

const BehaviorAnalysis = ({ data, onBack, onClose }) => {
  const [language, setLanguage] = useState('english');
  const [copied, setCopied] = useState(false);

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex gap-3 justify-between">
          <button onClick={onBack} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors">← Back</button>
        </div>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold text-red-700 mb-2">No Analysis Data</h3>
          <p className="text-red-600">Unable to display analysis. Please try again.</p>
        </div>
      </div>
    );
  }

  const { planets, houses, ascendant, moonSign, birthData, positions } = data;

  // Translations
  const translations = {
    english: {
      title: 'Behavior Analysis',
      personality: 'Personality Traits',
      strengths: 'Strengths',
      weaknesses: 'Weaknesses',
      career: 'Career Tendencies',
      relationships: 'Relationship Style',
      emotional: 'Emotional Nature',
      mental: 'Mental Characteristics',
      physical: 'Physical Attributes',
      spiritual: 'Spiritual Inclination',
      download: 'Download JSON',
      copy: 'Copy JSON',
      copied: 'Copied!',
      back: 'Back',
      done: 'Done'
    },
    tamil: {
      title: 'நடத்தை பகுப்பாய்வு',
      personality: 'ஆளுமை பண்புகள்',
      strengths: 'பலம்',
      weaknesses: 'பலவீனம்',
      career: 'தொழில் போக்குகள்',
      relationships: 'உறவு முறை',
      emotional: 'உணர்ச்சி இயல்பு',
      mental: 'மன பண்புகள்',
      physical: 'உடல் பண்புகள்',
      spiritual: 'ஆன்மீக சார்பு',
      download: 'பதிவிறக்கம்',
      copy: 'நகலெடு',
      copied: 'நகலெடுக்கப்பட்டது!',
      back: 'பின்செல்',
      done: 'முடிந்தது'
    },
    hindi: {
      title: 'व्यवहार विश्लेषण',
      personality: 'व्यक्तित्व लक्षण',
      strengths: 'शक्तियां',
      weaknesses: 'कमजोरियां',
      career: 'करियर प्रवृत्तियां',
      relationships: 'संबंध शैली',
      emotional: 'भावनात्मक प्रकृति',
      mental: 'मानसिक विशेषताएं',
      physical: 'शारीरिक गुण',
      spiritual: 'आध्यात्मिक झुकाव',
      download: 'डाउनलोड',
      copy: 'कॉपी करें',
      copied: 'कॉपी हो गया!',
      back: 'वापस',
      done: 'हो गया'
    }
  };

  const t = translations[language];

  // Generate Behavior Analysis based on planetary positions
  const generateBehaviorAnalysis = () => {
    const analysis = {
      metadata: {
        name: birthData?.name || 'Unknown',
        date: birthData?.date || 'N/A',
        time: birthData?.time || 'N/A',
        place: birthData?.place || 'N/A',
        ascendant: ascendant || 'N/A',
        moonSign: moonSign?.name || 'N/A',
        generatedAt: new Date().toISOString()
      },
      personality: {
        core: analyzeCorePersonality(),
        traits: analyzeTraits(),
        temperament: analyzeTemperament()
      },
      strengths: analyzeStrengths(),
      weaknesses: analyzeWeaknesses(),
      career: analyzeCareer(),
      relationships: analyzeRelationships(),
      emotional: analyzeEmotional(),
      mental: analyzeMental(),
      physical: analyzePhysical(),
      spiritual: analyzeSpiritual(),
      planetaryInfluences: analyzePlanetaryInfluences()
    };

    return analysis;
  };

  // Analysis Functions
  const analyzeCorePersonality = () => {
    const traits = [];
    if (positions?.Sun) traits.push('Leadership qualities', 'Strong willpower', 'Confident');
    if (positions?.Moon) traits.push('Emotional', 'Intuitive', 'Caring');
    if (positions?.Mars) traits.push('Energetic', 'Courageous', 'Action-oriented');
    return traits;
  };

  const analyzeTraits = () => {
    return {
      dominant: ['Determined', 'Ambitious', 'Practical'],
      secondary: ['Creative', 'Analytical', 'Social'],
      hidden: ['Sensitive', 'Philosophical', 'Perfectionist']
    };
  };

  const analyzeTemperament = () => {
    return {
      type: 'Balanced',
      intensity: 'Moderate to High',
      stability: 'Generally Stable',
      adaptability: 'Flexible'
    };
  };

  const analyzeStrengths = () => {
    return [
      { area: 'Communication', level: 'High', description: 'Excellent verbal and written skills' },
      { area: 'Leadership', level: 'Strong', description: 'Natural ability to guide others' },
      { area: 'Creativity', level: 'Moderate', description: 'Good creative problem-solving' },
      { area: 'Analytical', level: 'High', description: 'Strong logical reasoning' },
      { area: 'Emotional Intelligence', level: 'Moderate', description: 'Good understanding of emotions' }
    ];
  };

  const analyzeWeaknesses = () => {
    return [
      { area: 'Impatience', level: 'Moderate', description: 'May rush decisions' },
      { area: 'Stubbornness', level: 'Low', description: 'Occasionally inflexible' },
      { area: 'Overthinking', level: 'Moderate', description: 'Tendency to overanalyze' },
      { area: 'Perfectionism', level: 'High', description: 'May set unrealistic standards' }
    ];
  };

  const analyzeCareer = () => {
    return {
      suitableFields: ['Technology', 'Business', 'Education', 'Healthcare', 'Creative Arts'],
      workStyle: 'Independent with team collaboration',
      leadership: 'Strong leadership potential',
      innovation: 'High innovative capacity',
      bestRoles: ['Manager', 'Consultant', 'Entrepreneur', 'Specialist', 'Advisor']
    };
  };

  const analyzeRelationships = () => {
    return {
      style: 'Loyal and committed',
      communication: 'Open and honest',
      compatibility: ['Water signs', 'Earth signs'],
      challenges: ['Need for independence', 'High expectations'],
      strengths: ['Supportive', 'Understanding', 'Protective']
    };
  };

  const analyzeEmotional = () => {
    return {
      expression: 'Moderate to reserved',
      depth: 'Deep emotional capacity',
      stability: 'Generally stable with occasional fluctuations',
      sensitivity: 'Moderately sensitive',
      coping: 'Rational approach with emotional awareness'
    };
  };

  const analyzeMental = () => {
    return {
      intelligence: 'Above average',
      learningStyle: 'Visual and practical',
      focus: 'Good concentration ability',
      memory: 'Strong long-term memory',
      decisionMaking: 'Logical with intuitive insights',
      creativity: 'Innovative thinking'
    };
  };

  const analyzePhysical = () => {
    return {
      constitution: 'Moderate to strong',
      energy: 'High energy levels',
      health: 'Generally good health',
      vitality: 'Strong vitality',
      vulnerabilities: ['Stress-related issues', 'Digestive system'],
      recommendations: ['Regular exercise', 'Balanced diet', 'Stress management']
    };
  };

  const analyzeSpiritual = () => {
    return {
      inclination: 'Moderate to high',
      practices: ['Meditation', 'Yoga', 'Contemplation'],
      beliefs: 'Open-minded and philosophical',
      growth: 'Steady spiritual development',
      connection: 'Strong connection to higher consciousness'
    };
  };

  const analyzePlanetaryInfluences = () => {
    const influences = [];

    if (positions) {
      Object.entries(positions).forEach(([planet, data]) => {
        const signIndex = Math.floor(data.longitude / 30);
        const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

        influences.push({
          planet: planet,
          sign: signs[signIndex],
          degree: (data.longitude % 30).toFixed(2),
          influence: getPlanetaryInfluence(planet, signIndex)
        });
      });
    }

    return influences;
  };

  const getPlanetaryInfluence = (planet, signIndex) => {
    const influences = {
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
    return influences[planet] || 'General influence';
  };

  const behaviorData = generateBehaviorAnalysis();

  // Copy JSON to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(behaviorData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download JSON
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(behaviorData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `behavior-analysis-${birthData?.name || 'chart'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex gap-2">
          <button onClick={onBack} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm">
            {t.back}
          </button>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none pl-9 pr-8 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors text-sm cursor-pointer outline-none focus:ring-2 focus:ring-purple-200"
            >
              <option value="english">English</option>
              <option value="tamil">தமிழ்</option>
              <option value="hindi">हिंदी</option>
            </select>
            <Globe className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm shadow-md hover:shadow-lg"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? t.copied : t.copy}
          </button>
          <button
            onClick={downloadJSON}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm shadow-md hover:shadow-lg"
          >
            <Download className="w-4 h-4" />
            {t.download}
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors text-sm">
            {t.done}
          </button>
        </div>
      </div>

      {/* Birth Details Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🧠</span> {t.title}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-8 text-sm">
          <div>
            <div className="text-indigo-100 text-xs uppercase tracking-wider">Name</div>
            <div className="font-bold text-lg">{behaviorData.metadata.name}</div>
          </div>
          <div>
            <div className="text-indigo-100 text-xs uppercase tracking-wider">Date</div>
            <div className="font-bold text-lg">{behaviorData.metadata.date}</div>
          </div>
          <div>
            <div className="text-indigo-100 text-xs uppercase tracking-wider">Time</div>
            <div className="font-bold text-lg">{behaviorData.metadata.time}</div>
          </div>
          <div>
            <div className="text-indigo-100 text-xs uppercase tracking-wider">Ascendant</div>
            <div className="font-bold text-lg">{behaviorData.metadata.ascendant}</div>
          </div>
          <div>
            <div className="text-indigo-100 text-xs uppercase tracking-wider">Moon Sign</div>
            <div className="font-bold text-lg">{behaviorData.metadata.moonSign}</div>
          </div>
        </div>
      </div>

      {/* Behavior Analysis Grid - Similar to Navamsa Chart Layout */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-indigo-100">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="text-2xl">🎭</span>
          {t.personality}
        </h3>

        <div className="max-w-2xl mx-auto border-[3px] border-indigo-600 bg-[#F8F9FF] shadow-lg">
          <div className="grid grid-cols-4 divide-x divide-y divide-indigo-600">
            {/* Row 1 */}
            <div className="bg-purple-50 min-h-[100px] p-3 flex flex-col justify-start">
              <div className="text-xs font-bold text-purple-700 mb-2">{t.emotional}</div>
              <div className="text-xs text-gray-700 space-y-1">
                <div>• {behaviorData.emotional.expression}</div>
                <div>• {behaviorData.emotional.stability}</div>
              </div>
            </div>
            <div className="bg-blue-50 min-h-[100px] p-3 flex flex-col justify-start">
              <div className="text-xs font-bold text-blue-700 mb-2">{t.mental}</div>
              <div className="text-xs text-gray-700 space-y-1">
                <div>• {behaviorData.mental.intelligence}</div>
                <div>• {behaviorData.mental.learningStyle}</div>
              </div>
            </div>
            <div className="bg-green-50 min-h-[100px] p-3 flex flex-col justify-start">
              <div className="text-xs font-bold text-green-700 mb-2">{t.physical}</div>
              <div className="text-xs text-gray-700 space-y-1">
                <div>• {behaviorData.physical.constitution}</div>
                <div>• {behaviorData.physical.energy}</div>
              </div>
            </div>
            <div className="bg-yellow-50 min-h-[100px] p-3 flex flex-col justify-start">
              <div className="text-xs font-bold text-yellow-700 mb-2">{t.spiritual}</div>
              <div className="text-xs text-gray-700 space-y-1">
                <div>• {behaviorData.spiritual.inclination}</div>
                <div>• {behaviorData.spiritual.growth}</div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="bg-pink-50 min-h-[100px] p-3 flex flex-col justify-start">
              <div className="text-xs font-bold text-pink-700 mb-2">{t.relationships}</div>
              <div className="text-xs text-gray-700 space-y-1">
                <div>• {behaviorData.relationships.style}</div>
                <div>• {behaviorData.relationships.communication}</div>
              </div>
            </div>
            <div className="col-span-2 row-span-2 bg-white flex flex-col items-center justify-center relative overflow-hidden border-indigo-600">
              <div className="relative z-10 text-center space-y-3 p-4">
                <div className="text-indigo-800 font-bold text-2xl">{t.personality}</div>
                <div className="text-sm font-semibold text-gray-700">Core Traits</div>
                <div className="space-y-1">
                  {behaviorData.personality.core.slice(0, 3).map((trait, idx) => (
                    <div key={idx} className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                      {trait}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-orange-50 min-h-[100px] p-3 flex flex-col justify-start">
              <div className="text-xs font-bold text-orange-700 mb-2">{t.career}</div>
              <div className="text-xs text-gray-700 space-y-1">
                <div>• {behaviorData.career.workStyle}</div>
                <div>• {behaviorData.career.leadership}</div>
              </div>
            </div>

            {/* Row 3 */}
            <div className="bg-teal-50 min-h-[100px] p-3 flex flex-col justify-start">
              <div className="text-xs font-bold text-teal-700 mb-2">{t.strengths}</div>
              <div className="text-xs text-gray-700 space-y-1">
                {behaviorData.strengths.slice(0, 2).map((s, idx) => (
                  <div key={idx}>• {s.area}</div>
                ))}
              </div>
            </div>
            <div className="bg-red-50 min-h-[100px] p-3 flex flex-col justify-start">
              <div className="text-xs font-bold text-red-700 mb-2">{t.weaknesses}</div>
              <div className="text-xs text-gray-700 space-y-1">
                {behaviorData.weaknesses.slice(0, 2).map((w, idx) => (
                  <div key={idx}>• {w.area}</div>
                ))}
              </div>
            </div>

            {/* Row 4 */}
            <div className="bg-cyan-50 min-h-[100px] p-3 flex flex-col justify-start">
              <div className="text-xs font-bold text-cyan-700 mb-2">Temperament</div>
              <div className="text-xs text-gray-700 space-y-1">
                <div>• {behaviorData.personality.temperament.type}</div>
                <div>• {behaviorData.personality.temperament.adaptability}</div>
              </div>
            </div>
            <div className="bg-lime-50 min-h-[100px] p-3 flex flex-col justify-start">
              <div className="text-xs font-bold text-lime-700 mb-2">Decision Making</div>
              <div className="text-xs text-gray-700 space-y-1">
                <div>• {behaviorData.mental.decisionMaking}</div>
                <div>• {behaviorData.mental.creativity}</div>
              </div>
            </div>
            <div className="bg-amber-50 min-h-[100px] p-3 flex flex-col justify-start">
              <div className="text-xs font-bold text-amber-700 mb-2">Communication</div>
              <div className="text-xs text-gray-700 space-y-1">
                {behaviorData.strengths.filter(s => s.area === 'Communication').map((s, idx) => (
                  <div key={idx}>• {s.level}</div>
                ))}
                <div>• Open & Honest</div>
              </div>
            </div>
            <div className="bg-violet-50 min-h-[100px] p-3 flex flex-col justify-start">
              <div className="text-xs font-bold text-violet-700 mb-2">Growth Areas</div>
              <div className="text-xs text-gray-700 space-y-1">
                <div>• Self-awareness</div>
                <div>• Adaptability</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">💪</span> {t.strengths}
          </h3>
          <div className="space-y-3">
            {behaviorData.strengths.map((strength, idx) => (
              <div key={idx} className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-green-800">{strength.area}</span>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">{strength.level}</span>
                </div>
                <p className="text-xs text-gray-600">{strength.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-red-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚠️</span> {t.weaknesses}
          </h3>
          <div className="space-y-3">
            {behaviorData.weaknesses.map((weakness, idx) => (
              <div key={idx} className="bg-red-50 rounded-lg p-3 border border-red-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-red-800">{weakness.area}</span>
                  <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">{weakness.level}</span>
                </div>
                <p className="text-xs text-gray-600">{weakness.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Career Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">💼</span> {t.career}
          </h3>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Suitable Fields</div>
              <div className="flex flex-wrap gap-2">
                {behaviorData.career.suitableFields.map((field, idx) => (
                  <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                    {field}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Best Roles</div>
              <div className="flex flex-wrap gap-2">
                {behaviorData.career.bestRoles.map((role, idx) => (
                  <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-200">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Relationships Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-pink-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">❤️</span> {t.relationships}
          </h3>
          <div className="space-y-3">
            <div className="bg-pink-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Style</div>
              <div className="font-semibold text-pink-800">{behaviorData.relationships.style}</div>
            </div>
            <div className="bg-pink-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Strengths</div>
              <div className="flex flex-wrap gap-2">
                {behaviorData.relationships.strengths.map((s, idx) => (
                  <span key={idx} className="text-xs bg-pink-200 text-pink-800 px-2 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Planetary Influences */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-purple-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">🪐</span> Planetary Influences
        </h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Planet</th>
                <th className="py-3 px-4">Sign</th>
                <th className="py-3 px-4">Degree</th>
                <th className="py-3 px-4">Influence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {behaviorData.planetaryInfluences.map((influence, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-purple-700">{influence.planet}</td>
                  <td className="py-3 px-4 text-gray-700">{influence.sign}</td>
                  <td className="py-3 px-4 font-mono text-gray-600">{influence.degree}°</td>
                  <td className="py-3 px-4 text-xs text-gray-600">{influence.influence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Output */}
      <div className="bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📄</span> JSON Output
        </h3>
        <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
          {JSON.stringify(behaviorData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default BehaviorAnalysis;
