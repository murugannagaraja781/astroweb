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
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
      <div className="flex items-center border rounded-lg px-3 py-2 bg-white focus-within:ring-2 ring-purple-500">
        <MapPin className="text-gray-400 w-5 h-5 mr-2" />
        <input
          type="text"
          value={value}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Enter City"
          className="w-full outline-none"
        />
      </div>
      {show && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((place, i) => (
            <div
              key={i}
              className="px-4 py-2 hover:bg-purple-50 cursor-pointer text-sm"
              onClick={() => {
                onSelect(place);
                setShow(false);
              }}
            >
              <span className="font-medium">{place.place}</span>, {place.state}
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
      className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          required
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 ring-purple-500 outline-none"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <div className="flex items-center border rounded-lg px-3 py-2 bg-white">
            <Calendar className="text-gray-400 w-4 h-4 mr-2" />
            <input
              type="date"
              required
              className="w-full outline-none"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time
          </label>
          <div className="flex items-center border rounded-lg px-3 py-2 bg-white">
            <Clock className="text-gray-400 w-4 h-4 mr-2" />
            <input
              type="time"
              required
              className="w-full outline-none"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
            />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
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
        className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
      >
        Generate
      </button>
    </form>
  );
};

const PlanetTable = ({ planets }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left">Planet</th>
          <th className="px-4 py-2 text-left">Longitude</th>
          <th className="px-4 py-2 text-left">Speed</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(planets).map(([name, data]) => (
          <tr key={name} className="border-t">
            <td className="px-4 py-2 font-medium">{name}</td>
            <td className="px-4 py-2">{data.lon.toFixed(2)}°</td>
            <td className="px-4 py-2">{data.speed?.toFixed(2) || "-"}</td>
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
    <div className="min-h-screen bg-gray-50 py-8 pb-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Star className="text-purple-600" /> Astrology Engine
        </h1>
        <p className="text-gray-600 mb-8">
          Generate detailed horoscopes and check compatibility
        </p>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("chart")}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              activeTab === "chart"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 border"
            }`}
          >
            Generate Chart
          </button>
          <button
            onClick={() => setActiveTab("match")}
            className={`px-6 py-2 rounded-full font-semibold transition-all ${
              activeTab === "match"
                ? "bg-pink-600 text-white"
                : "bg-white text-gray-600 border"
            }`}
          >
            Match Making
          </button>
        </div>

        {activeTab === "chart" && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <ChartForm
                onSubmit={handleGenerate}
                title="Enter Birth Details"
              />
            </div>
            <div>
              {loading && <div className="text-center py-10">Loading...</div>}
              {chartData && !loading && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Horoscope Details
                  </h3>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">
                      Name:{" "}
                      <span className="font-medium text-gray-800">
                        {chartData.name}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Date:{" "}
                      <span className="font-medium text-gray-800">
                        {chartData.input.date} {chartData.input.time}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Place:{" "}
                      <span className="font-medium text-gray-800">
                        {chartData.input.place.place}
                      </span>
                    </p>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-purple-700 mb-2">
                      Planetary Positions
                    </h4>
                    <PlanetTable planets={chartData.planets} />
                  </div>

                  <div className="mb-6">
                    <h4 className="font-semibold text-purple-700 mb-2">
                      Panchangam
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 block">Tithi</span>
                        <span className="font-medium">
                          {chartData.panchangam.tithi.tithiApprox}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="text-gray-500 block">Nakshatra</span>
                        <span className="font-medium">
                          {chartData.panchangam.nakshatra.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-purple-700 mb-2">
                      Current Dasa
                    </h4>
                    <div className="bg-purple-50 p-3 rounded-lg text-purple-800 font-medium">
                      {chartData.dasa.current?.planet} Dasa (Balance:{" "}
                      {chartData.dasa.current?.years.toFixed(1)} years)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "match" && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <ChartForm onSubmit={setMaleData} title="Boy's Details" />
              <ChartForm onSubmit={setFemaleData} title="Girl's Details" />
            </div>

            <div className="text-center">
              <button
                onClick={handleMatch}
                disabled={!maleData || !femaleData}
                className={`px-8 py-3 rounded-full font-bold text-lg shadow-lg transition-transform hover:scale-105 ${
                  maleData && femaleData
                    ? "bg-pink-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Check Compatibility
              </button>
            </div>

            {matchResult && (
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-pink-100 text-center animate-fadeIn">
                <Heart className="w-16 h-16 text-pink-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  Compatibility Score
                </h3>
                <div className="text-5xl font-black text-pink-600 mb-4">
                  {matchResult.score} / 2
                </div>
                <p className="text-xl font-medium text-gray-600 mb-6">
                  {matchResult.recommendation}
                </p>

                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
                  <div className="bg-pink-50 p-4 rounded-xl">
                    <span className="text-gray-500 text-sm block">
                      Dina Porutham
                    </span>
                    <span
                      className={`font-bold ${
                        matchResult.porutham.din
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {matchResult.porutham.din ? "Good" : "Bad"}
                    </span>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-xl">
                    <span className="text-gray-500 text-sm block">
                      Gana Porutham
                    </span>
                    <span
                      className={`font-bold ${
                        matchResult.porutham.gana
                          ? "text-green-600"
                          : "text-red-500"
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
