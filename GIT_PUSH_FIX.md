# Git Push Permission Error - Fix Guide

## Error
```
remote: Permission to murugannagaraja781/astroweb.git denied to nagarajanewlife.
fatal: unable to access 'https://github.com/murugannagaraja781/astroweb.git/': The requested URL returned error: 403
```

## Problem
Git is using the wrong GitHub account (`nagarajanewlife`) instead of `murugannagaraja781`.

---

## Solution Options

### Option 1: Update Git Credentials (Recommended)

```bash
# 1. Update Git config to use correct username
cd /Users/wohozo/astroweb
git config user.name "murugannagaraja781"
git config user.email "your-email@example.com"

# 2. Update remote URL to use SSH (more secure)
git remote set-url origin git@github.com:murugannagaraja781/astroweb.git

# 3. Push
git push origin main
```

### Option 2: Use Personal Access Token

```bash
# 1. Create Personal Access Token on GitHub
# Go to: GitHub → Settings → Developer settings → Personal access tokens → Generate new token
# Select scopes: repo (all)

# 2. Push with token
git push https://YOUR_TOKEN@github.com/murugannagaraja781/astroweb.git main
```

### Option 3: Fix Credential Helper

```bash
# 1. Clear stored credentials
git credential-osxkeychain erase
host=github.com
protocol=https
[Press Enter twice]

# 2. Push (will prompt for credentials)
git push origin main
# Enter username: murugannagaraja781
# Enter password: YOUR_PERSONAL_ACCESS_TOKEN
```

---

## Quick Fix (Easiest)

```bash
cd /Users/wohozo/astroweb

# Update remote to SSH
git remote set-url origin git@github.com:murugannagaraja781/astroweb.git

# Push
git push origin main
```

**Note**: This requires SSH key to be set up on GitHub. If not set up, use Option 2 (Personal Access Token).

---

## After Fixing

Once push succeeds:
1. ✅ GitHub will receive the changes
2. ✅ Vercel will auto-deploy (if connected)
3. ✅ Wait 2-3 minutes for deployment
4. ✅ Visit https://astroweb-beryl.vercel.app
5. ✅ Login as client and see new dashboard!

---

## Alternative: Manual Deploy on Vercel

If Git push is difficult:

1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments"
4. Click "Redeploy" on latest deployment
5. Or: Upload files manually

---

*Choose the option that works best for your setup!*
