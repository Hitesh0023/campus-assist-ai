# CampusPro - Production Deployment & Play Store Guide

Complete guide for deploying CampusPro as a PWA + TWA Android application to Google Play Store.

## Table of Contents

1. [PWA Setup](#pwa-setup)
2. [Android TWA Setup](#android-twa-setup)
3. [Google Play Console Setup](#google-play-console-setup)
4. [Deployment Process](#deployment-process)
5. [Troubleshooting](#troubleshooting)
6. [Production Best Practices](#production-best-practices)

---

## PWA Setup

### 1. Environment Configuration

**Production URLs Required:**
- Frontend: `https://campuspro.vercel.app` (or your domain)
- Backend: `https://campuspro-backend.onrender.com` (or your API domain)

**Update .env.production:**
```bash
# client/.env.production
VITE_API_BASE_URL=https://campuspro-backend.onrender.com
```

### 2. Build PWA

```bash
# Install dependencies
cd client
npm install

# Build with PWA support
npm run build:pwa

# Output: client/dist/
```

### 3. Deploy Frontend

**Option A: Deploy to Vercel**
```bash
# Using Vercel CLI
npm i -g vercel
vercel deploy --prod

# Or via Git:
# Connect GitHub repo to Vercel → auto-deploys on push to main
```

**Option B: Deploy to Netlify**
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

**Option C: Deploy to Firebase**
```bash
npm i -g firebase-tools
firebase login
firebase deploy
```

### 4. Verify PWA Installation

1. Open app in browser: `https://campuspro.vercel.app`
2. Check manifest: DevTools → Application → Manifest
3. Service Worker should be registered in DevTools → Application → Service Workers
4. Test install prompt on mobile
5. Verify offline functionality

---

## Android TWA Setup

### Prerequisites

**Required Tools:**
- Node.js (v18+)
- Java Development Kit (JDK 11+)
- Android SDK (for testing)
- Git

**Installation on Windows:**
```powershell
# Using Chocolatey
choco install nodejs java-openjdk
```

**Installation on macOS:**
```bash
# Using Homebrew
brew install node java
```

**Installation on Linux:**
```bash
# Ubuntu/Debian
sudo apt install nodejs openjdk-11-jdk
```

### Step-by-Step Android Build

#### Step 1: Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

#### Step 2: Build Frontend

```bash
cd client
npm install
npm run build:pwa
cd ..
```

#### Step 3: Create Keystore (One-time Setup)

```bash
# Create keystore directory
mkdir keystore
cd keystore

# Generate signing key (valid for 10,000 days)
keytool -genkey -v -keystore campuspro-release-key.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias campuspro-release

# Save the password you enter - YOU WILL NEED THIS FOR PLAY STORE
```

**Keystore Generation Interactive Prompt:**
```
Enter keystore password: [your-secure-password]
Re-enter new password: [your-secure-password]
What is your first and last name?: Hitesh
What is the name of your organizational unit?: Engineering
What is the name of your organization?: CampusPro
What is the name of your City or Locality?: [Your City]
What is the name of your State or Province?: [Your State]
What is the two-letter country code for this unit?: IN
Is CN=[name], OU=Engineering, O=CampusPro correct? yes
```

**IMPORTANT: Backup your keystore safely!**
```bash
# Keep multiple copies in secure locations
cp campuspro-release-key.keystore ~/Dropbox/backups/
```

#### Step 4: Initialize Bubblewrap Project

**Option A: Using Configuration File (Recommended)**

```bash
# Copy provided bubblewrap.json to root
cp bubblewrap.json ./

# Initialize
mkdir android-build
cd android-build
bubblewrap init --config=../bubblewrap.json
```

**Option B: Interactive Setup**

```bash
mkdir android-build
cd android-build

bubblewrap init --manifest="https://campuspro.vercel.app/manifest.webmanifest"
```

When prompted:
```
Application Name: CampusPro
Package Name: com.campuspro.app
Launcher Activity Name: MainActivity
App Version: 1.0.0
App Version Code: 1
Start URL: https://campuspro.vercel.app/
Icon URL: https://campuspro.vercel.app/icons/pwa-512x512.png
Maskable Icon URL: https://campuspro.vercel.app/icons/pwa-512x512-maskable.png
Theme Color: #080810
Background Color: #ffffff
Status Bar Color: #080810
Preferred Display Mode: standalone
Prefer Orientation: portrait
Display Scaling: based on manifest
Min SDK Version: 21 (Android 5.0)
Target SDK Version: 34 (Android 14)
```

#### Step 5: Build Signed APK

```bash
cd android-build

# Build with signing
bubblewrap build \
  --keystore="../keystore/campuspro-release-key.keystore" \
  --keystorePassword="your-keystore-password" \
  --keyAlias="campuspro-release" \
  --keyPassword="your-key-password"

# Output locations:
# - APK: app/build/outputs/apk/release/app-release.apk
# - AAB: app/build/outputs/bundle/release/app-release.aab
```

#### Step 6: Test APK on Device

```bash
# Connect Android device or start emulator
adb devices

# Install APK
adb install app/build/outputs/apk/release/app-release.apk

# View logs
adb logcat | grep CampusPro
```

---

## Google Play Console Setup

### Initial Setup

1. **Create Developer Account**
   - Go to: https://play.google.com/console
   - Sign in with Google account
   - Pay one-time $25 registration fee
   - Complete business info

2. **Create New App**
   - Click "Create app"
   - Name: "CampusPro"
   - Category: Education or Business
   - Audience: Everyone

### Configure App Details

**1. App Info**
- App name: CampusPro
- Short description: "AI-powered college assistant"
- Full description: [2000+ characters describing features]
- Privacy policy URL: https://campuspro.vercel.app/privacy
- Contact email: your-email@example.com

**2. Graphics & Screenshots**
- Feature graphic: 1024x500 PNG
- Icon: 512x512 PNG
- Screenshots (minimum 2):
  - Mobile 1: 540x720 PNG
  - Mobile 2: 540x720 PNG
- Promo video (optional): YouTube link

**3. Categorization**
- Category: Education or Productivity
- Content rating questionnaire: Complete

### Set Up Release Tracks

1. **Internal Testing** (First deployment)
   - Click "Internal testing"
   - Create release
   - Upload AAB file
   - Fill release notes
   - Add testers (emails)
   - Submit for review (~2 hours)

2. **Staged Rollout** (After internal testing passes)
   - Click "Staging"
   - Set rollout: 10% → 25% → 100%
   - Monitor for crashes

3. **Production** (Final release)
   - Upload same or new AAB
   - Submit for review (~24-48 hours)

### Digital Asset Links Setup

**Required for TWA Functionality:**

1. **Generate Certificate SHA-256:**
   ```bash
   keytool -list -v -keystore keystore/campuspro-release-key.keystore \
     -alias campuspro-release
   
   # Copy the SHA-256 fingerprint
   ```

2. **Generate assetlinks.json in Play Console:**
   - Go to App integrity → Play Console → Digital Asset Links
   - Click "Generate"
   - Copy the generated JSON

3. **Host on Your Domain:**
   ```bash
   # Create .well-known/assetlinks.json on your web server
   # Deploy to: https://campuspro.vercel.app/.well-known/assetlinks.json
   
   # For Vercel:
   # 1. Create public/.well-known/assetlinks.json
   # 2. Deploy: vercel deploy --prod
   ```

4. **Verify:**
   ```bash
   curl https://campuspro.vercel.app/.well-known/assetlinks.json
   ```

---

## Deployment Process

### Command Checklist

```bash
# 1. Update dependencies
cd client && npm install && cd ..
cd server && npm install && cd ..

# 2. Build frontend
cd client && npm run build:pwa && cd ..

# 3. Deploy frontend
cd client && vercel deploy --prod && cd ..

# 4. Deploy backend (if needed)
cd server && vercel deploy --prod && cd ..

# 5. Build Android
cd android-build
bubblewrap build \
  --keystore="../keystore/campuspro-release-key.keystore" \
  --keystorePassword="your-password" \
  --keyAlias="campuspro-release" \
  --keyPassword="your-password"

# 6. Upload to Play Console
# - Go to play.google.com/console
# - Upload app-release.aab to Internal Testing
# - After approval, promote to Production
```

### Automated Deployment (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build frontend
        run: |
          cd client
          npm install
          npm run build:pwa
      
      - name: Deploy to Vercel
        run: npm i -g vercel && vercel deploy --prod --token ${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Troubleshooting

### Common Build Errors

**Error: "Cannot find module 'vite-plugin-pwa'"**
```bash
cd client
npm install vite-plugin-pwa workbox-window
npm run build:pwa
```

**Error: "Service Worker registration failed"**
- Check manifest.webmanifest exists
- Verify /icons/ folder has all PNG files
- Check vite.config.js PWA configuration
- Clear browser cache and service workers
- Check browser console for errors

**Error: "Bubblewrap command not found"**
```bash
npm install -g @bubblewrap/cli
which bubblewrap  # On Mac/Linux
where bubblewrap  # On Windows
```

**Error: "Keystore not found or password incorrect"**
```bash
# List keystore contents to verify
keytool -list -v -keystore keystore/campuspro-release-key.keystore

# Re-create if lost (you'll need new signing key)
keytool -genkey -v -keystore keystore/campuspro-release-key.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias campuspro-release
```

**Error: "App rejected by Play Store"**

Common reasons and fixes:
- **Crashes on Android**: Test on real device, check adb logcat
- **Content policy violation**: Review app description, privacy policy
- **Permissions not justified**: Only request necessary permissions
- **API compatibility**: Set targetSdkVersion to 34+
- **64-bit support**: Gradle handles this automatically

Check in Play Console:
- App integrity → Pre-launch reports
- App content → Screenshots & description
- Policies → Review feedback section

### Testing & Validation

**Local Testing:**
```bash
# Test PWA offline
npm run preview  # Serves dist/ locally

# Test service worker
# DevTools → Application → Service Workers

# Test on mobile
# Open: http://localhost:4173
# Try offline mode
```

**Android Testing:**
```bash
# Connect device
adb devices

# Install test APK
adb install app-release.apk

# View real-time logs
adb logcat -s CampusPro

# Check connectivity
adb shell dumpsys connectivity
```

**Play Store Testing:**
1. Add test account in Internal Testing
2. Share internal testing link via email
3. Tester opens link on Android device
4. Reviews app before Play Store submission

---

## Production Best Practices

### Security

1. **API Security**
   - Use HTTPS everywhere
   - Validate all API responses
   - Implement rate limiting (already in server)
   - Use secure headers (CORS, CSP)

2. **Authentication**
   - JWT tokens with short expiry
   - Refresh token rotation
   - Secure storage in localStorage
   - Clear on logout

3. **Data Protection**
   - Encrypt sensitive data in transit
   - Use HTTPS for all connections
   - Don't store passwords locally
   - Clear cache on logout

### Performance

1. **Frontend**
   - Code splitting: ✓ Configured in vite.config.js
   - Image optimization: ✓ PNG icons optimized
   - Lazy loading: ✓ Route-based splitting
   - Caching: ✓ Workbox configured

2. **Backend**
   - Enable GZIP compression
   - Use CDN for static files
   - Optimize database queries
   - Set appropriate cache headers

3. **Monitoring**
   - Use Google Analytics
   - Monitor error rates
   - Track user engagement
   - Set up alerts for crashes

### Maintenance

1. **Version Management**
   ```json
   {
     "version": "1.0.0",
     "appVersionCode": 1
   }
   ```

2. **Update Strategy**
   - Increment appVersionCode for each release
   - Use semantic versioning (major.minor.patch)
   - Document breaking changes
   - Provide migration guides

3. **Monitoring**
   - Set up error tracking (Sentry)
   - Monitor performance (New Relic)
   - Track user analytics (Google Analytics)
   - Monitor backend logs (Render/Vercel)

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] API endpoints verified
- [ ] Icons created and placed
- [ ] Screenshots prepared
- [ ] Privacy policy updated
- [ ] Terms of service ready

### Frontend Deployment
- [ ] .env.production configured
- [ ] Build successful: `npm run build:pwa`
- [ ] dist/ folder has all files
- [ ] Service worker registered
- [ ] PWA installable on mobile
- [ ] Deployed to Vercel/Netlify

### Android Deployment
- [ ] Keystore created and backed up
- [ ] Bubblewrap initialized
- [ ] APK builds successfully
- [ ] AAB builds successfully
- [ ] Tested on Android device
- [ ] No crashes in logcat

### Play Store Submission
- [ ] Play Console account created
- [ ] App info completed
- [ ] Screenshots uploaded
- [ ] Privacy policy set
- [ ] Content rating submitted
- [ ] AAB uploaded to Internal Testing
- [ ] Testers added and notified
- [ ] Internal testing approved
- [ ] Promoted to Production
- [ ] Approved by Google

---

## Support & Resources

### Documentation Links
- PWA: https://web.dev/progressive-web-apps/
- Bubblewrap: https://github.com/GoogleChromeLabs/bubblewrap
- Play Console: https://support.google.com/googleplay/android-developer
- Vite PWA: https://vite-pwa-org.netlify.app/

### Useful Commands

```bash
# View app version info
cd android-build
cat bubblewrap.json | grep -E '"appVersion|appVersionCode'

# Check manifest
curl https://campuspro.vercel.app/manifest.webmanifest

# Test offline
# DevTools → Network → Offline checkbox

# Check service worker
# DevTools → Application → Service Workers

# Generate new build
npm run build:pwa && bubblewrap build

# Clear cache locally
rm -rf client/dist node_modules/.cache
```

---

**Last Updated:** $(date)
**CampusPro Version:** 1.0.0

For questions or issues, refer to:
- GitHub Issues: [Link to repo]
- Documentation: https://campuspro.vercel.app/docs
- Email Support: support@campuspro.dev
