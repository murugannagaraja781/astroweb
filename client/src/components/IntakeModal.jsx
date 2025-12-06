import { useState, useEffect } from 'react';
import { City } from 'country-state-city';
import { Calendar, Clock, MapPin, User, X } from 'lucide-react';

const IntakeModal = ({ isOpen, onSubmit, onClose, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    gender: initialData?.gender || 'male',
    dateOfBirth: initialData?.dateOfBirth || '', // YYYY-MM-DD
    timeOfBirth: initialData?.timeOfBirth || '', // HH:MM
    placeOfBirth: initialData?.placeOfBirth || '',
    latitude: initialData?.latitude || '',
    longitude: initialData?.longitude || '',
    timezone: initialData?.timezone || 5.5
  });

  // Effect to update form if initialData changes while modal is kept mounted (though usually it unmounts)
  useEffect(() => {
    if (initialData && isOpen) {
       setFormData(prev => ({ ...prev, ...initialData }));
       if (initialData.placeOfBirth) {
         setCitySearch(initialData.placeOfBirth);
       }
    }
  }, [initialData, isOpen]);
  const [loading, setLoading] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Handle City Search
  const handleCitySearch = (e) => {
    const value = e.target.value;
    setCitySearch(value);

    if (value.length > 2) {
      // Filter Indian cities
      const cities = City.getCitiesOfCountry('IN');
      const filtered = cities.filter(city =>
        city.name.toLowerCase().startsWith(value.toLowerCase())
      ).slice(0, 5);
      setCitySuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setCitySuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Select City
  const selectCity = (city) => {
    setFormData(prev => ({
      ...prev,
      placeOfBirth: city.name,
      latitude: parseFloat(city.latitude),
      longitude: parseFloat(city.longitude)
    }));
    setCitySearch(city.name);
    setShowSuggestions(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.dateOfBirth || !formData.timeOfBirth || !formData.latitude) {
      alert("Please fill all fields");
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-slideInUp">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold mb-1">Start Consultation</h2>
          <p className="text-purple-100 text-sm">Please provide your birth details for accurate predictions</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter your name"
                required
              />
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gender</label>
            <div className="flex gap-4">
              {['male', 'female', 'other'].map((g) => (
                <label key={g} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.gender === g ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-100 bg-gray-50 text-gray-500'}`}>
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={formData.gender === g}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <span className="capitalize font-semibold">{g}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full pl-10 pr-2 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Time of Birth</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="time"
                  name="timeOfBirth"
                  value={formData.timeOfBirth}
                  onChange={handleChange}
                  className="w-full pl-10 pr-2 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Place of Birth */}
          <div className="space-y-1 relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Place of Birth</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={citySearch}
                onChange={handleCitySearch}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                placeholder="Search City (e.g. Chennai)"
              />
            </div>
            {/* Suggestions */}
            {showSuggestions && citySuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                {citySuggestions.map((city, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectCity(city)}
                    className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-50 last:border-0"
                  >
                    <div className="font-semibold text-gray-800">{city.name}</div>
                    <div className="text-xs text-gray-500">{city.stateCode}, India</div>
                  </div>
                ))}
              </div>
            )}
            {formData.latitude && (
              <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <span>✓ Location set: {formData.latitude}, {formData.longitude}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all transform"
            >
              Start Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntakeModal;
