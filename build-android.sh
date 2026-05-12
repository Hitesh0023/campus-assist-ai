#!/bin/bash
# CampusPro Android TWA Build Setup Script
# This script sets up Bubblewrap, generates APK/AAB, and prepares for Play Store deployment

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      CampusPro Android Build Setup - Bubblewrap TWA        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
PROJECT_DIR=$(pwd)
BUILD_DIR="$PROJECT_DIR/android-build"
KEYSTORE_DIR="$PROJECT_DIR/keystore"

# ═══════════════════════════════════════════════════════════════════════
# 1. Check Prerequisites
# ═══════════════════════════════════════════════════════════════════════
echo -e "${BLUE}[1/7] Checking prerequisites...${NC}"

check_tool() {
  if command -v $1 &> /dev/null; then
    echo -e "${GREEN}  ✓ $1 found${NC}"
    return 0
  else
    echo -e "${RED}  ✗ $1 not found${NC}"
    return 1
  fi
}

required_tools=("node" "npm" "git")
for tool in "${required_tools[@]}"; do
  if ! check_tool $tool; then
    echo -e "${RED}Please install $tool and try again${NC}"
    exit 1
  fi
done

# Check for Java
if ! command -v java &> /dev/null; then
  echo -e "${RED}  ✗ Java not found - required for Android builds${NC}"
  echo -e "${YELLOW}  Install from: https://www.oracle.com/java/technologies/downloads/${NC}"
  exit 1
fi
echo -e "${GREEN}  ✓ Java found${NC}"

# ═══════════════════════════════════════════════════════════════════════
# 2. Install Bubblewrap
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}[2/7] Installing Bubblewrap...${NC}"

if npm list -g @bubblewrap/cli &> /dev/null; then
  echo -e "${GREEN}  ✓ Bubblewrap already installed${NC}"
else
  echo -e "${YELLOW}  Installing @bubblewrap/cli globally...${NC}"
  npm install -g @bubblewrap/cli
  echo -e "${GREEN}  ✓ Bubblewrap installed${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════
# 3. Build Frontend PWA
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}[3/7] Building frontend PWA...${NC}"

cd "$PROJECT_DIR/client"

if [ ! -f ".env.production" ]; then
  echo -e "${YELLOW}  Creating .env.production...${NC}"
  cat > .env.production << 'EOF'
VITE_API_BASE_URL=https://campuspro-backend.onrender.com
EOF
fi

npm install 2>&1 | tail -3
npm run build:pwa 2>&1 | tail -5

if [ -d "dist" ]; then
  echo -e "${GREEN}  ✓ Frontend built successfully${NC}"
else
  echo -e "${RED}  ✗ Frontend build failed${NC}"
  exit 1
fi

cd "$PROJECT_DIR"

# ═══════════════════════════════════════════════════════════════════════
# 4. Create Keystore (if not exists)
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}[4/7] Setting up Android keystore...${NC}"

mkdir -p "$KEYSTORE_DIR"

if [ -f "$KEYSTORE_DIR/campuspro-release-key.keystore" ]; then
  echo -e "${GREEN}  ✓ Keystore already exists${NC}"
  echo -e "${YELLOW}  Path: $KEYSTORE_DIR/campuspro-release-key.keystore${NC}"
else
  echo -e "${YELLOW}  Creating signing keystore...${NC}"
  echo -e "${YELLOW}  You'll need to enter details for your certificate${NC}"
  echo ""
  
  keytool -genkey -v -keystore "$KEYSTORE_DIR/campuspro-release-key.keystore" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -alias campuspro-release
  
  echo -e "${GREEN}  ✓ Keystore created${NC}"
  echo -e "${YELLOW}  Keep this file safe! Back it up immediately.${NC}"
fi

# ═══════════════════════════════════════════════════════════════════════
# 5. Initialize Bubblewrap Project
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}[5/7] Initializing Bubblewrap project...${NC}"

mkdir -p "$BUILD_DIR"
cd "$BUILD_DIR"

# Check if bubblewrap project already exists
if [ ! -f "bubblewrap.json" ]; then
  echo -e "${YELLOW}  Running: bubblewrap init${NC}"
  echo ""
  echo -e "${YELLOW}  When prompted, enter:${NC}"
  echo "    Package ID: com.campuspro.app"
  echo "    App name: CampusPro"
  echo "    Start URL: https://campuspro.vercel.app/"
  echo "    Display mode: standalone"
  echo ""
  
  bubblewrap init --manifest="https://campuspro.vercel.app/manifest.webmanifest" \
    --packageId="com.campuspro.app" \
    --appName="CampusPro" \
    --startUrl="https://campuspro.vercel.app/"
  
  echo -e "${GREEN}  ✓ Bubblewrap project initialized${NC}"
else
  echo -e "${GREEN}  ✓ Bubblewrap project already initialized${NC}"
fi

cd "$PROJECT_DIR"

# ═══════════════════════════════════════════════════════════════════════
# 6. Copy Web Assets
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}[6/7] Preparing Android build...${NC}"

echo -e "${YELLOW}  Note: Bubblewrap uses Trusted Web Activity${NC}"
echo -e "${YELLOW}  Your web app must be hosted at: https://campuspro.vercel.app/${NC}"
echo -e "${YELLOW}  Digital Asset Links file will be generated${NC}"

# ═══════════════════════════════════════════════════════════════════════
# 7. Generate APK/AAB
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo -e "${BLUE}[7/7] Generating Android builds...${NC}"

cd "$BUILD_DIR"

echo -e "${YELLOW}  Building signed APK...${NC}"
bubblewrap build \
  --keystore="$KEYSTORE_DIR/campuspro-release-key.keystore" \
  --keystorePassword="$(cat $KEYSTORE_DIR/.password 2>/dev/null || echo '')" \
  --keyAlias="campuspro-release" \
  --keyPassword="$(cat $KEYSTORE_DIR/.keyPassword 2>/dev/null || echo '')" \
  2>&1 | tail -10

# Generate AAB for Play Store
if [ -f "$(find . -name "*.apk" -type f)" ]; then
  echo -e "${YELLOW}  Building App Bundle (AAB)...${NC}"
  bubblewrap build --appBundle 2>&1 | tail -10
fi

cd "$PROJECT_DIR"

# ═══════════════════════════════════════════════════════════════════════
# Output Summary
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Android Build Setup Complete! ✓                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Build Artifacts:${NC}"
echo "  📦 APK: $BUILD_DIR/app/build/outputs/apk/release/app-release.apk"
echo "  📦 AAB: $BUILD_DIR/app/build/outputs/bundle/release/app-release.aab"
echo ""

echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Test APK on Android device:"
echo "     adb install $BUILD_DIR/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "  2. Upload to Google Play Console:"
echo "     - Go to https://play.google.com/console/"
echo "     - Select your app"
echo "     - Go to Release → Production"
echo "     - Upload the AAB file"
echo ""
echo "  3. Configure Digital Asset Links:"
echo "     - Generate assetlinks.json from Play Console"
echo "     - Upload to: https://campuspro.vercel.app/.well-known/assetlinks.json"
echo ""
echo -e "${YELLOW}Important Files:${NC}"
echo "  🔑 Keystore: $KEYSTORE_DIR/campuspro-release-key.keystore"
echo "  ⚙️  Config: $BUILD_DIR/bubblewrap.json"
echo ""
