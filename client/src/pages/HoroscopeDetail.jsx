import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Briefcase, DollarSign, Heart, Users, Activity, Lightbulb, Calendar } from 'lucide-react';
import axios from 'axios';

const HoroscopeDetail = () => {
  const { sign } = useParams();
  const navigate = useNavigate();
  const [horoscope, setHoroscope] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const SIGN_INFO = {
    mesham: { name: 'மேஷம்', nameEn: 'Aries', icon: '♈', color: 'from-red-500 to-red-700', dates: 'Mar 21 - Apr 19' },
    rishabam: { name: 'ரிஷபம்', nameEn: 'Taurus', icon: '♉', color: 'from-green-500 to-green-700', dates: 'Apr 20 - May 20' },
    mithunam: { name: 'மிதுனம்', nameEn: 'Gemini', icon: '♊', color: 'from-yellow-500 to-yellow-700', dates: 'May 21 - Jun 20' },
    kadagam: { name: 'கடகம்', nameEn: 'Cancer', icon: '♋', color: 'from-blue-500 to-blue-700', dates: 'Jun 21 - Jul 22' },
    simmam: { name: 'சிம்மம்', nameEn: 'Leo', icon: '♌', color: 'from-orange-500 to-orange-700', dates: 'Jul 23 - Aug 22' },
    kanni: { name: 'கன்னி', nameEn: 'Virgo', icon: '♍', color: 'from-pink-500 to-pink-700', dates: 'Aug 23 - Sep 22' },
    thulam: { name: 'துலாம்', nameEn: 'Libra', icon: '♎', color: 'from-purple-500 to-purple-700', dates: 'Sep 23 - Oct 22' },
    viruchigam: { name: 'விருச்சிகம்', nameEn: 'Scorpio', icon: '♏', color: 'from-red-600 to-red-800', dates: 'Oct 23 - Nov 21' },
    dhanusu: { name: 'தனுசு', nameEn: 'Sagittarius', icon: '♐', color: 'from-indigo-500 to-indigo-700', dates: 'Nov 22 - Dec 21' },
    magaram: { name: 'மகரம்', nameEn: 'Capricorn', icon: '♑', color: 'from-gray-500 to-gray-700', dates: 'Dec 22 - Jan 19' },
    kumbam: { name: 'கும்பம்', nameEn: 'Aquarius', icon: '♒', color: 'from-cyan-500 to-cyan-700', dates: 'Jan 20 - Feb 18' },
    meenam: { name: 'மீனம்', nameEn: 'Pisces', icon: '♓', color: 'from-teal-500 to-teal-700', dates: 'Feb 19 - Mar 20' },
  };

  const signInfo = SIGN_INFO[sign];

  useEffect(() => {
    fetchHoroscope();
  }, [sign]);

  const fetchHoroscope = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/horoscope/daily?sign=${sign}&lang=ta`
      );
      setHoroscope(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching horoscope:', err);
      setError('Failed to load horoscope. Please try again.');
      setLoading(false);
    }
  };

  if (!signInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Invalid zodiac sign</p>
          <button onClick={() => navigate('/')} className="mt-4 text-purple-600 underline">
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${signInfo.color} text-white py-8 px-4 shadow-lg`}>
        <div className="container mx-auto max-w-4xl">
          <button
            onClick={() => navigate('/')}
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
                <span className="font-semibold">Today's Prediction:</span>{' '}
                {new Date(horoscope.date).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Horoscope Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${signInfo.color} flex items-center justify-center`}>
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">பொதுப்பலன்</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">{horoscope.horoscope.overall}</p>
              </div>

              {/* Career */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">தொழில் / வியாபாரம்</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">{horoscope.horoscope.career}</p>
              </div>

              {/* Money */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">பணவரவு</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">{horoscope.horoscope.money}</p>
              </div>

              {/* Family */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">குடும்பம்</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">{horoscope.horoscope.family}</p>
              </div>

              {/* Love */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">காதல் / திருமணம்</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">{horoscope.horoscope.love}</p>
              </div>

              {/* Health */}
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">ஆரோக்கியம்</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">{horoscope.horoscope.health}</p>
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
              <p className="text-gray-700 leading-relaxed font-medium">{horoscope.horoscope.remedy}</p>
            </div>

            {/* CTA - Consult Astrologers */}
            <div className={`bg-gradient-to-r ${signInfo.color} rounded-2xl p-8 text-white text-center shadow-xl`}>
              <h3 className="text-2xl font-bold mb-3">Want Personalized Guidance?</h3>
              <p className="text-white/90 mb-6">
                Connect with our expert astrologers for detailed consultation
              </p>
              <button
                onClick={() => navigate('/')}
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
