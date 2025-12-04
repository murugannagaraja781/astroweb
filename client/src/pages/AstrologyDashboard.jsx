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
  Brain
} from "lucide-react";
import SouthIndianChart from "../components/SouthIndianChart";
import NorthIndianChart from "../components/NorthIndianChart";
import AstrologyQuickMenu from "../components/AstrologyQuickMenu";

const API_URL = import.meta.env.VITE_API_URL || "https://astroweb-production.up.railway.app";

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
      <div className="flex items-center border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 focus-within:ring-2 ring-purple-500">
        <MapPin className="text-gray-400 w-5 h-5 mr-2" />
        <input
          type="text"
          value={value}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Enter City"
          className="w-full outline-none bg-transparent text-white placeholder-gray-400"
        />
      </div>
      {show && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-slate-800 border border-slate-600 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((place, i) => (
            <div
              key={i}
              className="px-4 py-2 hover:bg-purple-900/50 cursor-pointer text-sm text-gray-200"
              onClick={() => {
                onSelect(place);
                setShow(false);
              }}
            >
              <span className="font-medium text-white">{place.place}</span>, {place.state}
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
    place: "", // display string
  });
  const [selectedPlace, setSelectedPlace] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlace) return alert("Please select a place from the list");
    onSubmit({ ...formData, place: selectedPlace.place }); // Send place name, backend looks it up again or we could send full obj
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700"
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Star className="w-4 h-4 text-purple-400" /> {title}
      </h3>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Name
        </label>
        <input
          type="text"
          required
          className="w-full border border-slate-600 rounded-lg px-3 py-2 bg-slate-700 text-white focus:ring-2 ring-purple-500 outline-none placeholder-gray-500"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter full name"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Date
          </label>
          <div className="flex items-center border border-slate-600 rounded-lg px-3 py-2 bg-slate-700">
            <Calendar className="text-gray-400 w-4 h-4 mr-2" />
            <input
              type="date"
              required
              className="w-full outline-none bg-transparent text-white"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Time
          </label>
          <div className="flex items-center border border-slate-600 rounded-lg px-3 py-2 bg-slate-700">
            <Clock className="text-gray-400 w-4 h-4 mr-2" />
            <input
              type="time"
              required
              className="w-full outline-none bg-transparent text-white"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Place of Birth
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
        className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
      >
        Generate Chart <ArrowRight size={16} />
      </button>
    </form>
  );
};

const PlanetTable = ({ planets }) => (
  <div className="overflow-x-auto rounded-lg border border-slate-700">
    <table className="min-w-full text-sm text-left">
      <thead className="bg-slate-700 text-gray-300">
        <tr>
          <th className="px-4 py-3 font-medium">Planet</th>
          <th className="px-4 py-3 font-medium">Longitude</th>
          <th className="px-4 py-3 font-medium">Speed</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-700 bg-slate-800">
        {Object.entries(planets).map(([name, data]) => (
          <tr key={name} className="hover:bg-slate-700/50 transition-colors">
            <td className="px-4 py-3 font-medium text-purple-300 capitalize">{name}</td>
            <td className="px-4 py-3 text-gray-300">{data.lon.toFixed(2)}°</td>
            <td className="px-4 py-3 text-gray-400">{data.speed?.toFixed(2) || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AstrologyDashboard = () => {
  const [activeTab, setActiveTab] = useState("chart"); // chart, match
  const [chartData, setChartData] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Match state
  const [maleData, setMaleData] = useState(null);
  const [femaleData, setFemaleData] = useState(null);

  const handleGenerate = async (data) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/horoscope/generate`, data);
      setChartData(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to generate chart");
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!maleData || !femaleData) return alert("Please fill both details");
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/horoscope/match`, {
        male: maleData,
        female: femaleData,
      });
      setMatchResult(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to match");
    } finally {
      setLoading(false);
    }
  };

  const [showFooterMenu, setShowFooterMenu] = useState(false);

  // Handle chart selection from FAB menu
  const handleChartSelect = (chartId) => {
    console.log('Selected chart:', chartId);

    switch(chartId) {
      case 'chat':
        // Navigate to chat/astrologer listing page
        window.location.href = '/client/astrologers';
        break;
      case 'birth-chart':
        setActiveTab('chart');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'porutham':
        setActiveTab('match');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'navamsa':
        // You can add navamsa tab or modal here
        alert('Navamsa Chart - Coming soon!');
        break;
      case 'behavior':
        // You can add behavior tab or modal here
        alert('Behavior Analysis - Coming soon!');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-8 pb-24 text-gray-100">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Star className="text-purple-500 fill-purple-500" /> Astrology Engine
        </h1>
        <p className="text-gray-400 mb-8">
          Generate detailed horoscopes and check compatibility
        </p>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 bg-slate-800 p-1 rounded-full w-fit border border-slate-700">
          <button
            onClick={() => setActiveTab("chart")}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              activeTab === "chart"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Generate Chart
          </button>
          <button
            onClick={() => setActiveTab("match")}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              activeTab === "match"
                ? "bg-pink-600 text-white shadow-lg shadow-pink-900/50"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Match Making
          </button>
        </div>

        {activeTab === "chart" && (
          <div className="grid md:grid-cols-12 gap-8">
            <div className="md:col-span-4">
              <ChartForm
                onSubmit={handleGenerate}
                title="Birth Details"
              />
            </div>
            <div className="md:col-span-8">
              {loading && (
                <div className="text-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-purple-400">Calculating planetary positions...</p>
                </div>
              )}

              {!loading && !chartData && (
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-10 text-center text-gray-500">
                  <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Enter birth details to generate a comprehensive horoscope report.</p>
                </div>
              )}

              {chartData && !loading && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Header Info */}
                  <div className="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {chartData.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {chartData.input.date} at {chartData.input.time} • {chartData.input.place.place}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ascendant</div>
                      <div className="text-lg font-bold text-purple-400">{chartData.houses.ascendant.sign}</div>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                      <h4 className="font-semibold text-purple-400 mb-4 text-center">
                        South Indian Style
                      </h4>
                      <SouthIndianChart
                        planets={chartData.planets}
                        ascendant={chartData.houses.ascendant}
                      />
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                      <h4 className="font-semibold text-purple-400 mb-4 text-center">
                        North Indian Style
                      </h4>
                      <NorthIndianChart
                        planets={chartData.planets}
                        houses={chartData.houses}
                      />
                    </div>
                  </div>


                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "match" && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="grid md:grid-cols-2 gap-8">
              <ChartForm onSubmit={setMaleData} title="Boy's Details" />
              <ChartForm onSubmit={setFemaleData} title="Girl's Details" />
            </div>

            <div className="text-center">
              <button
                onClick={handleMatch}
                disabled={!maleData || !femaleData}
                className={`px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all hover:scale-105 ${
                  maleData && femaleData
                    ? "bg-pink-600 text-white shadow-pink-900/50 hover:bg-pink-700"
                    : "bg-slate-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                Check Compatibility
              </button>
            </div>

            {matchResult && (
              <div className="space-y-6 animate-fadeIn">
                {/* Hero Score Card */}
                <div className="bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 p-8 rounded-2xl shadow-2xl text-center relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full" style={{
                      backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}></div>
                  </div>

                  <div className="relative z-10">
                    <Heart className="w-20 h-20 text-white mx-auto mb-4 animate-pulse drop-shadow-lg" />
                    <h3 className="text-3xl font-bold text-white mb-2">
                      Compatibility Analysis
                    </h3>

                    {/* Score Display */}
                    <div className="my-8">
                      <div className="text-8xl font-black text-white mb-2 drop-shadow-lg">
                        {matchResult.score}
                        <span className="text-3xl text-white/70"> / 36</span>
                      </div>
                      <div className="text-2xl font-bold text-white/90">
                        {((matchResult.score / 36) * 100).toFixed(1)}% Match
                      </div>
                    </div>

                    {/* Recommendation Badge */}
                    <div className={`inline-block px-8 py-3 rounded-full text-xl font-bold ${
                      matchResult.score >= 28 ? 'bg-green-500' :
                      matchResult.score >= 18 ? 'bg-yellow-500' :
                      'bg-red-500'
                    } text-white shadow-lg`}>
                      {matchResult.recommendation || (
                        matchResult.score >= 28 ? '✨ Excellent Match' :
                        matchResult.score >= 18 ? '⚠️ Average Match' :
                        '❌ Poor Match'
                      )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-8">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="text-3xl font-bold text-white">
                          {Object.values(matchResult.porutham || {}).filter(v => v === true).length}
                        </div>
                        <div className="text-sm text-white/80">Good Matches</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="text-3xl font-bold text-white">
                          {Object.values(matchResult.porutham || {}).filter(v => v === false).length}
                        </div>
                        <div className="text-sm text-white/80">Challenges</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                        <div className="text-3xl font-bold text-white">
                          {Object.keys(matchResult.porutham || {}).length}
                        </div>
                        <div className="text-sm text-white/80">Total Factors</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Porutham Analysis */}
                <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
                  <h4 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span>📊</span> Detailed Porutham Analysis
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Dina Porutham */}
                    {matchResult.porutham?.din !== undefined && (
                      <div className={`rounded-xl p-5 border-2 ${
                        matchResult.porutham.din
                          ? 'bg-green-900/30 border-green-500/50'
                          : 'bg-red-900/30 border-red-500/50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white font-semibold">Dina Porutham</span>
                          <span className={`text-2xl ${matchResult.porutham.din ? 'text-green-400' : 'text-red-400'}`}>
                            {matchResult.porutham.din ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className={`text-sm ${matchResult.porutham.din ? 'text-green-300' : 'text-red-300'}`}>
                          Daily Compatibility
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Health & Well-being
                        </div>
                      </div>
                    )}

                    {/* Gana Porutham */}
                    {matchResult.porutham?.gana !== undefined && (
                      <div className={`rounded-xl p-5 border-2 ${
                        matchResult.porutham.gana
                          ? 'bg-green-900/30 border-green-500/50'
                          : 'bg-red-900/30 border-red-500/50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white font-semibold">Gana Porutham</span>
                          <span className={`text-2xl ${matchResult.porutham.gana ? 'text-green-400' : 'text-red-400'}`}>
                            {matchResult.porutham.gana ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className={`text-sm ${matchResult.porutham.gana ? 'text-green-300' : 'text-red-300'}`}>
                          Temperament Match
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Nature & Behavior
                        </div>
                      </div>
                    )}

                    {/* Mahendra Porutham */}
                    {matchResult.porutham?.mahendra !== undefined && (
                      <div className={`rounded-xl p-5 border-2 ${
                        matchResult.porutham.mahendra
                          ? 'bg-green-900/30 border-green-500/50'
                          : 'bg-red-900/30 border-red-500/50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white font-semibold">Mahendra Porutham</span>
                          <span className={`text-2xl ${matchResult.porutham.mahendra ? 'text-green-400' : 'text-red-400'}`}>
                            {matchResult.porutham.mahendra ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className={`text-sm ${matchResult.porutham.mahendra ? 'text-green-300' : 'text-red-300'}`}>
                          Prosperity Match
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Wealth & Progeny
                        </div>
                      </div>
                    )}

                    {/* Stree Deergha Porutham */}
                    {matchResult.porutham?.streeDeergha !== undefined && (
                      <div className={`rounded-xl p-5 border-2 ${
                        matchResult.porutham.streeDeergha
                          ? 'bg-green-900/30 border-green-500/50'
                          : 'bg-red-900/30 border-red-500/50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white font-semibold">Stree Deergha</span>
                          <span className={`text-2xl ${matchResult.porutham.streeDeergha ? 'text-green-400' : 'text-red-400'}`}>
                            {matchResult.porutham.streeDeergha ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className={`text-sm ${matchResult.porutham.streeDeergha ? 'text-green-300' : 'text-red-300'}`}>
                          Longevity Match
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Long Life & Health
                        </div>
                      </div>
                    )}

                    {/* Yoni Porutham */}
                    {matchResult.porutham?.yoni !== undefined && (
                      <div className={`rounded-xl p-5 border-2 ${
                        matchResult.porutham.yoni
                          ? 'bg-green-900/30 border-green-500/50'
                          : 'bg-red-900/30 border-red-500/50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white font-semibold">Yoni Porutham</span>
                          <span className={`text-2xl ${matchResult.porutham.yoni ? 'text-green-400' : 'text-red-400'}`}>
                            {matchResult.porutham.yoni ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className={`text-sm ${matchResult.porutham.yoni ? 'text-green-300' : 'text-red-300'}`}>
                          Physical Compatibility
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Intimacy & Attraction
                        </div>
                      </div>
                    )}

                    {/* Rasi Porutham */}
                    {matchResult.porutham?.rasi !== undefined && (
                      <div className={`rounded-xl p-5 border-2 ${
                        matchResult.porutham.rasi
                          ? 'bg-green-900/30 border-green-500/50'
                          : 'bg-red-900/30 border-red-500/50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white font-semibold">Rasi Porutham</span>
                          <span className={`text-2xl ${matchResult.porutham.rasi ? 'text-green-400' : 'text-red-400'}`}>
                            {matchResult.porutham.rasi ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className={`text-sm ${matchResult.porutham.rasi ? 'text-green-300' : 'text-red-300'}`}>
                          Zodiac Compatibility
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Mental Harmony
                        </div>
                      </div>
                    )}

                    {/* Rasyadhipati Porutham */}
                    {matchResult.porutham?.rasyadhipati !== undefined && (
                      <div className={`rounded-xl p-5 border-2 ${
                        matchResult.porutham.rasyadhipati
                          ? 'bg-green-900/30 border-green-500/50'
                          : 'bg-red-900/30 border-red-500/50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white font-semibold">Rasyadhipati</span>
                          <span className={`text-2xl ${matchResult.porutham.rasyadhipati ? 'text-green-400' : 'text-red-400'}`}>
                            {matchResult.porutham.rasyadhipati ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className={`text-sm ${matchResult.porutham.rasyadhipati ? 'text-green-300' : 'text-red-300'}`}>
                          Lord Compatibility
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Mutual Understanding
                        </div>
                      </div>
                    )}

                    {/* Rajju Porutham */}
                    {matchResult.porutham?.rajju !== undefined && (
                      <div className={`rounded-xl p-5 border-2 ${
                        matchResult.porutham.rajju
                          ? 'bg-green-900/30 border-green-500/50'
                          : 'bg-red-900/30 border-red-500/50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white font-semibold">Rajju Porutham</span>
                          <span className={`text-2xl ${matchResult.porutham.rajju ? 'text-green-400' : 'text-red-400'}`}>
                            {matchResult.porutham.rajju ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className={`text-sm ${matchResult.porutham.rajju ? 'text-green-300' : 'text-red-300'}`}>
                          Longevity Factor
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Life Span Harmony
                        </div>
                      </div>
                    )}

                    {/* Vedha Porutham */}
                    {matchResult.porutham?.vedha !== undefined && (
                      <div className={`rounded-xl p-5 border-2 ${
                        matchResult.porutham.vedha
                          ? 'bg-green-900/30 border-green-500/50'
                          : 'bg-red-900/30 border-red-500/50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white font-semibold">Vedha Porutham</span>
                          <span className={`text-2xl ${matchResult.porutham.vedha ? 'text-green-400' : 'text-red-400'}`}>
                            {matchResult.porutham.vedha ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className={`text-sm ${matchResult.porutham.vedha ? 'text-green-300' : 'text-red-300'}`}>
                          Affliction Check
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Obstacle Analysis
                        </div>
                      </div>
                    )}

                    {/* Nadi Porutham */}
                    {matchResult.porutham?.nadi !== undefined && (
                      <div className={`rounded-xl p-5 border-2 ${
                        matchResult.porutham.nadi
                          ? 'bg-green-900/30 border-green-500/50'
                          : 'bg-red-900/30 border-red-500/50'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white font-semibold">Nadi Porutham</span>
                          <span className={`text-2xl ${matchResult.porutham.nadi ? 'text-green-400' : 'text-red-400'}`}>
                            {matchResult.porutham.nadi ? '✓' : '✗'}
                          </span>
                        </div>
                        <div className={`text-sm ${matchResult.porutham.nadi ? 'text-green-300' : 'text-red-300'}`}>
                          Health Compatibility
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          Genetic Harmony
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Compatibility Meter */}
                <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
                  <h4 className="text-xl font-bold text-white mb-4">Compatibility Meter</h4>
                  <div className="relative h-8 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full transition-all duration-1000 ${
                        matchResult.score >= 28 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        matchResult.score >= 18 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        'bg-gradient-to-r from-red-500 to-pink-500'
                      }`}
                      style={{ width: `${(matchResult.score / 36) * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-sm drop-shadow-lg">
                        {((matchResult.score / 36) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-400">
                    <span>Poor (0-50%)</span>
                    <span>Average (50-75%)</span>
                    <span>Excellent (75-100%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button Menu */}
      <AstrologyQuickMenu onSelectChart={handleChartSelect} />
    </div>
  );
};

export default AstrologyDashboard;
