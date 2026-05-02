# Railway Deployment Guide for Ethara

## Prerequisites

1. **GitHub Account** - Your code must be on GitHub
2. **Railway Account** - Sign up at https://railway.app
3. **MongoDB Atlas** - Already configured (you have MONGO_URI)

## Deployment Steps

### Step 1: Push Code to GitHub

```bash
cd /Users/anshpateriya/Documents/android_Studio/ethara

# Initialize git (if not already done)
git init
git add .
git commit -m "Add Railway deployment configuration"
git branch -M main

# Add your GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/ethara.git
git push -u origin main
```

### Step 2: Create Services on Railway

1. Go to https://railway.app/dashboard
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Select your `ethara` repository

#### Service 1: Backend API

1. Click **"New Service"** → **"GitHub Repo"** (or use the same repo)
2. Configure:
   - **Name**: `ethara-backend`
   - **Root Directory**: `backend/`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add environment variables:
   - `PORT`: `3000`
   - `MONGO_URI`: Paste from your `.env` file
   - `JWT_SECRET`: Paste from your `.env` file (or generate a new one)
4. Deploy

#### Service 2: Frontend Static Site

Railway doesn't natively support static sites, so we serve the frontend via the backend.

**Option A (Recommended):** Frontend served from backend
- No additional service needed - modify backend to serve frontend build
- The `frontend-server.js` is already prepared

**Option B:** Separate frontend service
1. Click **"New Service"** → **"GitHub Repo"**
2. Configure:
   - **Name**: `ethara-frontend`
   - **Root Directory**: `frontend/`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node ../frontend-server.js`

### Step 3: Configure API URL

Once services are deployed, update the frontend environment variable:

1. Go to **ethara-frontend** service settings
2. Add environment variable:
   - `VITE_API_URL`: `https://ethara-backend.up.railway.app` (replace with your backend service URL from Railway)

### Step 4: Verify Deployment

- **Backend**: `https://ethara-backend.up.railway.app/api/health` → should return `{ status: 'ok', ... }`
- **Frontend**: `https://ethara-frontend.up.railway.app` → should load your React app

## Environment Variables Summary

| Variable | Value | Service |
|----------|-------|---------|
| `MONGO_URI` | Your MongoDB connection string | Backend |
| `JWT_SECRET` | Your JWT secret key | Backend |
| `PORT` | `3000` | Backend |
| `VITE_API_URL` | Backend service URL | Frontend |

## Troubleshooting

- **Build fails**: Check that `package.json` exists in `backend/` and `frontend/` directories
- **API not accessible**: Verify `MONGO_URI` is correct in backend environment variables
- **Frontend can't reach API**: Check `VITE_API_URL` matches the deployed backend URL
- **404 on React routes**: The SPA rewrite is configured in `frontend/vite.config.js`

## Custom Domain

To add a custom domain:
1. Go to service settings
2. Click **"Domains"**
3. Add your domain and follow DNS instructions

---

For more help, see https://docs.railway.app
