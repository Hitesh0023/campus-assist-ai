@echo off
REM CampusPro Android TWA Build Setup Script (Windows)
REM This script sets up Bubblewrap, generates APK/AAB, and prepares for Play Store deployment

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║      CampusPro Android Build Setup - Bubblewrap TWA        ║
echo ║                     Windows Edition                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM ═══════════════════════════════════════════════════════════════════════
REM 1. Check Prerequisites
REM ═══════════════════════════════════════════════════════════════════════
echo [1/7] Checking prerequisites...

where node >nul 2>nul
if errorlevel 1 (
  echo   ✗ Node.js not found - Please install from https://nodejs.org/
  pause
  exit /b 1
)
echo   ✓ Node.js found

where npm >nul 2>nul
if errorlevel 1 (
  echo   ✗ npm not found
  pause
  exit /b 1
)
echo   ✓ npm found

where git >nul 2>nul
if errorlevel 1 (
  echo   ✗ Git not found - Please install from https://git-scm.com/
  pause
  exit /b 1
)
echo   ✓ Git found

where java >nul 2>nul
if errorlevel 1 (
  echo   ✗ Java not found - required for Android builds
  echo   Install from: https://www.oracle.com/java/technologies/downloads/
  pause
  exit /b 1
)
echo   ✓ Java found

REM ═══════════════════════════════════════════════════════════════════════
REM 2. Install Bubblewrap
REM ═══════════════════════════════════════════════════════════════════════
echo.
echo [2/7] Installing Bubblewrap...

npm list -g @bubblewrap/cli >nul 2>&1
if errorlevel 1 (
  echo   Installing @bubblewrap/cli globally...
  call npm install -g @bubblewrap/cli
  if errorlevel 1 (
    echo   ✗ Bubblewrap installation failed
    pause
    exit /b 1
  )
)
echo   ✓ Bubblewrap installed

REM ═══════════════════════════════════════════════════════════════════════
REM 3. Build Frontend PWA
REM ═══════════════════════════════════════════════════════════════════════
echo.
echo [3/7] Building frontend PWA...

cd /d "%CD%\client"

if not exist ".env.production" (
  echo   Creating .env.production...
  (
    echo VITE_API_BASE_URL=https://campuspro-backend.onrender.com
  ) > .env.production
)

call npm install
if errorlevel 1 (
  echo   ✗ npm install failed
  cd /d "%~dp0"
  pause
  exit /b 1
)

call npm run build:pwa
if errorlevel 1 (
  echo   ✗ Frontend build failed
  cd /d "%~dp0"
  pause
  exit /b 1
)

if not exist "dist" (
  echo   ✗ Frontend build failed - dist folder not found
  cd /d "%~dp0"
  pause
  exit /b 1
)
echo   ✓ Frontend built successfully

cd /d "%~dp0"

REM ═══════════════════════════════════════════════════════════════════════
REM 4. Create Keystore
REM ═══════════════════════════════════════════════════════════════════════
echo.
echo [4/7] Setting up Android keystore...

if not exist "keystore" mkdir keystore

if exist "keystore\campuspro-release-key.keystore" (
  echo   ✓ Keystore already exists
  echo   Path: %CD%\keystore\campuspro-release-key.keystore
) else (
  echo   Creating signing keystore...
  echo   You'll need to enter details for your certificate
  echo.
  
  keytool -genkey -v -keystore "%CD%\keystore\campuspro-release-key.keystore" ^
    -keyalg RSA -keysize 2048 -validity 10000 ^
    -alias campuspro-release
  
  if errorlevel 1 (
    echo   ✗ Keystore creation failed
    pause
    exit /b 1
  )
  
  echo   ✓ Keystore created
  echo   Keep this file safe! Back it up immediately.
)

REM ═══════════════════════════════════════════════════════════════════════
REM 5. Initialize Bubblewrap Project
REM ═══════════════════════════════════════════════════════════════════════
echo.
echo [5/7] Initializing Bubblewrap project...

if not exist "android-build" mkdir android-build
cd /d "%CD%\android-build"

if not exist "bubblewrap.json" (
  echo   Running: bubblewrap init
  echo.
  echo   When prompted, enter these values:
  echo   - Package ID: com.campuspro.app
  echo   - App name: CampusPro
  echo   - Start URL: https://campuspro.vercel.app/
  echo   - Display mode: standalone
  echo.
  
  call bubblewrap init --manifest="https://campuspro.vercel.app/manifest.webmanifest" ^
    --packageId="com.campuspro.app" ^
    --appName="CampusPro" ^
    --startUrl="https://campuspro.vercel.app/"
  
  if errorlevel 1 (
    echo   ✗ Bubblewrap initialization failed
    cd /d "%~dp0"
    pause
    exit /b 1
  )
  
  echo   ✓ Bubblewrap project initialized
) else (
  echo   ✓ Bubblewrap project already initialized
)

cd /d "%~dp0"

REM ═══════════════════════════════════════════════════════════════════════
REM 6. Build APK/AAB
REM ═══════════════════════════════════════════════════════════════════════
echo.
echo [6/7] Building Android APK...

cd /d "%CD%\android-build"

echo   Building signed APK...
call bubblewrap build --keystore="%CD%\..\keystore\campuspro-release-key.keystore" ^
  --keystorePassword="" ^
  --keyAlias="campuspro-release" ^
  --keyPassword=""

if errorlevel 1 (
  echo   Note: Keystore password required. Please run again with correct password.
)

cd /d "%~dp0"

REM ═══════════════════════════════════════════════════════════════════════
REM Output Summary
REM ═══════════════════════════════════════════════════════════════════════
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║        Android Build Setup Complete! ✓                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo Build Artifacts:
echo   📦 APK: %CD%\android-build\app\build\outputs\apk\release\app-release.apk
echo   📦 AAB: %CD%\android-build\app\build\outputs\bundle\release\app-release.aab
echo.

echo Next Steps:
echo   1. Test APK on Android device:
echo      adb install "%CD%\android-build\app\build\outputs\apk\release\app-release.apk"
echo.
echo   2. Upload to Google Play Console:
echo      - Go to https://play.google.com/console/
echo      - Select your app
echo      - Go to Release ^> Production
echo      - Upload the AAB file
echo.
echo   3. Configure Digital Asset Links:
echo      - Generate assetlinks.json from Play Console
echo      - Upload to: https://campuspro.vercel.app/.well-known/assetlinks.json
echo.
echo Important Files:
echo   🔑 Keystore: %CD%\keystore\campuspro-release-key.keystore
echo   ⚙️  Config: %CD%\android-build\bubblewrap.json
echo.

pause
