# Tamil Rasi Palan (Horoscope) API Options

Complete list of external APIs for integrating Tamil horoscope/rasi palan into your AstroWeb platform.

---

## 🌟 Recommended APIs

### 1. **VedicAstroAPI** ⭐ Best Overall
**Website**: https://vedicastroapi.com

**Features**:
- ✅ 21 languages including Tamil
- ✅ Daily, weekly, monthly, yearly predictions
- ✅ Vedic & Western astrology
- ✅ Birth charts (Kundli)
- ✅ Matchmaking
- ✅ Panchang/Tamil calendar

**Pricing**:
- Free trial (no credit card required)
- Paid plans available

**API Example**:
```javascript
// Daily Horoscope
GET https://api.vedicastroapi.com/v3-json/horoscope/daily-sun
?dob=15/01/1990
&tob=10:30
&lat=13.0827
&lon=80.2707
&tz=5.5
&lang=ta

// Response includes Tamil predictions
```

---

### 2. **AstrologyAPI (Vedic Rishi)** ⭐ Most Popular
**Website**: https://astrologyapi.com / https://vedicrishiapi.com

**Features**:
- ✅ Tamil Panchang API
- ✅ Daily horoscope predictions
- ✅ Hindu calendar (tithi, nakshatra)
- ✅ Kundli generation
- ✅ JSON format

**Pricing**:
- 14-day free trial
- Paid plans from $9/month

**API Endpoints**:
```javascript
// Tamil Panchang
POST https://json.astrologyapi.com/v1/tamil_panchang
{
  "day": 15,
  "month": 1,
  "year": 2024,
  "hour": 10,
  "min": 30,
  "lat": 13.0827,
  "lon": 80.2707,
  "tzone": 5.5
}

// Daily Horoscope
POST https://json.astrologyapi.com/v1/sun_sign_prediction/daily/:sign
{
  "zodiac": "aries",
  "lang": "ta"
}
```

---

### 3. **JyotishamAstro API** ⭐ Multi-Language
**Website**: https://jyotishamastroapi.com

**Features**:
- ✅ Tamil language support
- ✅ Daily, weekly, monthly, yearly predictions
- ✅ Kundli generation
- ✅ Panchang
- ✅ Matchmaking
- ✅ Love, career, health, finance predictions

**Pricing**:
- Free tier available
- "Get Started For Free" option

**API Format**:
```javascript
// Daily Horoscope
GET /api/horoscope/daily
?sign=aries
&lang=ta
&date=2024-01-15

// Response
{
  "sign": "மேஷம்",
  "date": "2024-01-15",
  "prediction": {
    "overall": "...",
    "love": "...",
    "career": "...",
    "health": "...",
    "finance": "..."
  }
}
```

---

### 4. **Prokerala Astrology API**
**Website**: https://www.prokerala.com/astrology/api/

**Features**:
- ✅ Tamil Panchangam
- ✅ Daily horoscope
- ✅ Kundli/birth charts
- ✅ Various calculators
- ✅ Reliable and accurate

**Pricing**:
- Free demo available
- Paid plans

**API Example**:
```javascript
// Tamil Panchangam
GET https://api.prokerala.com/v2/astrology/panchang
?ayanamsa=1
&coordinates=13.0827,80.2707
&datetime=2024-01-15T10:30:00
&la=ta
```

---

### 5. **Free Astrology API** ⭐ 100% Free
**Website**: https://freeastrologyapi.com

**Features**:
- ✅ Completely FREE
- ✅ Horoscopes
- ✅ Birth charts
- ✅ Compatibility
- ✅ Indian & Western astrology

**Pricing**:
- 100% Free!

**API Format**:
```javascript
// Daily Horoscope
GET https://freeastrologyapi.com/api/horoscope/daily
?sign=aries
&lang=en // May need to translate to Tamil
```

---

### 6. **Kundli.click API**
**Website**: https://kundli.click

**Features**:
- ✅ Tamil, Telugu, Kannada, Malayalam, Marathi support
- ✅ Horoscope charts
- ✅ Daily Nakshatra predictions
- ✅ Planet details
- ✅ JSON data

**Pricing**:
- Free tier available

---

### 7. **Divine API**
**Website**: https://divineapi.com

**Features**:
- ✅ Daily, weekly, monthly, yearly horoscopes
- ✅ All 12 zodiac signs
- ✅ Daily Panchang
- ✅ Comprehensive insights

**Pricing**:
- Check website for pricing

---

## 📊 Comparison Table

| API | Tamil Support | Free Tier | Daily Horoscope | Panchang | Price (approx) |
|-----|--------------|-----------|-----------------|----------|----------------|
| VedicAstroAPI | ✅ Yes | ✅ Trial | ✅ Yes | ✅ Yes | Paid |
| AstrologyAPI | ✅ Yes | ✅ 14 days | ✅ Yes | ✅ Yes | $9+/month |
| JyotishamAstro | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | Free tier |
| Prokerala | ✅ Yes | ✅ Demo | ✅ Yes | ✅ Yes | Paid |
| Free Astrology | ⚠️ Limited | ✅ 100% Free | ✅ Yes | ❌ No | Free |
| Kundli.click | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | Free tier |
| Divine API | ⚠️ Check | ⚠️ Check | ✅ Yes | ✅ Yes | Check |

---

## 🎯 Recommended Choice for AstroWeb

### **Best Option: AstrologyAPI (Vedic Rishi)**

**Why?**
1. ✅ Excellent Tamil support
2. ✅ 14-day free trial to test
3. ✅ Well-documented API
4. ✅ JSON format (easy integration)
5. ✅ Reliable and popular
6. ✅ Affordable pricing

### **Alternative: JyotishamAstro API**

**Why?**
1. ✅ Free tier available
2. ✅ Good Tamil support
3. ✅ Comprehensive features
4. ✅ Easy to integrate

---

## 💻 Integration Example for AstroWeb

### Step 1: Update Environment Variables
```bash
# server/.env
ASTROLOGY_API_KEY=your_api_key_here
ASTROLOGY_API_USER_ID=your_user_id
```

### Step 2: Create API Service
```javascript
// server/services/astrologyService.js
const axios = require('axios');

const API_BASE = 'https://json.astrologyapi.com/v1';
const API_USER_ID = process.env.ASTROLOGY_API_USER_ID;
const API_KEY = process.env.ASTROLOGY_API_KEY;

const auth = {
  username: API_USER_ID,
  password: API_KEY
};

// Tamil Zodiac Signs Mapping
const tamilSigns = {
  'mesham': 'aries',
  'rishabam': 'taurus',
  'mithunam': 'gemini',
  'kadagam': 'cancer',
  'simmam': 'leo',
  'kanni': 'virgo',
  'thulam': 'libra',
  'viruchigam': 'scorpio',
  'dhanusu': 'sagittarius',
  'magaram': 'capricorn',
  'kumbam': 'aquarius',
  'meenam': 'pisces'
};

exports.getDailyHoroscope = async (tamilSign) => {
  try {
    const englishSign = tamilSigns[tamilSign.toLowerCase()];

    const response = await axios.post(
      `${API_BASE}/sun_sign_prediction/daily/${englishSign}`,
      {
        zodiac: englishSign,
        lang: 'ta' // Tamil language
      },
      { auth }
    );

    return response.data;
  } catch (error) {
    console.error('Astrology API Error:', error);
    throw error;
  }
};

exports.getTamilPanchang = async (date) => {
  try {
    const response = await axios.post(
      `${API_BASE}/tamil_panchang`,
      {
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        hour: 10,
        min: 0,
        lat: 13.0827, // Chennai coordinates
        lon: 80.2707,
        tzone: 5.5
      },
      { auth }
    );

    return response.data;
  } catch (error) {
    console.error('Panchang API Error:', error);
    throw error;
  }
};
```

### Step 3: Update Horoscope Controller
```javascript
// server/controllers/horoscopeController.js
const astrologyService = require('../services/astrologyService');

exports.getDailyHoroscope = async (req, res) => {
  try {
    const { sign } = req.query;

    // Try to get from external API first
    try {
      const externalData = await astrologyService.getDailyHoroscope(sign);
      return res.json(externalData);
    } catch (apiError) {
      // Fallback to database if API fails
      console.log('Using database fallback');
      const dbHoroscope = await Horoscope.findOne({
        rasi: sign,
        date: new Date().toISOString().split('T')[0]
      });

      if (dbHoroscope) {
        return res.json(dbHoroscope);
      }

      return res.status(404).json({ msg: 'Horoscope not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
```

---

## 🔧 Testing the API

### Using Postman/cURL
```bash
# Test AstrologyAPI
curl -X POST https://json.astrologyapi.com/v1/sun_sign_prediction/daily/aries \
  -u "user_id:api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "zodiac": "aries",
    "lang": "ta"
  }'
```

---

## 📝 Next Steps

1. **Sign up** for AstrologyAPI 14-day trial
2. **Get API credentials** (User ID + API Key)
3. **Test** the API with Postman
4. **Integrate** into AstroWeb backend
5. **Update** frontend to display Tamil predictions
6. **Add caching** to reduce API calls
7. **Set up fallback** to database if API fails

---

## 💡 Pro Tips

1. **Cache Results**: Store daily horoscopes in database to reduce API calls
2. **Cron Job**: Fetch all 12 signs daily at midnight
3. **Fallback**: Keep manual horoscope entry option in admin
4. **Cost Control**: Monitor API usage to stay within budget
5. **Translation**: Some APIs may need English→Tamil translation

---

*Recommended: Start with AstrologyAPI 14-day trial, then evaluate based on usage and cost.*
