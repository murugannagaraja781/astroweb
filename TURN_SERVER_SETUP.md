# TURN Server Setup Guide

## Why You Need TURN Servers

STUN servers alone are NOT enough for production WebRTC applications. Here's why:

- **STUN** = Helps discover your public IP address
- **TURN** = Relays media when direct connection fails (firewalls, NAT, corporate networks)

**Without TURN:** ~20-30% of calls will fail
**With TURN:** ~99% of calls will succeed

---

## Option 1: Free TURN Service (Metered.ca) - RECOMMENDED FOR TESTING

### Step 1: Get Free Credentials
1. Visit: https://www.metered.ca/tools/openrelay/
2. You'll see free TURN server credentials displayed on the page
3. No signup required!

### Step 2: Add to .env
```env
VITE_TURN_URL=turn:a.relay.metered.ca:443?transport=tcp
VITE_TURN_USERNAME=openrelayproject
VITE_TURN_CREDENTIAL=openrelayproject
```

### Step 3: Restart Your App
```bash
cd client
npm run dev
```

### Limitations:
- Shared with other users (may be slow)
- Not guaranteed uptime
- Limited bandwidth
- OK for testing, NOT for production

---

## Option 2: Twilio TURN (Best for Production)

### Step 1: Sign Up
1. Create account: https://www.twilio.com/console
2. Get your Account SID and Auth Token

### Step 2: Generate TURN Credentials
Twilio uses temporary credentials. You need to generate them server-side:

```javascript
// server/routes/turn.js
const twilio = require('twilio');

router.get('/api/turn-credentials', async (req, res) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    const client = twilio(accountSid, authToken);

    try {
        const token = await client.tokens.create();
        res.json({
            iceServers: token.iceServers
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
```

### Step 3: Fetch Credentials in Client
```javascript
// client/src/config.js
export const getICEServers = async () => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/turn-credentials`);
        const data = await res.json();
        return data.iceServers;
    } catch (err) {
        console.error("Failed to get TURN credentials:", err);
        // Fallback to STUN only
        return [
            { urls: "stun:stun.l.google.com:19302" }
        ];
    }
};
```

### Pricing:
- Free tier: $0 for first 10GB
- After: $0.40 per GB
- Typical call: ~10-50 MB per hour

---

## Option 3: Self-Hosted Coturn (Cheapest for High Volume)

### Step 1: Install Coturn on Ubuntu Server
```bash
sudo apt update
sudo apt install coturn
```

### Step 2: Configure Coturn
Edit `/etc/turnserver.conf`:
```conf
# Basic settings
listening-port=3478
tls-listening-port=5349
listening-ip=YOUR_SERVER_IP
external-ip=YOUR_SERVER_IP

# Authentication
realm=yourdomain.com
user=username:password

# Security
fingerprint
lt-cred-mech

# Logging
log-file=/var/log/turnserver.log
verbose
```

### Step 3: Start Coturn
```bash
sudo systemctl enable coturn
sudo systemctl start coturn
```

### Step 4: Open Firewall Ports
```bash
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
sudo ufw allow 49152:65535/udp  # Media ports
```

### Step 5: Add to .env
```env
VITE_TURN_URL=turn:your-server-ip:3478
VITE_TURN_USERNAME=username
VITE_TURN_CREDENTIAL=password
```

### Cost:
- VPS: $5-10/month (DigitalOcean, Linode, etc.)
- Bandwidth: Usually included
- Best for: 100+ concurrent calls

---

## Option 4: Xirsys (Good Balance)

### Step 1: Sign Up
1. Create account: https://xirsys.com/
2. Free tier: 500 MB/month

### Step 2: Get Credentials
1. Go to Dashboard → Channels
2. Create a new channel
3. Copy the credentials

### Step 3: Add to .env
```env
VITE_TURN_URL=turn:your-channel.xirsys.com:443?transport=tcp
VITE_TURN_USERNAME=your-username
VITE_TURN_CREDENTIAL=your-password
```

### Pricing:
- Free: 500 MB/month
- Starter: $10/month for 10 GB
- Pro: $50/month for 100 GB

---

## Testing Your TURN Server

### Method 1: Browser Console Test
```javascript
const pc = new RTCPeerConnection({
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        {
            urls: "turn:a.relay.metered.ca:443?transport=tcp",
            username: "openrelayproject",
            credential: "openrelayproject"
        }
    ]
});

pc.onicecandidate = (event) => {
    if (event.candidate) {
        console.log("Candidate type:", event.candidate.type);
        // Should see: "host", "srflx", and "relay"
        // "relay" means TURN is working!
    }
};

pc.createOffer().then(offer => pc.setLocalDescription(offer));
```

### Method 2: Online Trickle ICE Test
1. Visit: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
2. Add your TURN server credentials
3. Click "Gather candidates"
4. Look for `typ relay` in results - that means TURN works!

### Method 3: Check Your App Logs
Look for these in browser console:
```
[VideoCall] ICE Candidate type: relay
```

If you only see `host` and `srflx`, TURN is NOT working.

---

## Troubleshooting

### Problem: No "relay" candidates
**Causes:**
- Wrong TURN credentials
- TURN server down
- Firewall blocking TURN ports
- Wrong TURN URL format

**Fix:**
1. Test credentials with trickle-ice tool
2. Check TURN server status
3. Verify firewall rules
4. Check URL format (should include `?transport=tcp`)

### Problem: Calls work locally but fail remotely
**Cause:** No TURN server configured

**Fix:** Add TURN server (see options above)

### Problem: High latency/poor quality
**Causes:**
- TURN server too far away
- Overloaded TURN server
- Insufficient bandwidth

**Fix:**
1. Use TURN server closer to users
2. Upgrade to paid TURN service
3. Use multiple TURN servers (fallback)

---

## Recommended Setup by Scale

### Small App (<100 users):
- Use Metered.ca free tier for testing
- Upgrade to Xirsys Starter ($10/month) for production

### Medium App (100-1000 users):
- Use Twilio TURN (pay-as-you-go)
- Or self-host Coturn on $10/month VPS

### Large App (1000+ users):
- Self-host Coturn on multiple servers (geo-distributed)
- Use Cloudflare for DDoS protection
- Monitor with Prometheus/Grafana

---

## Quick Start (Copy-Paste)

For immediate testing, add this to `client/.env`:

```env
# Free TURN server (testing only)
VITE_TURN_URL=turn:a.relay.metered.ca:443?transport=tcp
VITE_TURN_USERNAME=openrelayproject
VITE_TURN_CREDENTIAL=openrelayproject
```

Then restart your app:
```bash
cd client
npm run dev
```

Your calls should now work even behind firewalls! 🎉
