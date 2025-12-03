# OTP Login - Quick Start Guide

## 🚀 Setup (Already Done!)

Your MSG91 OTP login is already configured with:
- ✅ Template ID: `1407172294566795685`
- ✅ Sender ID: `ASTRO9`
- ✅ Auth Key: `478312AgHesvjV691c86b3P1`

---

## 🧪 Testing

### Step 1: Start Your Server
```bash
cd server
npm start
```

### Step 2: Test OTP Send
```bash
# In a new terminal
cd server
node test_otp_integration.js
```

This will:
1. Send OTP to test phone number
2. Show success/error message
3. Wait for you to verify

### Step 3: Verify OTP
After receiving OTP on your phone:
```bash
node test_otp_integration.js verify 123456
```
(Replace `123456` with the actual OTP you received)

### Step 4: Test Direct MSG91 API (Optional)
```bash
node test_otp_integration.js direct
```

---

## 📱 Using in Frontend

### 1. Start Frontend
```bash
cd client
npm run dev
```

### 2. Open Login Page
Navigate to: `http://localhost:5173/login`

### 3. Click "OTP Login" Tab

### 4. Enter Phone Number
- Enter 10-digit mobile number
- Example: `9876543210`

### 5. Click "Send Cosmic OTP"
- OTP will be sent to your phone
- Wait 10-30 seconds

### 6. Enter OTP
- Check your phone for 6-digit OTP
- Enter it in the OTP field

### 7. Click "Verify Cosmic OTP"
- If correct, you'll be logged in
- Redirected to dashboard

---

## 🔧 Configuration Files

### Server (.env):
```env
MSG91_AUTHKEY=478312AgHesvjV691c86b3P1
MSG91_TEMPLATE_ID=1407172294566795685
MSG91_SENDER_ID=ASTRO9
```

### Client (.env):
```env
VITE_API_URL=http://localhost:9001
VITE_MSG91_AUTHKEY=478312AgHesvjV691c86b3P1
```

---

## 🐛 Troubleshooting

### OTP Not Received?

**Check 1: Phone Number Format**
```
✅ Correct: 9876543210 (10 digits)
❌ Wrong: +919876543210
❌ Wrong: 919876543210
❌ Wrong: 98765 (too short)
```

**Check 2: Server Logs**
```bash
# Look for errors in server console
# Should see: "Sending OTP to: 9876543210"
```

**Check 3: MSG91 Account**
- Login to MSG91 dashboard
- Check account balance
- Verify template is approved
- Confirm sender ID is active

### "Failed to send OTP" Error?

**Solution 1: Check Auth Key**
```bash
# In server/.env
MSG91_AUTHKEY=478312AgHesvjV691c86b3P1
```

**Solution 2: Check Template ID**
```bash
# In server/.env
MSG91_TEMPLATE_ID=1407172294566795685
```

**Solution 3: Test Direct API**
```bash
node server/test_otp_integration.js direct
```

### "Invalid OTP" Error?

**Possible Causes:**
1. OTP expired (>5 minutes old)
2. Wrong OTP entered
3. OTP already used

**Solution:**
- Click "Resend OTP"
- Enter new OTP within 5 minutes
- Check OTP carefully (6 digits)

---

## 📊 What Happens Behind the Scenes

### When You Send OTP:
```
1. Frontend → POST /api/otp/send
2. Server validates phone number
3. Server calls MSG91 API
4. MSG91 sends SMS with OTP
5. Server responds with success
6. Frontend shows OTP input field
```

### When You Verify OTP:
```
1. Frontend → POST /api/otp/verify
2. Server calls MSG91 verify API
3. MSG91 validates OTP
4. If valid:
   - Check if user exists
   - If not, create new user
   - Create wallet for new user
   - Generate JWT token
   - Return token + user data
5. Frontend stores token
6. Redirect to dashboard
```

---

## 🎯 Success Indicators

### OTP Sent Successfully:
```
✅ Alert: "OTP sent successfully! Please check your phone."
✅ OTP input field appears
✅ Phone number field is disabled
✅ "Verify OTP" button is visible
```

### OTP Verified Successfully:
```
✅ Alert: "OTP verified successfully!"
✅ Redirected to /dashboard
✅ User is logged in
✅ Token stored in localStorage
```

---

## 🔐 Security Notes

### Phone Numbers:
- Stored without country code
- Validated for 10 digits
- Cleaned of special characters

### OTPs:
- 6 digits long
- Valid for 5 minutes
- One-time use only
- Cannot be reused

### JWT Tokens:
- Valid for 7 days
- Stored in localStorage
- Used for authentication
- Contains user ID and role

---

## 📞 Support

### If OTP Still Not Working:

1. **Check MSG91 Dashboard:**
   - https://control.msg91.com/
   - Login with your credentials
   - Check SMS logs
   - Verify account balance

2. **Check Server Logs:**
   ```bash
   # Look for detailed error messages
   tail -f server/logs/app.log
   ```

3. **Test with Different Phone:**
   - Try another mobile number
   - Ensure it's a valid Indian number

4. **Contact MSG91 Support:**
   - Email: support@msg91.com
   - Provide Template ID and error details

---

## ✨ Features Working

✅ Phone number validation
✅ OTP sending via MSG91
✅ OTP verification
✅ Auto user creation
✅ Wallet creation
✅ JWT authentication
✅ Loading states
✅ Error messages
✅ Resend OTP
✅ Clean UI

---

## 🎉 You're All Set!

Your OTP login is fully configured and ready to use. Just:
1. Start the server
2. Open the login page
3. Click "OTP Login"
4. Enter phone number
5. Verify OTP
6. You're in!

**Happy coding!** 🚀
