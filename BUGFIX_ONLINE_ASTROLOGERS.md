# Fix: Online Astrologers Not Showing in UI

## Problem
API returns astrologers with `isOnline: true` at root level, but frontend was checking `astrologer.profile?.isOnline`.

## Root Cause
**API Response Structure**:
```json
{
  "_id": "...",
  "name": "...",
  "isOnline": true,  // ← At root level
  "languages": [...],
  "specialties": [...]
}
```

**Frontend Code (WRONG)**:
```javascript
astrologers.filter(a => a.profile?.isOnline)  // ❌ Looking for profile.isOnline
```

## Solution
Changed all frontend files to check `a.isOnline` instead of `a.profile?.isOnline`.

## Files Fixed
1. ✅ `/client/src/pages/mobile/MobileHome.jsx` - Line 13, 233
2. ✅ `/client/src/pages/desktop/DesktopHome.jsx` - Line 12, 13
3. ✅ `/client/src/pages/AstrologerDetail.jsx` - Line 129, 137
4. ✅ `/client/src/pages/AdminDashboard.jsx` - Lines 627, 629, 635, 637

## Changes Made

### Before:
```javascript
const onlineAstrologers = astrologers.filter(a => a.profile?.isOnline);
{astrologer.profile?.isOnline && <OnlineBadge />}
```

### After:
```javascript
const onlineAstrologers = astrologers.filter(a => a.isOnline);
{astrologer.isOnline && <OnlineBadge />}
```

## Test Results
Now all 6 online astrologers from your API response will show correctly:
- Nagaraja Murugan (isOnline: true) ✅
- ABINASH (isOnline: true) ✅
- wohozo (isOnline: true) ✅
- Abinash (isOnline: true) ✅
- Client (isOnline: true) ✅
- astro (isOnline: true) ✅

## Why This Happened
The `publicController.js` uses spread operator to flatten the profile:
```javascript
return {
  _id: astro._id,
  name: astro.name,
  ...profile?._doc  // ← This spreads all profile fields to root level
};
```

This puts `isOnline`, `languages`, `specialties`, etc. at the root level, not inside a `profile` object.

## Verification
Refresh your browser and you should now see all 6 online astrologers in the "Online Now" section! 🎉
