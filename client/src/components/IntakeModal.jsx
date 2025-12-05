import { useState } from 'react';
import { City } from 'country-state-city';
import { Calendar, Clock, MapPin, User, CheckCircle } from 'lucide-react';
import axios from 'axios';
import apiClient from '../utils/apiClient';

const IntakeModal = ({ isOpen, onSubmit, sessionId }) => {
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    dateOfBirth: '', // YYYY-MM-DD
    timeOfBirth: '', // HH:mm
    placeOfBirth: '',
    latitude: '',
    longitude: ''
  });

  const [loading, setLoading] = useState(false);

  // City Search State
  const [citySearch, setCitySearch] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  if (!isOpen) return null;

  const handleCitySearch = (e) => {
    const value = e.target.value;
    setCitySearch(value);
    setFormData(prev => ({ ...prev, placeOfBirth: value }));

    if (value.length > 2) {
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

  const selectCity = (city) => {
    setFormData(prev => ({
      ...prev,
      placeOfBirth: city.name,
      latitude: city.latitude,
      longitude: city.longitude
    }));
    setCitySearch(city.name);
    setShowSuggestions(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Submit to server
      await apiClient.post('/api/chat/intake', {
         sessionId,
         intakeDetails: formData
      });
      // 2. Callback to parent to unlock chat
      onSubmit(formData);
    } catch (err) {
      console.error("Intake submission failed", err);
      alert("Failed to submit details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scaleIn">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white text-center">
            <h2 className="text-2xl font-bold mb-1">Birth Details Required</h2>
            <p className="text-purple-100 text-sm">Please provide details for accurate reading</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-400 w-5 h-5"/>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 transition-colors"
                        placeholder="Full Name"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                     <label className="text-xs font-bold text-gray-500 uppercase">Date of Birth</label>
                     <div className="relative">
                        <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5"/>
                        <input
                            name="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 transition-colors"
                            required
                        />
                     </div>
                </div>
                <div>
                     <label className="text-xs font-bold text-gray-500 uppercase">Time of Birth</label>
                     <div className="relative">
                        <Clock className="absolute left-3 top-3 text-gray-400 w-5 h-5"/>
                        <input
                            name="timeOfBirth"
                            type="time"
                            value={formData.timeOfBirth}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 transition-colors"
                            required
                        />
                     </div>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Place of Birth</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5"/>
                    <input
                        value={citySearch}
                        onChange={handleCitySearch}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-purple-500 transition-colors"
                        placeholder="Search City (India)"
                        required
                    />
                     {showSuggestions && citySuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                        {citySuggestions.map((city, index) => (
                          <div
                            key={index}
                            onClick={() => selectCity(city)}
                            className="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-gray-100 text-sm"
                          >
                            <span className="font-bold block">{city.name}</span>
                            <span className="text-xs text-gray-500">{city.stateCode}</span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
            </div>

            <div className="pt-2">
                 <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Gender</label>
                 <div className="flex gap-4">
                     {['male', 'female', 'other'].map(g => (
                         <label key={g} className={`flex-1 flex items-center justify-center gap-2 border rounded-xl py-3 cursor-pointer transition-all ${formData.gender === g ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold' : 'border-gray-200 hover:bg-gray-50'}`}>
                             <input
                                type="radio"
                                name="gender"
                                value={g}
                                checked={formData.gender === g}
                                onChange={handleChange}
                                className="hidden"
                             />
                             <span className="capitalize">{g}</span>
                         </label>
                     ))}
                 </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
                {loading ? 'Submitting...' : (
                    <>
                        Start Consultation <CheckCircle className="w-5 h-5"/>
                    </>
                )}
            </button>

        </form>
      </div>
    </div>
  );
};

export default IntakeModal;
