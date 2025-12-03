import { useState } from 'react';
import { X, Star, Users, Brain, Sparkles } from 'lucide-react';
import BirthChartForm from './BirthChartForm';
import NavamsaChartForm from './NavamsaChartForm';
import PoruthamForm from './PoruthamForm';
import BehaviorPredictionForm from './BehaviorPredictionForm';

const ChartModal = ({ isOpen, onClose }) => {
  const [selectedChart, setSelectedChart] = useState(null);

  if (!isOpen) return null;

  const chartOptions = [
    {
      id: 'birth-chart',
      title: 'Birth Chart',
      subtitle: 'Rasi Chart (D1)',
      icon: Star,
      gradient: 'from-purple-500 to-pink-500',
      description: 'Generate comprehensive birth chart with planetary positions',
      emoji: '🌟'
    },
    {
      id: 'navamsa',
      title: 'Navamsa Chart',
      subtitle: 'D9 Chart',
      icon: Sparkles,
      gradient: 'from-blue-500 to-cyan-500',
      description: 'Analyze navamsa divisional chart for detailed insights',
      emoji: '✨'
    },
    {
      id: 'porutham',
      title: 'Porutham',
      subtitle: 'Compatibility',
      icon: Users,
      gradient: 'from-pink-500 to-rose-500',
      description: 'Calculate marriage compatibility using 10 poruthams',
      emoji: '💑'
    },
    {
      id: 'behavior',
      title: 'Behavior Analysis',
      subtitle: 'Predictions',
      icon: Brain,
      gradient: 'from-indigo-500 to-purple-500',
      description: 'Generate personality and behavior predictions',
      emoji: '🧠'
    }
  ];

  const handleBack = () => {
    setSelectedChart(null);
  };

  const handleClose = () => {
    setSelectedChart(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl mx-auto animate-slideInUp">
        <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white p-6 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedChart && (
                  <button
                    onClick={handleBack}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    ← Back
                  </button>
                )}
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedChart ? chartOptions.find(c => c.id === selectedChart)?.title : 'Astrology Charts'}
                  </h2>
                  <p className="text-purple-100 text-sm">
                    {selectedChart ? 'Enter birth details' : 'Choose a chart to generate'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
            {!selectedChart ? (
              /* Chart Selection Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {chartOptions.map((chart) => {
                  const Icon = chart.icon;
                  return (
                    <button
                      key={chart.id}
                      onClick={() => setSelectedChart(chart.id)}
                      className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all transform hover:scale-105 hover:shadow-xl bg-white border-2 border-transparent hover:border-purple-300"
                    >
                      {/* Gradient Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${chart.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />

                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${chart.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-800">
                            {chart.title}
                          </h3>
                          <span className="text-2xl">{chart.emoji}</span>
                        </div>
                        <p className="text-sm text-purple-600 font-semibold mb-2">
                          {chart.subtitle}
                        </p>
                        <p className="text-sm text-gray-600">
                          {chart.description}
                        </p>
                      </div>

                      {/* Arrow indicator */}
                      <div className="absolute bottom-4 right-4 text-gray-400 group-hover:text-purple-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Chart Form */
              <div className="animate-fadeIn">
                {selectedChart === 'birth-chart' && <BirthChartForm onClose={handleClose} />}
                {selectedChart === 'navamsa' && <NavamsaChartForm onClose={handleClose} />}
                {selectedChart === 'porutham' && <PoruthamForm onClose={handleClose} />}
                {selectedChart === 'behavior' && <BehaviorPredictionForm onClose={handleClose} />}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideInUp {
          animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default ChartModal;
