import { Sparkles, Heart, Star, Brain } from 'lucide-react';

const AstrologyHeaderTabs = ({ activeChart, onSelectChart }) => {
  const tabs = [
    {
      id: 'birth-chart',
      icon: Star,
      label: 'Birth Chart',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'porutham',
      icon: Heart,
      label: 'Porutham',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      id: 'navamsa',
      icon: Sparkles,
      label: 'Navamsa',
      gradient: 'from-purple-500 to-indigo-500'
    },
    {
      id: 'behavior',
      icon: Brain,
      label: 'Behavior',
      gradient: 'from-orange-500 to-amber-500'
    }
  ];

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-md">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = activeChart === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectChart(tab.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                <span>{tab.label}</span>

                {/* Active Indicator Line */}
                {isActive && (
                  <div className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AstrologyHeaderTabs;
