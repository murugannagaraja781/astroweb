import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const ThemeContext = createContext();

export const ZODIAC_THEMES = {
  Aries: { color: 'red', hex: '#ef4444', icon: '♈', label: 'Aries', gradient: 'from-red-600 to-orange-600' },
  Taurus: { color: 'emerald', hex: '#10b981', icon: '♉', label: 'Taurus', gradient: 'from-emerald-600 to-teal-600' },
  Gemini: { color: 'yellow', hex: '#eab308', icon: '♊', label: 'Gemini', gradient: 'from-yellow-500 to-amber-500' },
  Cancer: { color: 'slate', hex: '#94a3b8', icon: '♋', label: 'Cancer', gradient: 'from-slate-500 to-gray-500' },
  Leo: { color: 'orange', hex: '#f97316', icon: '♌', label: 'Leo', gradient: 'from-orange-500 to-red-500' },
  Virgo: { color: 'green', hex: '#22c55e', icon: '♍', label: 'Virgo', gradient: 'from-green-600 to-emerald-600' },
  Libra: { color: 'pink', hex: '#ec4899', icon: '♎', label: 'Libra', gradient: 'from-pink-500 to-rose-500' },
  Scorpio: { color: 'rose', hex: '#f43f5e', icon: '♏', label: 'Scorpio', gradient: 'from-rose-600 to-pink-600' },
  Sagittarius: { color: 'purple', hex: '#a855f7', icon: '♐', label: 'Sagittarius', gradient: 'from-purple-600 to-indigo-600' },
  Capricorn: { color: 'stone', hex: '#78716c', icon: '♑', label: 'Capricorn', gradient: 'from-stone-600 to-neutral-600' },
  Aquarius: { color: 'cyan', hex: '#06b6d4', icon: '♒', label: 'Aquarius', gradient: 'from-cyan-500 to-blue-500' },
  Pisces: { color: 'teal', hex: '#14b8a6', icon: '♓', label: 'Pisces', gradient: 'from-teal-500 to-cyan-500' }
};

export const ThemeProvider = ({ children }) => {
  const [activeThemeName, setActiveThemeName] = useState('Aries');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/public/settings`);
      if (res.data && res.data.theme) {
        setActiveThemeName(res.data.theme);
      }
    } catch (err) {
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        // Silent fail for unauthorized/forbidden - use default theme
      } else {
        console.error('Failed to fetch theme settings:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateTheme = async (newThemeName) => {
    try {
      // Optimistic update
      setActiveThemeName(newThemeName);

      // Persist to backend
      await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/settings`, { theme: newThemeName });
    } catch (err) {
      console.error('Failed to update theme:', err);
      // Revert on failure (optional, but good UX)
      fetchTheme();
    }
  };

  const theme = ZODIAC_THEMES[activeThemeName] || ZODIAC_THEMES['Aries'];

  return (
    <ThemeContext.Provider value={{ theme, activeThemeName, updateTheme, ZODIAC_THEMES, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
