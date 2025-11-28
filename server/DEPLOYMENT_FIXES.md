# Server Deployment Issues - Solutions

## Issues Identified

### 1. ✅ Server Starting Successfully
- MongoDB connected
- Socket.IO ready
- All services active
- **No action needed**

### 2. ⚠️ Container Keeps Restarting (SIGTERM)

**Symptoms**:
```
Stopping Container
npm error signal SIGTERM
```

**Possible Causes**:
1. **Health check failing** - Container orchestrator thinks app is unhealthy
2. **Memory limit exceeded** - Container running out of memory
3. **Port conflict** - Port 8080 already in use
4. **Deployment platform issue** - Render/Heroku/etc. restarting

**Solutions**:

#### A. Add Health Check Endpoint

Add to `server/index.js`:
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

#### B. Check Memory Usage

Add memory monitoring:
```javascript
// Log memory usage
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory:', Math.round(used.heapUsed / 1024 / 1024), 'MB');
}, 60000); // Every minute
```

#### C. Graceful Shutdown Handler

Add to `server/index.js`:
```javascript
// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
```

### 3. ⚠️ Environment Variables Not Loading

**Issue**: `[dotenv@17.2.3] injecting env (0)`

**Cause**: In production/Docker, .env file might not exist or not be copied

**Solutions**:

#### Option 1: Use Platform Environment Variables (Recommended)

On Render/Heroku/etc., set environment variables in the platform dashboard:
```
PORT=8080
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret_key_here
AGORA_APP_ID=a3c27ce672804538b4e78baeaf0687b2
MSG91_AUTHKEY=478312AgHesvjV691c86b3P1
AGORA_APP_CERTIFICATE=d6d14f52b1ef4f88befc8e06ddd1a974
MSG91_TEMPLATE_ID=6749f5d5d6fc054b4a0e1e0c
PHONEPE_AUTH_KEY=ba824dad-ed66-4cec-9d76-4c1e0b118eb1
```

#### Option 2: Ensure .env is Copied to Docker

Update `Dockerfile` or `.dockerignore`:
```dockerfile
# Dockerfile
COPY .env .env
```

Or remove `.env` from `.dockerignore` if present.

#### Option 3: Use Default Values

Update `server/index.js`:
```javascript
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/astroweb';
```

### 4. ⚠️ npm Warning: production

**Warning**: `npm warn config production Use --omit=dev instead`

**Fix**: Update `package.json` scripts:

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "install:prod": "npm install --omit=dev"
  }
}
```

Or in Dockerfile:
```dockerfile
RUN npm install --omit=dev
```

---

## Quick Fix Implementation

### Step 1: Add Health Check and Graceful Shutdown

```javascript
// Add to server/index.js after routes

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('✅ Shutdown complete');
      process.exit(0);
    });
  });
});
```

### Step 2: Set Environment Variables on Platform

**Render.com**:
1. Go to Dashboard → Your Service → Environment
2. Add all variables from `.env` file
3. Save and redeploy

**Heroku**:
```bash
heroku config:set PORT=8080
heroku config:set MONGO_URI="mongodb+srv://..."
# ... etc
```

**Docker Compose**:
```yaml
environment:
  - PORT=8080
  - MONGO_URI=mongodb+srv://...
```

### Step 3: Update Dockerfile (if using Docker)

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["npm", "start"]
```

---

## Verification

After implementing fixes:

1. **Check logs** - Should see:
   ```
   ✅ MongoDB Connected
   🚀 Server running on port 8080
   ```

2. **Test health endpoint**:
   ```bash
   curl https://your-app.onrender.com/health
   # Should return: {"status":"ok","uptime":123.45}
   ```

3. **Monitor for SIGTERM**:
   - If still occurring, check platform logs for memory/CPU limits
   - Increase container resources if needed

---

## Current Status

✅ **Server is working** - All services start successfully
⚠️ **Container restarts** - Likely platform health check or resource issue
⚠️ **Env vars** - Set on platform, not from .env file (normal in production)
⚠️ **Swisseph** - Using mock data (acceptable)

**Priority**: Add health check endpoint and graceful shutdown handler
