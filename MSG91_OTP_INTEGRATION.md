# MSG91 OTP Login Integration

## ✅ Implementation Complete

### Configuration Details:
- **Auth Key:** `478312AgHesvjV691c86b3P1`
- **Template ID:** `1407172294566795685` (DLT-Approved)
- **Sender ID:** `ASTRO9`
- **Template Content:** "Dear customer,use this One Time Password ##OTP## to log in to your Astro5star account"
- **OTP Length:** 6 digits
- **OTP Expiry:** 5 minutes
- **DLT Status:** ✅ Approved for India

---

## 🔧 Server Configuration

### Environment Variables (.env):
```env
MSG91_AUTHKEY=478312AgHesvjV691c86b3P1
MSG91_TEMPLATE_ID=1407172294566795685
MSG91_SENDER_ID=ASTRO9
```

### API Endpoints:

#### 1. Send OTP
```
POST /api/otp/send
Content-Type: application/json

Body:
{
  "phoneNumber": "9876543210"
}

Response (Success):
{
  "type": "success",
  "message": "OTP sent successfully",
  "phone": "9876543210"
}

Response (Error):
{
  "msg": "Error sending OTP",
  "error": "Error message",
  "details": {...}
}
```

#### 2. Verify OTP
```
POST /api/otp/verify
Content-Type: application/json

Body:
{
  "phoneNumber": "9876543210",
  "otp": "123456"
}

Response (Success):
{
  "type": "success",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@email.com",
    "phone": "9876543210",
    "role": "client"
  }
}

Response (Error):
{
  "msg": "Invalid OTP",
  "details": {...}
}
```

---

## 📱 Frontend Integration

### Login Page Features:
1. **Toggle between Email and OTP login**
2. **Phone number input** (10 digits)
3. **Send OTP button** with loading state
4. **OTP input field** (6 digits)
5. **Verify OTP button** with loading state
6. **Resend OTP option**

### User Flow:
```
1. User enters phone number (10 digits)
   ↓
2. Click "Send Cosmic OTP"
   ↓
3. OTP sent via SMS (MSG91)
   ↓
4. User receives OTP on phone
   ↓
5. User enters OTP (6 digits)
   ↓
6. Click "Verify Cosmic OTP"
   ↓
7. OTP verified → User logged in
   ↓
8. Redirect to dashboard
```

---

## 🔐 Security Features

### Phone Number Validation:
- Must be exactly 10 digits
- Automatically cleaned (removes spaces, dashes)
- Prefixed with country code (91 for India)

### OTP Security:
- 6-digit random OTP
- Expires in 5 minutes
- One-time use only
- Verified server-side

### Auto User Creation:
- If phone number doesn't exist, creates new user
- Assigns default role: "client"
- Creates wallet automatically
- Generates JWT token for session

---

## 🧪 Testing

### Test Send OTP:
```bash
curl -X POST http://localhost:9001/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "9876543210"}'
```

### Test Verify OTP:
```bash
curl -X POST http://localhost:9001/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "9876543210", "otp": "123456"}'
```

### Expected Responses:

**Send OTP Success:**
```json
{
  "type": "success",
  "message": "OTP sent successfully",
  "phone": "9876543210"
}
```

**Verify OTP Success:**
```json
{
  "type": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "User_9876543210",
    "email": "9876543210@phone.user",
    "phone": "9876543210",
    "role": "client"
  }
}
```

---

## 🐛 Troubleshooting

### Issue 1: OTP Not Received
**Possible Causes:**
- Invalid phone number
- MSG91 account balance low
- Template not approved
- Sender ID not registered

**Solution:**
- Check phone number format (10 digits)
- Verify MSG91 account balance
- Ensure Template ID is approved
- Confirm Sender ID is active

### Issue 2: "Failed to send OTP"
**Check:**
- Auth Key is correct
- Template ID is correct
- Server logs for detailed error

**Debug:**
```bash
# Check server logs
tail -f server/logs/app.log

# Or check console output
```

### Issue 3: "Invalid OTP"
**Possible Causes:**
- OTP expired (>5 minutes)
- Wrong OTP entered
- OTP already used

**Solution:**
- Request new OTP
- Check OTP carefully
- Ensure OTP is 6 digits

---

## 📊 MSG91 API Details

### Send OTP Endpoint:
```
POST https://control.msg91.com/api/v5/otp
```

### Parameters:
- `template_id`: Your template ID
- `mobile`: Phone number with country code (91XXXXXXXXXX)
- `authkey`: Your auth key
- `sender`: Sender ID (ASTRO9)
- `otp_expiry`: OTP validity in minutes (5)
- `otp_length`: Number of digits (6)

### Verify OTP Endpoint:
```
GET https://control.msg91.com/api/v5/otp/verify
```

### Parameters:
- `otp`: The OTP to verify
- `mobile`: Phone number with country code
- `authkey`: Your auth key

---

## 🎨 UI Components

### Phone Number Input:
```jsx
<input
  type="tel"
  value={phoneNumber}
  onChange={(e) => setPhoneNumber(e.target.value)}
  placeholder="Enter 10-digit mobile number"
  maxLength="10"
  disabled={otpSent}
/>
```

### OTP Input:
```jsx
<input
  type="text"
  value={otp}
  onChange={(e) => setOtp(e.target.value)}
  placeholder="Enter 6-digit OTP"
  maxLength="6"
  className="text-center text-lg tracking-widest"
/>
```

### Send OTP Button:
```jsx
<button
  onClick={handleSendOtp}
  disabled={isSendingOtp}
>
  {isSendingOtp ? 'Sending...' : 'Send OTP'}
</button>
```

### Verify OTP Button:
```jsx
<button
  onClick={handleVerifyOtp}
  disabled={isVerifying}
>
  {isVerifying ? 'Verifying...' : 'Verify OTP'}
</button>
```

---

## 🔄 Error Handling

### Client-Side:
```javascript
try {
  const response = await axios.post('/api/otp/send', { phoneNumber });
  if (response.data.type === 'success') {
    setOtpSent(true);
    alert('OTP sent successfully!');
  }
} catch (error) {
  alert(`Error: ${error.response?.data?.msg || error.message}`);
}
```

### Server-Side:
```javascript
try {
  const response = await axios.post(url, null, { params });
  if (response.data.type === 'success') {
    res.json({ type: 'success', message: 'OTP sent' });
  }
} catch (error) {
  console.error('MSG91 Error:', error.response?.data);
  res.status(500).json({
    msg: 'Error sending OTP',
    error: error.message
  });
}
```

---

## 📈 Success Metrics

### What to Monitor:
1. **OTP Delivery Rate** - % of OTPs successfully sent
2. **OTP Verification Rate** - % of OTPs successfully verified
3. **Average Delivery Time** - Time taken for OTP to reach user
4. **Failed Attempts** - Number of failed OTP verifications
5. **User Conversion** - % of users who complete OTP login

### Expected Performance:
- **Delivery Rate:** >95%
- **Delivery Time:** <30 seconds
- **Verification Rate:** >80%
- **Error Rate:** <5%

---

## 🚀 Production Checklist

Before going live:
- [ ] MSG91 account has sufficient balance
- [ ] Template ID is approved by MSG91
- [ ] Sender ID is registered and active
- [ ] Auth Key is correct in .env
- [ ] Test OTP flow end-to-end
- [ ] Error handling is in place
- [ ] Loading states work correctly
- [ ] User feedback messages are clear
- [ ] Auto-user creation works
- [ ] JWT token generation works
- [ ] Wallet creation works for new users

---

## 📝 Notes

### Auto User Creation:
When a user logs in with OTP for the first time:
1. New user created with phone number
2. Default name: `User_XXXXXXXXXX`
3. Temporary email: `XXXXXXXXXX@phone.user`
4. Role: `client`
5. Wallet created with ₹0 balance
6. JWT token generated
7. User can update profile later

### Phone Number Format:
- Input: `9876543210` (10 digits)
- Stored: `9876543210` (without country code)
- Sent to MSG91: `919876543210` (with country code)

### OTP Format:
- Length: 6 digits
- Type: Numeric only
- Expiry: 5 minutes
- One-time use

---

## ✨ Features

✅ Phone number validation
✅ OTP sending with MSG91
✅ OTP verification
✅ Auto user creation
✅ JWT authentication
✅ Wallet creation
✅ Loading states
✅ Error handling
✅ User feedback
✅ Resend OTP option
✅ Clean UI/UX

---

**MSG91 OTP Login is now fully integrated and ready to use!** 🎉
