# Swisseph Installation Issue

## Problem

The `swisseph` npm package cannot be installed due to a Python compatibility issue:

```
ModuleNotFoundError: No module named 'distutils'
```

This occurs because:
- `swisseph` is a native Node.js addon that requires compilation
- It uses `node-gyp` which depends on Python's `distutils`
- Python 3.12+ removed `distutils` from the standard library

## Current Status

✅ **App is working** - The code gracefully falls back to mock data:

```javascript
// server/utils/swiss.js
try {
    swe = require('swisseph');
    swe.swe_set_ephe_path(__dirname + '/../ephe');
} catch (e) {
    console.warn("swisseph module not found, using mock data");
    swe = null;
}
```

## Solutions

### Option 1: Install Python setuptools (Recommended)

```bash
# Install Python setuptools which includes distutils
pip3 install setuptools

# Then install swisseph
cd server && npm install swisseph --save
```

### Option 2: Use Python 3.11 or earlier

```bash
# Install Python 3.11 via pyenv or homebrew
brew install python@3.11

# Set as default
export PATH="/usr/local/opt/python@3.11/bin:$PATH"

# Install swisseph
cd server && npm install swisseph --save
```

### Option 3: Use Alternative Package

Replace `swisseph` with `astronomia` or `astrojs` which are pure JavaScript:

```bash
cd server && npm install astronomia --save
```

Then update `server/utils/swiss.js` to use the new package.

### Option 4: Keep Mock Data (Current)

For development/testing, the mock data works fine. Real astrology calculations are only needed for production.

## Recommended Action

**For development**: Keep using mock data (no action needed)

**For production**: Run Option 1 on the production server:

```bash
# On production server
pip3 install setuptools
cd /path/to/astroweb/server
npm install swisseph --save
```

## Verification

After installing swisseph, verify it works:

```bash
cd server
node -e "const swe = require('swisseph'); console.log('swisseph loaded successfully');"
```

If successful, restart the server and the warning will disappear.

## Impact

**Without swisseph**:
- Astrology calculations use mock/random data
- Horoscope API returns placeholder values
- No impact on chat, video call, or other features

**With swisseph**:
- Real astronomical calculations
- Accurate horoscope generation
- Proper planetary positions

---

**Status**: Using mock data (acceptable for development)
**Priority**: Low (only needed for production astrology features)
**Workaround**: Install Python setuptools when needed
