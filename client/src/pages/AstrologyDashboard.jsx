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
  ArrowRight
} from "lucide-react";
import SouthIndianChart from "../components/SouthIndianChart";
import NorthIndianChart from "../components/NorthIndianChart";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9001";

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

  return (
    <div className="min-h-screen bg-slate-900 py-8 text-gray-100">
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
              <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-pink-500/30 text-center max-w-2xl mx-auto">
                <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Compatibility Score
                </h3>
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-4">
                  {matchResult.score} <span className="text-2xl text-gray-500">/ 36</span>
                </div>
                <p className="text-xl font-medium text-gray-300 mb-8">
                  {matchResult.recommendation}
                </p>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
                    <span className="text-gray-400 text-sm block mb-1">
                      Dina Porutham
                    </span>
                    <span
                      className={`font-bold text-lg ${
                        matchResult.porutham.din
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {matchResult.porutham.din ? "Good" : "Bad"}
                    </span>
                  </div>
                  <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
                    <span className="text-gray-400 text-sm block mb-1">
                      Gana Porutham
                    </span>
                    <span
                      className={`font-bold text-lg ${
                        matchResult.porutham.gana
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {matchResult.porutham.gana ? "Good" : "Bad"}
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
