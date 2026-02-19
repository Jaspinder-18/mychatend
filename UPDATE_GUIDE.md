# App Update System Guide

This project now includes a simple remote update system for the mobile app (APK). This allows you to notify users of a new version without them having to manually check GitHub.

## How it works
1. **Frontend**: Has a hardcoded `CURRENT_VERSION` in `LoginPage.jsx`.
2. **Backend**: Serves the latest version and a download link via `/api/app/version`.
3. **Check**: Every time a user opens the Login window, the app checks if the backend version is different from the local version.
4. **Trigger**: If a newer version is found, a yellow **"UPDATE AVAILABLE"** button appears at the top right.

## How to push a new update
1. **Build the NEW APK**:
   - Make your changes in the code.
   - Run the Capacitor/Android build to generate the new `.apk` file.
2. **Host the APK**:
   - Upload the new APK file to a public download link (e.g., Google Drive with "Anyone with link" access, or your web server).
3. **Notify the Backend**:
   - Go to your live backend server (e.g., Render, VPS).
   - Update the Environment Variables (secrets):
     - `APP_VERSION`: Increase this number (e.g., from `1.0.0` to `1.0.1`).
     - `APK_DOWNLOAD_URL`: Paste the direct link to the new APK file.
4. **Done**:
   - Users will immediately see the update button on their login screen. When they click it, the new APK will download to their phone.

---
**Note:** Remember to also update `CURRENT_VERSION` in `LoginPage.jsx` *before* building the new APK, so that the new app knows it is the latest version.
