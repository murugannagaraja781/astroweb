import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Briefcase,
  DollarSign,
  Heart,
  Users,
  Activity,
  Lightbulb,
  Calendar,
} from "lucide-react";
import axios from "axios";

const HoroscopeDetail = () => {
  const { sign } = useParams();
  const navigate = useNavigate();
  const [horoscope, setHoroscope] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [luckyColor, setLuckyColor] = useState(null);

  const SIGN_INFO = {
    mesham: {
      name: "மேஷம்",
      nameEn: "Aries",
      icon: "♈",
      color: "from-red-500 to-red-700",
      dates: "Mar 21 - Apr 19",
    },
    rishabam: {
      name: "ரிஷபம்",
      nameEn: "Taurus",
      icon: "♉",
      color: "from-green-500 to-green-700",
      dates: "Apr 20 - May 20",
    },
    mithunam: {
      name: "மிதுனம்",
      nameEn: "Gemini",
      icon: "♊",
      color: "from-yellow-500 to-yellow-700",
      dates: "May 21 - Jun 20",
    },
    kadagam: {
      name: "கடகம்",
      nameEn: "Cancer",
      icon: "♋",
      color: "from-blue-500 to-blue-700",
      dates: "Jun 21 - Jul 22",
    },
    simmam: {
      name: "சிம்மம்",
      nameEn: "Leo",
      icon: "♌",
      color: "from-orange-500 to-orange-700",
      dates: "Jul 23 - Aug 22",
    },
    kanni: {
      name: "கன்னி",
      nameEn: "Virgo",
      icon: "♍",
      color: "from-pink-500 to-pink-700",
      dates: "Aug 23 - Sep 22",
    },
    thulam: {
      name: "துலாம்",
      nameEn: "Libra",
      icon: "♎",
      color: "from-purple-500 to-purple-700",
      dates: "Sep 23 - Oct 22",
    },
    viruchigam: {
      name: "விருச்சிகம்",
      nameEn: "Scorpio",
      icon: "♏",
      color: "from-red-600 to-red-800",
      dates: "Oct 23 - Nov 21",
    },
    dhanusu: {
      name: "தனுசு",
      nameEn: "Sagittarius",
      icon: "♐",
      color: "from-indigo-500 to-indigo-700",
      dates: "Nov 22 - Dec 21",
    },
    magaram: {
      name: "மகரம்",
      nameEn: "Capricorn",
      icon: "♑",
      color: "from-gray-500 to-gray-700",
      dates: "Dec 22 - Jan 19",
    },
    kumbam: {
      name: "கும்பம்",
      nameEn: "Aquarius",
      icon: "♒",
      color: "from-cyan-500 to-cyan-700",
      dates: "Jan 20 - Feb 18",
    },
    meenam: {
      name: "மீனம்",
      nameEn: "Pisces",
      icon: "♓",
      color: "from-teal-500 to-teal-700",
      dates: "Feb 19 - Mar 20",
    },
  };

  const signInfo = SIGN_INFO[sign];

  useEffect(() => {
    fetchHoroscope();
  }, [sign]);

  useEffect(() => {
    if (!horoscope) return;
    const todayKey = new Date(horoscope.date).toISOString().slice(0, 10);
    const storageKey = `luckyColor:${sign}:${todayKey}`;
    const lastKey = `luckyColorLast:${sign}`;

    const palette = [
      { name: "Red", hex: "#ef4444" },
      { name: "Orange", hex: "#f97316" },
      { name: "Yellow", hex: "#f59e0b" },
      { name: "Green", hex: "#22c55e" },
      { name: "Teal", hex: "#14b8a6" },
      { name: "Blue", hex: "#3b82f6" },
      { name: "Indigo", hex: "#6366f1" },
      { name: "Purple", hex: "#8b5cf6" },
      { name: "Pink", hex: "#ec4899" },
    ];

    const stored = localStorage.getItem(storageKey);
    const last = localStorage.getItem(lastKey);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLuckyColor(parsed);
        return;
      } catch {}
    }

    const base = todayKey.split("-").join("");
    const seed = parseInt(base.slice(-6), 10) || 0;
    let idx = seed % palette.length;
    if (last && palette[idx]?.name === last) {
      idx = (idx + 1) % palette.length;
    }
    const chosen = palette[idx];
    setLuckyColor(chosen);
    localStorage.setItem(storageKey, JSON.stringify(chosen));
    localStorage.setItem(lastKey, chosen.name);
  }, [horoscope, sign]);

  const fetchHoroscope = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/horoscope/daily?sign=${sign}&lang=ta`
      );
      setHoroscope(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching horoscope:", err);
      setError("Failed to load horoscope. Please try again.");
      setLoading(false);
    }
  };

  if (!signInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Invalid zodiac sign</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 text-purple-600 underline"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div
        className={`bg-gradient-to-r ${signInfo.color} text-white py-8 px-4 shadow-lg`}
      >
        <div className="container mx-auto max-w-4xl">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>

          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-6xl shadow-xl border-4 border-white/30">
              {signInfo.icon}
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{signInfo.name}</h1>
              <p className="text-white/90 text-lg">{signInfo.nameEn}</p>
              <p className="text-white/70 text-sm mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {signInfo.dates}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your horoscope...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchHoroscope}
              className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : horoscope ? (
          <div className="space-y-6">
            {/* Date Info */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100">
              <p className="text-center text-gray-600">
                <span className="font-semibold">Today's Prediction:</span>{" "}
                {new Date(horoscope.date).toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <div className="mt-3 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">நல்ல நிறம்</span>
                  {luckyColor && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-sm">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: luckyColor.hex }}
                      ></span>
                      <span className="font-medium text-gray-800">
                        {luckyColor.name}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Daily Ratings */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 text-center">
                <div className="text-xs text-pink-600 font-bold uppercase mb-2">
                  Love
                </div>
                <div className="text-2xl font-bold text-pink-700">
                  {Math.floor(Math.random() * (95 - 70) + 70)}%
                </div>
                <div className="w-full bg-pink-200 h-1.5 rounded-full mt-2">
                  <div
                    className="bg-pink-500 h-1.5 rounded-full"
                    style={{ width: "85%" }}
                  ></div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                <div className="text-xs text-blue-600 font-bold uppercase mb-2">
                  Work
                </div>
                <div className="text-2xl font-bold text-blue-700">
                  {Math.floor(Math.random() * (98 - 75) + 75)}%
                </div>
                <div className="w-full bg-blue-200 h-1.5 rounded-full mt-2">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: "90%" }}
                  ></div>
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-center">
                <div className="text-xs text-purple-600 font-bold uppercase mb-2">
                  Lifestyle
                </div>
                <div className="text-2xl font-bold text-purple-700">
                  {Math.floor(Math.random() * (5 - 3) + 3)}/5
                </div>
                <div className="flex justify-center gap-0.5 mt-1 text-purple-500">
                  {"★".repeat(4)}
                  {"☆".repeat(1)}
                </div>
              </div>
            </div>

            {/* Horoscope Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${signInfo.color} flex items-center justify-center`}
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    பொதுப்பலன்
                  </h2>
                </div>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p>{horoscope.horoscope.overall}</p>
                  <p>
                    இன்றைய நாள் உங்கள் செயல்பாடுகளில் நிலைத்தன்மையை உருவாக்க
                    உதவும். திட்டமிட்ட காரியங்களை முறையாக நிறைவேற்ற வாய்ப்பு
                    கிடைக்கும். புதிய யோசனைகளை நடைமுறைப்படுத்த சிறிய முயற்சிகள்
                    பெரிய பலனை அளிக்கும்.
                  </p>
                  <p>
                    உடன் பணிபுரியும் أشخاص உடன் நல்ல ஒத்துழைப்பு உருவாகலாம்.
                    நேரத்தை பொறுப்புடன் பயன்படுத்தினால் வெற்றி நிச்சயம்.
                    தன்னம்பிக்கையை உயர்த்தும் சூழ்நிலைகள் உருவாகும்.
                  </p>
                  <p>
                    தாமதமான விஷயங்களில் முன்னேற்றம் இருக்கும். திடீர் மாற்றங்களை
                    அமைதியாக சமாளித்தால் பலன் அதிகரிக்கும்.
                  </p>
                </div>
              </div>

              {/* Career */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    தொழில் / வியாபாரம்
                  </h2>
                </div>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p>{horoscope.horoscope.career}</p>
                  <p>
                    தொழில் / வியாபாரத்தில் புதிய வாய்ப்புகள் கிடைக்கலாம்.
                    முன்கூட்டிய திட்டமிடல் உங்களுக்கு தெளிவை அளிக்கும். குழு
                    பணியில் உங்கள் வழிகாட்டல் முக்கியமாக இருக்கும்.
                  </p>
                  <p>
                    புதிய வாடிக்கையாளர்கள் அல்லது இணைப்புகள் உருவாக வாய்ப்பு
                    உள்ளது. எடுக்கும் முடிவுகள் நீண்ட கால பலன் தரும்.
                    செலவினங்களை கட்டுப்படுத்த கவனம் செலுத்துங்கள்.
                  </p>
                  <p>
                    ஆவணங்கள், ஒப்பந்தங்கள் போன்றவற்றை ஆராய்ந்து முடிவு
                    எடுக்கவும். உழைப்புக்கு ஏற்ற மதிப்பு கிடைக்கும்.
                  </p>
                </div>
              </div>

              {/* Money */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">பணவரவு</h2>
                </div>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p>{horoscope.horoscope.money}</p>
                  <p>
                    பணவரவு நிலையாக இருக்கும். தேவையற்ற செலவுகளை தவிர்க்கலாம்.
                    எதிர்பாராத சிறிய லாபங்கள் கிடைக்கலாம்.
                  </p>
                  <p>
                    சேமிப்பில் கவனம் செலுத்தும் நாள். திட்டமிட்ட முதலீடுகள்
                    அடுத்த நாள்களில் நல்ல பலன் தரும். கடன் தொடர்பான முடிவுகளை
                    தெளிவாக எடுத்தால் நல்லது.
                  </p>
                  <p>
                    குடும்ப தேவைகளுக்கான செலவுகள் கட்டுப்பாட்டில் இருக்கும்.
                    விரயம் தவிர்த்தால் நன்மை அதிகரிக்கும்.
                  </p>
                </div>
              </div>

              {/* Family */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">குடும்பம்</h2>
                </div>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p>{horoscope.horoscope.family}</p>
                  <p>
                    குடும்பத்தில் நல்ல அமைதி நிலவும். பெரியவர்களின் அறிவுரைகள்
                    உங்களுக்கு உதவும். தம்பதிகளுக்கு புரிதல் அதிகரிக்கும்.
                  </p>
                  <p>
                    சிறிய கருத்து வேறுபாடுகளை அமைதியாக பேசித் தீர்க்கலாம்.
                    குழந்தைகளின் கல்வி / வளர்ச்சியில் மகிழ்ச்சி தரும் செய்திகள்.
                  </p>
                  <p>
                    உறவினர்களுடன் நட்பு கலந்த உறவு உருவாகும். குடும்பச் செலவுகளை
                    திட்டமிட்டால் சுமை குறையும்.
                  </p>
                </div>
              </div>

              {/* Love */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    காதல் / திருமணம்
                  </h2>
                </div>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p>{horoscope.horoscope.love}</p>
                  <p>
                    காதல் / திருமண உறவில் பரஸ்பர நம்பிக்கை அதிகரிக்கும். உறவில்
                    மகிழ்ச்சி தரும் நேரங்கள் அதிகம்.
                  </p>
                  <p>
                    பழைய கருத்து வேறுபாடுகளை மறந்து புதிய தொடக்கம் அமைக்கலாம்.
                    தொடர்புகளில் மென்மையாக பேசினால் நல்ல புரிதல் ஏற்படும்.
                  </p>
                  <p>
                    திருமணம் / நிச்சயதார்த்தம் தொடர்பான நல்ல செய்திகள் கிடைக்க
                    வாய்ப்பு உள்ளது.
                  </p>
                </div>
              </div>

              {/* Health */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    ஆரோக்கியம்
                  </h2>
                </div>
                <div className="text-gray-700 leading-relaxed space-y-3">
                  <p>{horoscope.horoscope.health}</p>
                  <p>
                    ஆரோக்கியம்方面 நல்ல நிலை இருக்கும். சிறிய சோர்வு இருந்தாலும்
                    விரைவில் தணியும்.
                  </p>
                  <p>
                    நீரை அதிகமாக குடிக்கவும்; சீரான உணவு பழக்கங்களை
                    பின்பற்றவும். உடற்பயிற்சி தொடங்க நல்ல நாள்.
                  </p>
                  <p>
                    மன அழுத்தத்தை குறைக்க தியானம் / யோகா உதவும். போதிய ஓய்வு
                    பெறுங்கள்.
                  </p>
                </div>
              </div>
            </div>

            {/* Remedy */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 shadow-lg border-2 border-yellow-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">பரிகாரம்</h2>
              </div>
              <p className="text-gray-700 leading-relaxed font-medium">
                {horoscope.horoscope.remedy}
              </p>
            </div>

            {/* CTA - Consult Astrologers */}
            <div
              className={`bg-gradient-to-r ${signInfo.color} rounded-2xl p-8 text-white text-center shadow-xl`}
            >
              <h3 className="text-2xl font-bold mb-3">
                Want Personalized Guidance?
              </h3>
              <p className="text-white/90 mb-6">
                Connect with our expert astrologers for detailed consultation
              </p>
              <button
                onClick={() => navigate("/")}
                className="bg-white text-purple-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Talk to Astrologer
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default HoroscopeDetail;
