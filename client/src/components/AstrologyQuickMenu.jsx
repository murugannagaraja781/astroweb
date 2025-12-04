import { useState } from 'react';
import { Sparkles, Heart, Star, Brain, MessageCircle, X, Plus } from 'lucide-react';

const AstrologyQuickMenu = ({ onSelectChart }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    {
      id: 'chat',
      icon: MessageCircle,
      label: 'Chat',
      color: 'from-green-500 to-emerald-500',
      hoverColor: 'hover:from-green-600 hover:to-emerald-600'
    },
    {
      id: 'birth-chart',
      icon: Star,
      label: 'Birth Chart',
      color: 'from-blue-500 to-cyan-500',
      hoverColor: 'hover:from-blue-600 hover:to-cyan-600'
    },
    {
      id: 'porutham',
      icon: Heart,
      label: 'Porutham',
      color: 'from-pink-500 to-rose-500',
      hoverColor: 'hover:from-pink-600 hover:to-rose-600'
    },
    {
      id: 'navamsa',
      icon: Sparkles,
      label: 'Navamsa',
      color: 'from-purple-500 to-indigo-500',
      hoverColor: 'hover:from-purple-600 hover:to-indigo-600'
    },
    {
      id: 'behavior',
      icon: Brain,
      label: 'Behavior',
      color: 'from-orange-500 to-amber-500',
      hoverColor: 'hover:from-orange-600 hover:to-amber-600'
    }
  ];

  const handleSelect = (id) => {
    onSelectChart(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button (FAB) - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-[100]">
        {/* Menu Items */}
        <div className={`flex flex-col-reverse gap-3 mb-3 transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          {menuItems.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-3 animate-fadeIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Label */}
              <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
                <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                  {item.label}
                </span>
              </div>

              {/* Button */}
              <button
                onClick={() => handleSelect(item.id)}
                className={`w-14 h-14 rounded-full bg-gradient-to-br ${item.color} ${item.hoverColor} text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center`}
              >
                <item.icon className="w-6 h-6" />
              </button>
            </div>
          ))}
        </div>

        {/* Main FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-2xl hover:shadow-purple-500/50 transform hover:scale-110 transition-all duration-300 flex items-center justify-center ${
            isOpen ? 'rotate-45' : 'rotate-0'
          }`}
        >
          {isOpen ? <X className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default AstrologyQuickMenu;
