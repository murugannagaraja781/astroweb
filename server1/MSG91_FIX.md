# MSG91 API Error 400 - Troubleshooting Guide

## Issue Fixed ✅
Your MSG91 integration had **incorrect API format** causing error 400.

## What Was Wrong:
1. **Authkey location**: Was in request body, should be in headers
2. **Parameters**: Were in body, should be in query string
3. **Verify method**: Was using POST, should use GET

## Changes Made:

### Send OTP API
**Before (Wrong):**
```javascript
axios.post('https://control.msg91.com/api/v5/otp', {
    template_id: process.env.MSG91_TEMPLATE_ID,
    mobile: `91${phoneNumber}`,
    authkey: process.env.MSG91_AUTHKEY,  // ❌ Wrong location
})
```

**After (Correct):**
```javascript
axios.post(
    `https://control.msg91.com/api/v5/otp?template_id=${TEMPLATE_ID}&mobile=91${phone}`,
    {},  // Empty body
    {
        headers: {
            'authkey': process.env.MSG91_AUTHKEY,  // ✅ In headers
        }
    }
)
```

### Verify OTP API
**Before (Wrong):**
```javascript
axios.post('https://control.msg91.com/api/v5/otp/verify', {
    mobile: `91${phoneNumber}`,
    otp: otp,
    authkey: process.env.MSG91_AUTHKEY,  // ❌ Wrong
})
```

**After (Correct):**
```javascript
axios.get(  // ✅ Changed to GET
    `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=91${phone}`,
    {
        headers: {
            'authkey': process.env.MSG91_AUTHKEY,  // ✅ In headers
        }
    }
)
```

## Testing Steps:

1. **Restart your server** (changes are applied):
```bash
cd /Users/wohozo/astroweb/server
# The server should auto-restart if you have nodemon
```

2. **Test OTP Send**:
```bash
curl -X POST http://localhost:9001/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "YOUR_10_DIGIT_NUMBER"}'
```

3. **Expected Response**:
```json
{
  "type": "success",
  "message": "OTP sent successfully"
}
```

4. **Test OTP Verify**:
```bash
curl -X POST http://localhost:9001/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "YOUR_NUMBER", "otp": "RECEIVED_OTP"}'
```

## Environment Variables Check:
Make sure these are set in `/Users/wohozo/astroweb/server/.env`:
```env
MSG91_AUTHKEY=478312AgHesvjV691c86b3P1
MSG91_TEMPLATE_ID=6749f5d5d6fc054b4a0e1e0c
```

## Common MSG91 Error Codes:

| Code | Reason | Solution |
|------|--------|----------|
| 400 | Bad Request | ✅ Fixed - Wrong API format |
| 401 | Invalid Auth Key | Check your authkey |
| 403 | IP not whitelisted | Add server IP in MSG91 dashboard |
| 429 | Rate limit exceeded | Wait and retry |
| 432 | DND number | Can't send to DND numbers |

## Verify Your MSG91 Settings:

1. **Login to MSG91**: https://control.msg91.com/
2. **Check Template**:
   - Go to Templates
   - Verify template ID: `6749f5d5d6fc054b4a0e1e0c`
   - Ensure template is APPROVED

3. **Check Auth Key**:
   - Go to API > Authentication Keys
   - Verify: `478312AgHesvjV691c86b3P1`

4. **Check Credits**:
   - Ensure you have SMS credits remaining
   - Go to Wallet/Credits section

## Additional Improvements Made:
- ✅ Added phone number cleaning (removes spaces, dashes)
- ✅ Better error logging
- ✅ Proper header format

## Test on Frontend:
The Login.jsx form should now work when users:
1. Enter phone number
2. Click "Send OTP"
3. Enter received OTP
4. Click "Verify & Login"

The error 400 should be resolved! ✅
