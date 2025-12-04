import { Sparkles, Heart, Star, Brain } from 'lucide-react';

const AstrologyBottomNav = ({ activeChart, onSelectChart }) => {
  const navItems = [
    {
      id: 'birth-chart',
      icon: Star,
      label: 'Birth Chart',
      color: 'text-blue-500',
      activeColor: 'bg-blue-500'
    },
    {
      id: 'porutham',
      icon: Heart,
      label: 'Porutham',
      color: 'text-pink-500',
      activeColor: 'bg-pink-500'
    },
    {
      id: 'navamsa',
      icon: Sparkles,
      label: 'Navamsa',
      color: 'text-purple-500',
      activeColor: 'bg-purple-500'
    },
    {
      id: 'behavior',
      icon: Brain,
      label: 'Behavior',
      color: 'text-orange-500',
      activeColor: 'bg-orange-500'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="grid grid-cols-4 gap-2 py-2">
          {navItems.map((item) => {
            const isActive = activeChart === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onSelectChart(item.id)}
                className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-br from-purple-50 to-pink-50 scale-105'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className={`relative ${isActive ? 'transform -translate-y-1' : ''}`}>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? `${item.activeColor} text-white shadow-lg`
                        : `bg-gray-100 ${item.color}`
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                </div>

                <span
                  className={`text-xs font-semibold mt-2 transition-colors ${
                    isActive ? 'text-purple-600' : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AstrologyBottomNav;
