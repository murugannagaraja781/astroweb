require('dotenv').config();

/**
 * Daily Horoscope AI Generator
 * Uses OpenAI-compatible API to generate horoscope predictions
 */

// Mock AI generation for now - replace with actual OpenAI integration
async function generateDailyHoroscope(sign, date, language = 'ta') {
    const signLabel = sign;

    // For production, use actual OpenAI API
    // const OpenAI = require('openai');
    // const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const promptTa = `
நீங்கள் ஒரு அனுபவம் மிகுந்த தமிழ் ஜோதிடர்.
கீழே கொடுக்கப்பட்ட ராசிக்கான தினபலனை எழுதுங்கள்.

ராசி: ${signLabel}
தேதி: ${date}

வழிமுறைகள்:
- தமிழ் மொழியில் எழுதுங்கள்.
- 6 முக்கிய பகுதிகளாக எழுதுங்கள்: பொதுப்பலன், தொழில்/வியாபாரம், பணவரவு, குடும்பம், காதல்/திருமணம், ஆரோக்கியம்.
- ஒவ்வொரு பகுதியும் 2–3 short வாக்கியங்களாக இருக்க வேண்டும்.
- மிகவும் பயமுறுத்தும் negative வார்த்தைகள் பயன்படுத்தாதீர்கள்; practical advice கொடுங்கள்.
- முடிவில் "பரிகாரம்" என்ற தலைப்பில் சின்ன பரிகாரம்/ஹாபிட் ஒரு point மட்டும் கொடுங்கள்.

Reply in JSON format:
{
  "overall": "...",
  "career": "...",
  "money": "...",
  "family": "...",
  "love": "...",
  "health": "...",
  "remedy": "..."
}
`;

    const promptEn = `
You are an experienced Vedic astrologer.
Write a detailed daily horoscope in JSON format.

Sign: ${signLabel}
Date: ${date}

Instructions:
- Reply in simple English.
- Cover: Overall, Career/Business, Money, Family, Love/Marriage, Health.
- 2–3 short sentences per section.
- End with one small "Remedy" suggestion.

Reply in JSON format:
{
  "overall": "...",
  "career": "...",
  "money": "...",
  "family": "...",
  "love": "...",
  "health": "...",
  "remedy": "..."
}
`;

    // Mock response for now - replace with actual AI call
    const mockHoroscopes = {
        mesham: {
            overall: "இன்று மேஷ ராசிக்காரர்களுக்கு நல்ல நாள். புதிய வாய்ப்புகள் கிடைக்கும். தைரியமாக முன்னேறுங்கள்.",
            career: "வேலையில் முன்னேற்றம் உண்டாகும். மேலதிகாரிகளின் பாராட்டு கிடைக்கும்.",
            money: "பணவரவு சிறப்பாக இருக்கும். பழைய கடன் அடைக்க வழி உண்டாகும்.",
            family: "குடும்பத்தில் மகிழ்ச்சி நிலவும். உறவினர்களிடம் நல்லுறவு மேம்படும்.",
            love: "காதல் விஷயங்களில் சாதகமான முடிவு எடுக்கலாம். நல்ல புரிதல் உண்டாகும்.",
            health: "ஆரோக்கியம் சிறப்பாக இருக்கும். சிறிய தலைவலி வரலாம்.",
            remedy: "சிவன் கோவிலில் விளக்கேற்றவும். சிவப்பு நிற உடை அணியவும்."
        },
        rishabam: {
            overall: "ரிஷப ராசிக்காரர்களுக்கு இன்று சாதகமான நாள். பொறுமையாக செயல்படுங்கள்.",
            career: "புதிய திட்டங்கள் தொடங்க நல்ல நா ள். உழைப்புக்குப் பலன் கிடைக்கும்.",
            money: "சேமிப்பு அதிகரிக்கும். முதலீடுகள் லாபம் தரும்.",
            family: "குடும்பத்துடன் நல்ல நேரம் செலவிடுங்கள். தாயின் ஆசி கிடைக்கும்.",
            love: "காதல் உறவு வலுவடையும். நல்ல புரிதல் உருவாகும்.",
            health: "உடல்நலம் நன்றாக இருக்கும். உடற்பயிற்சி செய்யுங்கள்.",
            remedy: "வெள்ளி கிழமை லட்சுமி பூஜை செய்யவும்."
        }
    };

    // Default horoscope for other signs
    const defaultHoroscope = {
        overall: `${signLabel} ராசிக்காரர்களுக்கு இன்று மிதமான பலன்கள் உண்டு. கவனமாக செயல்படுங்கள்.`,
        career: "வேலையில் கவனம் தேவை. முக்கிய முடிவுகளை அவசரப்படாமல் எடுங்கள்.",
        money: "பணவரவு சாதாரணமாக இருக்கும். சேமிப்பை அதிகரிக்கவும்.",
        family: "குடும்பத்தில் சிறு பிரச்சனைகள் வரலாம். பொறுமையாக தீர்க்கவும்.",
        love: "காதல் உறவில் புரிதல் முக்கியம். பேசி தீர்க்கவும்.",
        health: "ஆரோக்கியத்தில் கவனம் தேவை. ஓய்வு எடுத்துக்கொள்ளவும்.",
        remedy: "கோயில் தரிசனம் செய்யவும். தானம் செய்யவும்."
    };

    const horoscope = mockHoroscopes[sign] || defaultHoroscope;

    return JSON.stringify(horoscope);
}

module.exports = { generateDailyHoroscope };
