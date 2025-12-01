 import React, { useState } from "react";
import axios from "axios";
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Heart,
  Star,
  Activity,
  ArrowRight,
  Sparkles,
  Users,
  Zap,
  Shield,
  CrystalBall,
  Moon,
  Sun,
  Planet,
  Pyramid,
  Lotus,
  PalmReading,
  TarotCards,
  Horoscope,
  Zodiac,
  Crystal,
  Meditation,
  Eye,
} from "lucide-react";
import SouthIndianChart from "../components/SouthIndianChart";
import NorthIndianChart from "../components/NorthIndianChart";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9001";

// Cosmic Background Component
const CosmicBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Stars */}
    <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full opacity-40 animate-pulse"></div>
    <div className="absolute top-20 right-20 w-1 h-1 bg-yellow-200 rounded-full opacity-60 animate-pulse delay-75"></div>
    <div className="absolute bottom-16 left-1/4 w-1.5 h-1.5 bg-blue-200 rounded-full opacity-50 animate-pulse delay-150"></div>
    <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-purple-200 rounded-full opacity-70 animate-pulse delay-200"></div>
    <div className="absolute bottom-32 left-16 w-1 h-1 bg-pink-200 rounded-full opacity-60 animate-pulse delay-300"></div>

    {/* Planets */}
    <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-10"></div>
    <div className="absolute -bottom-32 -left-20 w-60 h-60 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full opacity-10"></div>

    {/* Cosmic dust */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent"></div>
  </div>
);

const PlaceSearch = ({ value, onChange, onSelect }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [show, setShow] = useState(false);

  const handleSearch = async (q) => {
    onChange(q);
    if (q.length > 2) {
      try {
        const res = await axios.get(
          `${API_URL}/api/horoscope/places?q=${encodeURIComponent(q)}`
        );
        setSuggestions(res.data);
        setShow(true);
      } catch (e) {
        console.error(e);
        setSuggestions([]);
        setShow(false);
      }
    } else {
      setSuggestions([]);
      setShow(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center border border-white/20 rounded-xl px-3 py-3 bg-white/10 backdrop-blur-sm focus-within:ring-2 ring-purple-500 focus-within:border-purple-400 transition-all">
        <MapPin className="text-purple-300 w-5 h-5 mr-2" />
        <input
          type="text"
          value={value}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Enter City for Cosmic Alignment"
          className="w-full outline-none bg-transparent text-white placeholder-purple-200 font-light"
        />
      </div>
      {show && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-slate-800/90 backdrop-blur-lg border border-white/20 rounded-xl mt-2 shadow-2xl max-h-60 overflow-y-auto">
          {suggestions.map((place, i) => (
            <div
              key={i}
              className="px-4 py-3 hover:bg-purple-900/50 cursor-pointer text-sm text-gray-200 border-b border-white/10 last:border-0 transition-all group"
              onClick={() => {
                onSelect(place);
                setShow(false);
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="font-medium text-white">{place.place}</span>
                <span className="text-purple-300 ml-auto">{place.state}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ChartForm = ({ onSubmit, title = "Enter Birth Details" }) => {
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    place: "",
  });
  const [selectedPlace, setSelectedPlace] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlace) {
      alert("Please select a place from the cosmic database");
      return;
    }
    onSubmit({ ...formData, place: selectedPlace.place });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
          <CrystalBall className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-purple-200 mb-2 flex items-center gap-2">
          <Zodiac className="w-4 h-4" />
          Soul Name
        </label>
        <input
          type="text"
          required
          className="w-full border border-white/20 rounded-xl px-4 py-3 bg-white/5 text-white focus:ring-2 ring-purple-500 outline-none placeholder-purple-200 backdrop-blur-sm transition-all"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter your cosmic identity"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Birth Date
          </label>
          <div className="flex items-center border border-white/20 rounded-xl px-4 py-3 bg-white/5 backdrop-blur-sm">
            <input
              type="date"
              required
              className="w-full outline-none bg-transparent text-white font-light"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-purple-200 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Cosmic Time
          </label>
          <div className="flex items-center border border-white/20 rounded-xl px-4 py-3 bg-white/5 backdrop-blur-sm">
            <input
              type="time"
              required
              className="w-full outline-none bg-transparent text-white font-light"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-purple-200 mb-2 flex items-center gap-2">
          <Planet className="w-4 h-4" />
          Birth Place
        </label>
        <PlaceSearch
          value={formData.place}
          onChange={(val) => setFormData({ ...formData, place: val })}
          onSelect={(place) => {
            setFormData({ ...formData, place: place.place });
            setSelectedPlace(place);
          }}
        />
      </div>

      <button
        type="submit"
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 flex items-center justify-center gap-3 group"
      >
        <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
        Generate Cosmic Chart
        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </form>
  );
};

const PlanetTable = ({ planets }) => (
  <div className="overflow-x-auto rounded-2xl border border-white/20 backdrop-blur-lg">
    <table className="min-w-full text-sm text-left">
      <thead className="bg-purple-900/50 text-purple-200 backdrop-blur-sm">
        <tr>
          <th className="px-6 py-4 font-bold text-lg">Celestial Body</th>
          <th className="px-6 py-4 font-bold text-lg">Cosmic Longitude</th>
          <th className="px-6 py-4 font-bold text-lg">Orbital Speed</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/10 bg-white/5">
        {Object.entries(planets).map(([name, data]) => (
          <tr key={name} className="hover:bg-purple-900/30 transition-all duration-300 group">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full group-hover:scale-150 transition-transform"></div>
                <span className="font-semibold text-white text-lg capitalize">{name}</span>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="text-purple-300 text-lg font-mono">{data.lon.toFixed(2)}°</span>
            </td>
            <td className="px-6 py-4">
              <span className="text-gray-400 text-lg font-mono">
                {data.speed?.toFixed(2) || "0.00"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AstrologyDashboard = () => {
  const [activeTab, setActiveTab] = useState("chart");
  const [chartData, setChartData] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [maleData, setMaleData] = useState(null);
  const [femaleData, setFemaleData] = useState(null);

  const handleGenerate = async (data) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/horoscope/generate`, data);
      setChartData(res.data);
    } catch (e) {
      console.error(e);
      alert("Cosmic alignment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!maleData || !femaleData) {
      alert("Please provide both cosmic identities for matching");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/horoscope/match`, {
        male: maleData,
        female: femaleData,
      });
      setMatchResult(res.data);
    } catch (e) {
      console.error(e);
      alert("Soul matching failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden py-8">
      <CosmicBackground />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative">
              <Pyramid className="w-12 h-12 text-purple-400" />
              <div className="absolute inset-0 bg-purple-400 rounded-full blur-xl opacity-20"></div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              Cosmic Astrology Engine
            </h1>
            <div className="relative">
              <CrystalBall className="w-12 h-12 text-pink-400" />
              <div className="absolute inset-0 bg-pink-400 rounded-full blur-xl opacity-20"></div>
            </div>
          </div>
          <p className="text-xl text-purple-200 font-light max-w-2xl mx-auto">
            Unveil your cosmic blueprint and discover soul connections through ancient Vedic wisdom
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-12 bg-white/10 backdrop-blur-lg p-2 rounded-2xl border border-white/20 w-fit mx-auto">
          <button
            onClick={() => setActiveTab("chart")}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-3 ${
              activeTab === "chart"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-500/25"
                : "text-purple-200 hover:text-white hover:bg-white/5"
            }`}
          >
            <Eye className="w-5 h-5" />
            Cosmic Chart
          </button>
          <button
            onClick={() => setActiveTab("match")}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-3 ${
              activeTab === "match"
                ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-2xl shadow-pink-500/25"
                : "text-purple-200 hover:text-white hover:bg-white/5"
            }`}
          >
            <Heart className="w-5 h-5" />
            Soul Matching
          </button>
        </div>

        {activeTab === "chart" && (
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <ChartForm
                onSubmit={handleGenerate}
                title="Cosmic Birth Details"
              />
            </div>
            <div className="lg:col-span-8">
              {loading && (
                <div className="text-center py-20 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
                  <div className="relative mb-6">
                    <CrystalBall className="w-16 h-16 text-purple-400 mx-auto animate-pulse" />
                    <div className="absolute inset-0 bg-purple-400 rounded-full blur-xl opacity-20 animate-ping"></div>
                  </div>
                  <p className="text-purple-300 text-xl font-light">Aligning with cosmic energies...</p>
                  <div className="mt-6 flex justify-center space-x-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}

              {!loading && !chartData && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-12 text-center">
                  <div className="relative mb-6">
                    <Activity className="w-20 h-20 text-purple-400/50 mx-auto" />
                    <div className="absolute inset-0 bg-purple-400 rounded-full blur-xl opacity-10"></div>
                  </div>
                  <p className="text-purple-200 text-lg font-light max-w-md mx-auto">
                    Enter your birth details to unveil your cosmic blueprint and planetary alignments
                  </p>
                </div>
              )}

              {chartData && !loading && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Header Info */}
                  <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 shadow-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                          {chartData.name}
                        </h3>
                        <p className="text-purple-200 font-light text-lg">
                          {chartData.input.date} at {chartData.input.time} • {chartData.input.place.place}
                        </p>
                      </div>
                      <div className="text-center lg:text-right">
                        <div className="text-sm text-purple-300 uppercase tracking-wider mb-2 font-light">Ascendant</div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {chartData.houses.ascendant.sign}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid lg:grid-cols-2 gap-8">
                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                      <h4 className="font-bold text-purple-300 mb-6 text-center text-xl flex items-center justify-center gap-3">
                        <Pyramid className="w-5 h-5" />
                        South Indian Style
                      </h4>
                      <SouthIndianChart
                        planets={chartData.planets}
                        ascendant={chartData.houses.ascendant}
                      />
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                      <h4 className="font-bold text-purple-300 mb-6 text-center text-xl flex items-center justify-center gap-3">
                        <Lotus className="w-5 h-5" />
                        North Indian Style
                      </h4>
                      <NorthIndianChart
                        planets={chartData.planets}
                        houses={chartData.houses}
                      />
                    </div>
                  </div>

                  {/* Planet Table */}
                  <div>
                    <h4 className="font-bold text-white mb-6 text-2xl text-center flex items-center justify-center gap-3">
                      <Planet className="w-6 h-6" />
                      Planetary Positions
                    </h4>
                    <PlanetTable planets={chartData.planets} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "match" && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="grid lg:grid-cols-2 gap-8">
              <ChartForm onSubmit={setMaleData} title="Male Cosmic Energy" />
              <ChartForm onSubmit={setFemaleData} title="Female Cosmic Energy" />
            </div>

            <div className="text-center">
              <button
                onClick={handleMatch}
                disabled={!maleData || !femaleData}
                className={`px-12 py-5 rounded-2xl font-bold text-xl shadow-2xl transition-all transform hover:scale-105 flex items-center gap-4 mx-auto ${
                  maleData && femaleData
                    ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-pink-500/25 hover:shadow-pink-500/40"
                    : "bg-white/10 text-purple-300 cursor-not-allowed border border-white/20"
                }`}
              >
                <Heart className="w-6 h-6" />
                Check Soul Compatibility
                <Sparkles className="w-6 h-6" />
              </button>
            </div>

            {matchResult && (
              <div className="bg-gradient-to-br from-pink-900/30 to-purple-900/30 backdrop-blur-lg p-10 rounded-3xl shadow-2xl border border-pink-500/30 text-center max-w-4xl mx-auto">
                <div className="relative mb-6">
                  <Heart className="w-20 h-20 text-pink-400 mx-auto animate-pulse" />
                  <div className="absolute inset-0 bg-pink-400 rounded-full blur-xl opacity-20 animate-ping"></div>
                </div>

                <h3 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-pink-200 to-purple-200 bg-clip-text text-transparent">
                  Soul Compatibility
                </h3>

                <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-6">
                  {matchResult.score} <span className="text-3xl text-purple-300">/ 36</span>
                </div>

                <p className="text-2xl font-medium text-purple-200 mb-10 max-w-2xl mx-auto leading-relaxed">
                  {matchResult.recommendation}
                </p>

                <div className="grid grid-cols-2 gap-6 text-left max-w-md mx-auto">
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                    <span className="text-purple-300 text-lg block mb-3 font-light">
                      Dina Porutham
                    </span>
                    <span
                      className={`font-bold text-2xl ${
                        matchResult.porutham.din
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {matchResult.porutham.din ? "✓ Harmonious" : "✗ Challenged"}
                    </span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20">
                    <span className="text-purple-300 text-lg block mb-3 font-light">
                      Gana Porutham
                    </span>
                    <span
                      className={`font-bold text-2xl ${
                        matchResult.porutham.gana
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {matchResult.porutham.gana ? "✓ Balanced" : "✗ Conflicted"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AstrologyDashboard;