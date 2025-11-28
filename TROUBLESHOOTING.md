# 🛠️ AstroWeb Troubleshooting Procedure

Follow this step-by-step guide to diagnose and fix issues with the AstroWeb deployment.

## 1. 🌍 Server Deployment Check (Railway)

**Goal**: Verify the server is running and accessible.

1.  **Check Railway Logs**:
    *   Go to your Railway Dashboard.
    *   Click on the `server` service.
    *   Look at the "Deploy Logs".
    *   ✅ **Success**: You should see `Server running on port 8080` and `Mongo Connected`.
    *   ❌ **Failure**: If you see `Application failed to respond` or `Crashed`, check the error message.

2.  **Test Health Endpoint**:
    *   Open your browser or Postman.
    *   Visit: `https://astroweb-production.up.railway.app/health`
    *   ✅ **Success**: Returns `{"status":"ok", ...}`
    *   ❌ **Failure**: 404 or Connection Refused means the server is not reachable.

## 2. 🔗 CORS & Client Connection

**Goal**: Ensure the Frontend (Vercel) can talk to the Backend (Railway).

1.  **Verify Environment Variables**:
    *   **Frontend**: Ensure `VITE_API_URL` is set to `https://astroweb-production.up.railway.app` (no trailing slash).
    *   **Backend**: Ensure `CLIENT_URL` in Railway variables matches your frontend URL exactly (e.g., `https://astroweb-beryl.vercel.app`).

2.  **Check Browser Console**:
    *   Open your app in Chrome.
    *   Right-click -> Inspect -> **Console**.
    *   ❌ **CORS Error**: `Access to XMLHttpRequest... has been blocked by CORS policy`.
        *   *Fix*: Update `CLIENT_URL` in `server/index.js` or Railway env vars to match your frontend URL.

## 3. 📡 Socket.IO Connection

**Goal**: Verify real-time chat/call features.

1.  **Check Network Tab**:
    *   Open Developer Tools (F12) -> **Network** tab.
    *   Filter by `WS` (WebSockets).
    *   Look for a request named `socket.io/?EIO=...`.
    *   ✅ **Success**: Status `101 Switching Protocols` (Green).
    *   ❌ **Failure**: Red status or pending forever.

2.  **Common Socket Issues**:
    *   **Transport Error**: Ensure `transports: ["websocket", "polling"]` is set in both client and server.
    *   **400 Bad Request**: Often a version mismatch or cookie/CORS issue.

## 4. 🐛 Debugging Specific Features

### Chat "Waiting for Astrologer..."
*   **Symptom**: Client sends request, but nothing happens.
*   **Fix**: We implemented a "Force Join" fix.
    *   Ensure Client emits `join_chat` immediately after request.
    *   Ensure Server logs `[DEBUG] Astrologer socket ... force-joined room`.

### Video Call 404
*   **Symptom**: `POST /api/call/initiate` returns 404.
*   **Cause**: Server not updated or route missing.
*   **Check**: Visit `/health` to confirm you are hitting the correct server instance.

## 5. 📝 Quick Fix Checklist

If things are broken, try these in order:

1.  [ ] **Redeploy Server**: Sometimes a fresh restart fixes stuck processes.
2.  [ ] **Check Env Vars**: specificially `CLIENT_URL` and `MONGO_URI`.
3.  [ ] **Bind to 0.0.0.0**: In `server/index.js`, ensure:
    ```javascript
    server.listen(PORT, "0.0.0.0", () => { ... });
    ```
    *(Note: Your current code uses `server.listen(PORT)`, which is usually fine, but explicit `0.0.0.0` is safer for Railway).*

---

**Still stuck?** Share the **Server Logs** from Railway and the **Browser Console Logs** from Chrome.
