# Registration 400 Error - Debugging Guide

## Problem
`POST https://astroweb-y0i6.onrender.com/api/auth/register` returns **400 Bad Request**

## Common Causes

### 1. Missing Required Fields
The API requires ALL of these fields:
```json
{
  "name": "Your Name",
  "email": "your@email.com",
  "password": "yourpassword",
  "role": "client"  // or "astrologer" or "admin"
}
```

### 2. Invalid Role
Role must be exactly one of:
- `"client"`
- `"astrologer"`
- `"admin"`

**Common mistakes**:
- ❌ `"user"` (wrong - use "client")
- ❌ `"User"` (wrong - must be lowercase)
- ❌ Missing role field

### 3. Invalid Email Format
Email must be valid format: `user@domain.com`

### 4. Password Too Short
Password must be at least 6 characters

### 5. User Already Exists
Email is already registered

---

## Updated Error Messages

The backend now returns specific errors:

### Missing Fields
```json
{
  "msg": "Please provide all required fields",
  "missing": {
    "name": false,
    "email": false,
    "password": true,  // ← This field is missing
    "role": false
  }
}
```

### Invalid Role
```json
{
  "msg": "Invalid role. Must be client, astrologer, or admin"
}
```

### Invalid Email
```json
{
  "msg": "Invalid email format"
}
```

### Password Too Short
```json
{
  "msg": "Password must be at least 6 characters long"
}
```

### User Exists
```json
{
  "msg": "User already exists"
}
```

---

## How to Test

### Using cURL:
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

### Using Postman:
1. Method: POST
2. URL: `https://astroweb-y0i6.onrender.com/api/auth/register`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "role": "client"
}
```

### Using Browser Console:
```javascript
fetch('https://astroweb-y0i6.onrender.com/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'client'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

---

## Expected Success Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Test User",
    "email": "test@example.com",
    "role": "client"
  }
}
```

---

## Check Your Request

1. **Open Browser DevTools** (F12)
2. **Go to Network tab**
3. **Try to register**
4. **Click on the failed request**
5. **Check "Payload" tab** - What data is being sent?
6. **Check "Response" tab** - What error message do you see?

---

## Common Frontend Issues

### Check Login.jsx Registration Form

Make sure the registration form sends all required fields:

```javascript
const registerData = {
  name: formData.name,        // ← Must be present
  email: formData.email,      // ← Must be present
  password: formData.password, // ← Must be present
  role: 'client'              // ← Must be present
};

await axios.post(`${API_URL}/api/auth/register`, registerData);
```

---

## Next Steps

1. **Check the exact error message** in the response
2. **Verify all 4 fields are being sent** (name, email, password, role)
3. **Make sure role is lowercase** ("client" not "Client")
4. **Try with a different email** (in case user already exists)
5. **Check password is at least 6 characters**

The updated backend will now tell you exactly what's wrong! 🔍
