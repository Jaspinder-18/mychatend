# Deployment Guide for Render.com

Since local Wi-Fi connection is often blocked by router security or firewalls, deploying to the cloud (Render) is the best way to make your app work everywhere.

## Step 1: Push All Changes to GitHub
Run these commands in your terminal to make sure your latest code (with the Render config) is online:
```powershell
git add .
git commit -m "Add Render deployment config"
git push origin main
```

## Step 2: Create a Web Service on Render
1. Go to [Render.com](https://dashboard.render.com/) and Log In with GitHub.
2. Click **New +** and select **Web Service**.
3. Search for your repository (`mychat`) and click **Connect**.
4. Set the following settings:
   - **Name**: `simple-connect-backend`
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Scroll down to **Environment Variables** and click **Add Environment Variable**:
   - `MONGO_URI`: (Paste your MongoDB link here)
   - `JWT_SECRET`: `supersecretkey_simple_connect_2024`
6. Click **Create Web Service**.

## Step 3: Update Frontend URL
1. Wait for Render to finish (it will show a link like `https://simple-connect-backend.onrender.com`).
2. Copy that link.
3. Open `frontend/src/config.js` on your PC.
4. Replace the `API_BASE_URL` with your new Render link:
   ```javascript
   export const API_BASE_URL = "https://simple-connect-backend.onrender.com";
   ```

## Step 4: Rebuild APK
1. After updating `config.js`, commit and push to GitHub again.
2. Your GitHub Action will automatically build a NEW APK.
3. Download and install the new APK on your phone.
4. It will now work everywhere, even on mobile data!
