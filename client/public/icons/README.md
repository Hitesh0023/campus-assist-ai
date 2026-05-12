# CampusPro App Icons Structure

This directory contains all icon assets for the PWA and Android app.

## Icon Files Required

Place the following icon files in this directory:

### PWA Icons (Required)
- **pwa-64x64.png** - 64x64px, square logo for small displays
- **pwa-192x192.png** - 192x192px, standard PWA icon, RGB color
- **pwa-192x192-maskable.png** - 192x192px, maskable format (for adaptive icons)
- **pwa-512x512.png** - 512x512px, large icon, RGB color  
- **pwa-512x512-maskable.png** - 512x512px, maskable format
- **pwa-1024x1024.png** - 1024x1024px, large icon for app stores

### Apple Icons
- **apple-touch-icon.png** - 180x180px, Apple touch icon
- **apple-touch-icon-152.png** - 152x152px, iPad app icon
- **apple-touch-icon-167.png** - 167x167px, iPad Pro app icon

### Favicon Files
- **favicon-32x32.png** - 32x32px browser favicon
- **favicon-16x16.png** - 16x16px browser favicon
- **favicon.ico** - Multi-resolution favicon

### Shortcut Icons (optional)
- **shortcut-chat-96x96.png** - 96x96px for New Chat shortcut
- **shortcut-placement-96x96.png** - 96x96px for Interview Prep shortcut
- **shortcut-history-96x96.png** - 96x96px for History shortcut

### Splash Screens
- **splash-512x512.png** - 512x512px splash screen
- **splash-1024x1024.png** - 1024x1024px splash screen

## Design Guidelines

### Icon Design Best Practices
1. **Spacing**: Leave 10% padding around the icon content
2. **Format**: Use PNG format with transparency (RGBA)
3. **Colors**: 
   - Primary: #080810 (dark background)
   - Accent: #7C3AED (violet)
   - Secondary: #10B981 (green)
4. **Maskable Icons**: Safe zone is 80% of the icon area (10% padding on all sides)
5. **Consistency**: All icons should have consistent styling and branding

### Creating Icons

#### Option 1: Using online tools
- Favicon.io (favicon.io)
- PWA Asset Generator (https://github.com/dollarshaveclub/pwa-asset-generator)
- Favicon Generator (https://realfavicongenerator.net/)

#### Option 2: Using Node.js tools
```bash
npm install -g pwa-asset-generator
pwa-asset-generator logo.svg . --type png --icon-only --splash-only --quality 100
```

#### Option 3: Using ImageMagick
```bash
convert logo.svg -resize 512x512 pwa-512x512.png
convert logo.svg -resize 192x192 pwa-192x192.png
# etc...
```

## Android Icons for TWA/APK

For Android builds, you need:

### App Icons
- **ic_launcher_foreground.png** - 108x108px (playstore icon foreground)
- **ic_launcher_background.png** - 108x108px (playstore icon background)
- **ic_launcher_monochrome.png** - 108x108px (adaptive icon monochrome)

### Notification Icons
- **ic_notification.png** - 48x48px

Refer to `bubblewrap/app/src/main/res/mipmap-*/` for Android-specific directories.

## Testing Icons

1. **PWA Icon Display**: Build with `npm run build:pwa` and test locally
2. **Browser Test**: Open DevTools → Application → Manifest
3. **Install Test**: Try installing the app on mobile
4. **Android Test**: Build APK and test on Android device

## Icon Generation Commands

```bash
# Using ImageMagick (requires installation)
for size in 64 192 512; do
  convert logo.svg -resize ${size}x${size} pwa-${size}x${size}.png
done

# Using ffmpeg
for size in 64 192 512; do
  ffmpeg -i logo.svg -vf scale=${size}:${size} pwa-${size}x${size}.png
done
```

## Where to Download/Create Logo

1. **Canva**: canva.com (easy drag-and-drop design)
2. **Figma**: figma.com (professional design)
3. **Design.com**: design.com (AI-powered logo generator)
4. **Looka.com**: looka.com (AI logo generator)
5. **Gravit Designer**: gravit.io (free online designer)

## Converting SVG to PNG

If you have an SVG logo, convert it:

```bash
# Using ImageMagick
convert -density 300 logo.svg -resize 512x512 pwa-512x512.png

# Using Inkscape
inkscape -w 512 -h 512 logo.svg -o pwa-512x512.png

# Using online tool: CloudConvert.com
```

## Icon Folder Structure

```
client/public/icons/
├── pwa-64x64.png
├── pwa-192x192.png
├── pwa-192x192-maskable.png
├── pwa-512x512.png
├── pwa-512x512-maskable.png
├── pwa-1024x1024.png
├── apple-touch-icon.png
├── favicon-32x32.png
├── favicon-16x16.png
├── favicon.ico
├── shortcut-chat-96x96.png
├── shortcut-placement-96x96.png
└── shortcut-history-96x96.png

client/public/screenshots/
├── mobile-1.png (540x720)
├── mobile-2.png (540x720)
├── mobile-3.png (540x720)
└── desktop-1.png (1280x720)
```

## Quick Start

1. Create your logo in design tool (Canva/Figma)
2. Export as PNG or SVG
3. Use this tool to generate all sizes: https://pwa-asset-generator.netlify.app/
4. Download and copy files to `client/public/icons/`
5. Create 4 app screenshots and add to `client/public/screenshots/`
6. Build with `npm run build:pwa`
