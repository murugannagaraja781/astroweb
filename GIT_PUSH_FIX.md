# Git Push Fix Guide

## Problem
Git push failing with permission error:
```
Permission to murugannagaraja781/astroweb.git denied to nagarajanewlife
```

## Quick Fixes

### Option 1: Use GitHub Desktop (Easiest)
1. Open **GitHub Desktop**
2. It will show the commit: "Deploy: Trigger deployment with admin/astrologer bypass fixes"
3. Click **"Push origin"** button
4. Done! Render will auto-deploy

### Option 2: Use Personal Access Token
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic) with `repo` scope
3. Copy the token
4. Run:
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/murugannagaraja781/astroweb.git
git push origin main
```

### Option 3: Use SSH Instead of HTTPS
1. Set up SSH key if not already done
2. Change remote to SSH:
```bash
git remote set-url origin git@github.com:murugannagaraja781/astroweb.git
git push origin main
```

### Option 4: Use VS Code
1. Open VS Code
2. Go to Source Control panel (Ctrl/Cmd + Shift + G)
3. Click the **"..."** menu → Push
4. VS Code will handle authentication

## After Successful Push

Render will automatically:
1. Detect the new commit
2. Pull the latest code
3. Build and deploy (takes 2-5 minutes)
4. Your admin bypass will be live!

## Verify Deployment

After 2-5 minutes, test:
```bash
curl -X POST https://astroweb-y0i6.onrender.com/api/call/initiate \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_ADMIN_JWT" \
  -d '{"receiverId":"ASTROLOGER_ID","type":"video"}'
```

Expected: `{"callId":"...","msg":"Call initiated (Admin)"}`
