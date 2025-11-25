# Registration 500 Error - Fix Guide

## Problem
`POST https://astroweb-y0i6.onrender.com/api/auth/register` returns **500 Internal Server Error**

This means the request passed validation but something failed on the server.

---

## Most Common Causes

### 1. ❌ **JWT_SECRET Not Set on Render.com**

**Symptom**: JWT signing fails with error
```
Error: secretOrPrivateKey must have a value
```

**Solution**: Add environment variable on Render.com

1. Go to Render.com Dashboard
2. Select your web service
3. Go to **Environment** tab
4. Add:
   - Key: `JWT_SECRET`
   - Value: `your_jwt_secret_key_here` (or generate a strong random string)

**Generate a strong secret**:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### 2. ❌ **MongoDB Connection Failed**

**Symptom**: Cannot connect to database
```
MongoServerError: Authentication failed
```

**Solution**: Check MongoDB URI

1. Verify `MONGO_URI` is set on Render.com
2. Check MongoDB Atlas:
   - IP Whitelist includes `0.0.0.0/0` (allow all)
   - Database user has correct password
   - Cluster is running

**Your MongoDB URI**:
```
mongodb+srv://murugannagaraja781_db_user:NewLife2025@cluster0.tp2gekn.mongodb.net/astroweb
```

---

### 3. ❌ **Missing Environment Variables**

**Required on Render.com**:
```
PORT=9001
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret_key_here
AGORA_APP_ID=196be66ba9ab4172921c1e7f7e948879
MSG91_AUTHKEY=478312AgHesvjV691c86b3P1
MSG91_TEMPLATE_ID=6749f5d5d6fc054b4a0e1e0c
```

---

## How to Debug

### Check Render.com Logs

1. Go to Render.com Dashboard
2. Click on your web service
3. Click **Logs** tab
4. Look for error messages when you try to register

**Common errors**:
```
❌ "secretOrPrivateKey must have a value"
   → JWT_SECRET not set

❌ "MongoServerError: Authentication failed"
   → Wrong MongoDB credentials

❌ "connect ECONNREFUSED"
   → MongoDB connection failed
```

---

## Quick Fix Steps

### Step 1: Set JWT_SECRET on Render.com

```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copy the output and add to Render.com Environment variables
```

### Step 2: Verify MongoDB Connection

Test locally first:
```bash
cd server
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://murugannagaraja781_db_user:NewLife2025@cluster0.tp2gekn.mongodb.net/astroweb')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err.message));
"
```

### Step 3: Check All Environment Variables

On Render.com, verify all these are set:
- ✅ `MONGO_URI`
- ✅ `JWT_SECRET`
- ✅ `PORT`
- ✅ `AGORA_APP_ID`
- ✅ `MSG91_AUTHKEY`
- ✅ `MSG91_TEMPLATE_ID`

### Step 4: Redeploy

After adding environment variables:
1. Click **Manual Deploy** → **Deploy latest commit**
2. Wait for deployment to complete
3. Try registration again

---

## Test Registration

After fixing, test with:

```bash
curl -X POST https://astroweb-y0i6.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "client"
  }'
```

**Expected Success**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "client"
  }
}
```

---

## Additional Debugging

### Enable Detailed Logging

Temporarily add to `authController.js`:

```javascript
exports.register = async (req, res) => {
  try {
    console.log('📝 Registration attempt:', req.body);

    const { name, email, password, role } = req.body;

    console.log('✅ Validation passed');

    // ... rest of code

    console.log('✅ User created:', user._id);
    console.log('✅ Wallet created');

    if (role === 'astrologer') {
      console.log('✅ Astrologer profile created');
    }

    console.log('🔑 Signing JWT...');

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) {
        console.error('❌ JWT Error:', err.message);
        throw err;
      }
      console.log('✅ JWT signed successfully');
      res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    });

  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
```

Then check Render.com logs to see where it fails.

---

## Most Likely Solution

**99% of the time, it's missing JWT_SECRET on Render.com!**

1. Go to Render.com
2. Environment tab
3. Add `JWT_SECRET` with a strong random value
4. Redeploy
5. Try again ✅

---

*After fixing, registration should work perfectly!* 🎉
