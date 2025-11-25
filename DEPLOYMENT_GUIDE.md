# AstroWeb Deployment Guide

## 🚀 Quick Deployment to Render.com

### Prerequisites
- GitHub account
- Render.com account
- MongoDB Atlas account (or MongoDB URI)

---

## Step 1: Prepare Your Code

### 1.1 Ensure .gitignore is correct
```
# Client
client/node_modules/
client/dist/
client/.env

# Server
server/node_modules/
server/.env

# System
.DS_Store
```

### 1.2 Commit all changes
```bash
git add .
git commit -m "Production ready: All features implemented"
git push origin main
```

---

## Step 2: Deploy Backend (Server)

### 2.1 Create Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `astroweb-server`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Plan**: Free (or paid for better performance)

### 2.2 Add Environment Variables
In Render dashboard, add these:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/astroweb
JWT_SECRET=your_super_secret_key_here_min_32_chars
MSG91_AUTHKEY=your_msg91_authkey
MSG91_TEMPLATE_ID=your_template_id
PORT=5000
```

### 2.3 Deploy
- Click "Create Web Service"
- Wait for deployment (5-10 minutes)
- Note your backend URL: `https://astroweb-server.onrender.com`

---

## Step 3: Deploy Frontend (Client)

### 3.1 Update Client Environment
Edit `client/.env`:
```
VITE_API_URL=https://astroweb-server.onrender.com
VITE_MSG91_AUTHKEY=your_authkey
VITE_MSG91_WIDGET_ID=your_widget_id
```

### 3.2 Create Static Site on Render
1. Click "New +" → "Static Site"
2. Connect same GitHub repository
3. Configure:
   - **Name**: `astroweb-client`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 3.3 Add Environment Variables
```
VITE_API_URL=https://astroweb-server.onrender.com
VITE_MSG91_AUTHKEY=your_authkey
VITE_MSG91_WIDGET_ID=your_widget_id
```

### 3.4 Deploy
- Click "Create Static Site"
- Wait for deployment
- Your app will be live at: `https://astroweb-client.onrender.com`

---

## Step 4: Verify Deployment

### 4.1 Test Backend
```bash
curl https://astroweb-server.onrender.com/api/public/astrologers
```
Should return JSON array of astrologers.

### 4.2 Test Frontend
1. Visit `https://astroweb-client.onrender.com`
2. Register a new account
3. Check if ₹20 welcome bonus is added
4. Browse astrologers
5. Test call/chat (if you have test astrologer)

---

## Step 5: Post-Deployment Configuration

### 5.1 Update CORS (if needed)
In `server/index.js`, update CORS origin:
```javascript
const io = new Server(server, {
  cors: {
    origin: "https://astroweb-client.onrender.com",
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: "https://astroweb-client.onrender.com"
}));
```

### 5.2 Update Socket URL in Client
In client files using socket.io, update:
```javascript
// Old
const socket = io('https://astroweb-y0i6.onrender.com');

// New
const socket = io(import.meta.env.VITE_API_URL);
```

Files to update:
- `client/src/pages/Chat.jsx`
- `client/src/pages/VideoCall.jsx`
- `client/src/pages/AstrologerDashboard.jsx`

---

## 🔧 Troubleshooting

### Backend Issues

**Problem**: 404 errors on API calls
- **Solution**: Check if backend is deployed and running
- **Check**: Visit `https://your-backend-url.onrender.com`

**Problem**: Database connection failed
- **Solution**: Verify MONGO_URI in environment variables
- **Check**: Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

**Problem**: Socket.io not connecting
- **Solution**: Check CORS settings
- **Verify**: Socket URL matches backend URL

### Frontend Issues

**Problem**: API calls failing
- **Solution**: Check VITE_API_URL in environment variables
- **Verify**: URL doesn't have trailing slash

**Problem**: Build fails
- **Solution**: Check for TypeScript errors or missing dependencies
- **Run locally**: `npm run build` to see errors

---

## 📊 Monitoring

### Render Dashboard
- View logs in real-time
- Monitor CPU/Memory usage
- Check deployment history

### Health Checks
Create `server/routes/healthRoutes.js`:
```javascript
const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

module.exports = router;
```

Add to `server/index.js`:
```javascript
app.use('/api', require('./routes/healthRoutes'));
```

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] MongoDB credentials are secure
- [ ] CORS is configured for production domain
- [ ] Environment variables are set correctly
- [ ] .env files are in .gitignore
- [ ] API rate limiting (optional, recommended)

---

## 💰 Cost Estimation

### Free Tier (Render)
- **Backend**: Free (sleeps after 15 min inactivity)
- **Frontend**: Free
- **Database**: MongoDB Atlas Free Tier (512MB)
- **Total**: ₹0/month

### Paid Tier (Recommended for Production)
- **Backend**: $7/month (always on)
- **Frontend**: Free
- **Database**: $9/month (2GB)
- **Total**: ~₹1,200/month

---

## 🎯 Next Steps After Deployment

1. **Test All Features**
   - Registration with ₹20 bonus
   - Login/Logout
   - Browse astrologers
   - Call/Chat functionality
   - Admin dashboard
   - Wallet operations

2. **Add Custom Domain** (Optional)
   - Purchase domain
   - Configure DNS in Render
   - Update environment variables

3. **Set Up Analytics**
   - Google Analytics
   - User behavior tracking
   - Error monitoring (Sentry)

4. **Configure Backups**
   - MongoDB automated backups
   - Code repository backups

---

## 📞 Support

If you encounter issues:
1. Check Render logs
2. Verify environment variables
3. Test API endpoints directly
4. Check MongoDB connection
5. Review CORS settings

---

*Deployment typically takes 15-20 minutes total.*
