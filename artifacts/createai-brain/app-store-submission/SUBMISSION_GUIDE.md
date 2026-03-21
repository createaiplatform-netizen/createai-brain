# CreateAI Brain — Complete App Store Submission Guide

## Overview

CreateAI Brain can be submitted to the Apple App Store and Google Play Store through multiple legal mechanisms. This guide covers all three paths from fastest to most native.

---

## PATH 1: PWA — ACTIVE NOW (No approval needed)

**Status: LIVE** — Users can install right now.

The PWA is fully configured with:
- Complete `manifest.json` with all icon sizes, shortcuts, and screenshots
- Production `sw.js` service worker with offline support, push notifications, and background sync
- All 17 icon sizes (57px → 512px) + maskable variants for Android
- 11 Apple splash screen sizes for all iPhone/iPad models
- iOS meta tags (`apple-mobile-web-app-capable`, `apple-touch-startup-image`, etc.)
- Microsoft/Windows PWA tiles
- `/install.html` — dedicated installation landing page with device-specific instructions

**Users install by:**
- iOS: Safari → Share button → "Add to Home Screen"
- Android: Chrome → Menu → "Add to Home Screen"
- Desktop: Chrome/Edge install button in address bar

---

## PATH 2: Google Play Store via TWA — ~1 week

**Trusted Web Activity (TWA)** wraps your PWA in an Android native shell using Chrome's rendering engine. This is a fully legal, widely-used approach (Twitter Lite, Pinterest, Starbucks all use TWA).

### Requirements
- Google Play Developer Account ($25 one-time fee) → [play.google.com/console](https://play.google.com/console)
- Java Development Kit (JDK 11+)
- Android Studio (optional but helpful)

### Steps

```bash
# Step 1: Install Bubblewrap CLI
npm install -g @bubblewrap/cli

# Step 2: Generate Android project from your manifest
bubblewrap init --manifest=https://YOUR_DEPLOYED_URL/manifest.json

# Step 3: Build the APK/AAB
bubblewrap build

# Step 4: Upload to Google Play Console
# Use the generated .aab file for Play Store submission
```

### Configure Digital Asset Links (required for address bar to disappear)

1. Go to Google Play Console → Your App → Setup → App integrity
2. Copy your SHA-256 certificate fingerprint
3. Replace `REPLACE_WITH_YOUR_PLAY_STORE_SHA256_FINGERPRINT` in:
   - `public/.well-known/assetlinks.json`
4. Deploy your app — the `.well-known/assetlinks.json` file must be publicly accessible

### Alternative: PWABuilder

1. Go to [pwabuilder.com](https://pwabuilder.com)
2. Enter your app URL
3. Download the Android package
4. Upload to Google Play Console

---

## PATH 3: Apple App Store via Capacitor — ~2-4 weeks

**Capacitor** wraps CreateAI Brain in a WKWebView native shell that Apple accepts for App Store submission. Used by thousands of apps in the App Store.

### Requirements

1. **Apple Developer Account** ($99/year) → [developer.apple.com](https://developer.apple.com)
2. **Mac with Xcode** (version 15+)
3. **Xcode Command Line Tools**: `xcode-select --install`
4. **CocoaPods**: `sudo gem install cocoapods`

### Steps

```bash
# Step 1: Install Capacitor CLI
npm install -g @capacitor/cli

# Step 2: In the createai-brain directory, add iOS platform
cd artifacts/createai-brain
npx cap add ios

# Step 3: Install Capacitor dependencies
npm install @capacitor/core @capacitor/ios @capacitor/android @capacitor/splash-screen @capacitor/status-bar @capacitor/push-notifications

# Step 4: Build the web app first
npm run build

# Step 5: Sync with Capacitor
npx cap sync ios

# Step 6: Open in Xcode
npx cap open ios
```

### Xcode Configuration

Once in Xcode:

1. **Bundle Identifier**: Set to `com.lakesidetrinity.createaibrain`
2. **Team**: Select your Apple Developer Team
3. **Signing**: Automatic signing (recommended)
4. **Deployment Target**: iOS 15.0 minimum
5. **App Icons**: Add all required sizes (auto-generated in `public/icons/`)
6. **Launch Screen**: Configure using your splash screens

### App Store Connect Submission

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Create new App (bundle ID: `com.lakesidetrinity.createaibrain`)
3. Fill in metadata from `app-store-submission/metadata.json`
4. Upload screenshots (at least 3 per device size)
5. Archive and upload via Xcode → Product → Archive → Distribute App
6. Submit for review (typical review time: 24-48 hours)

### App Store Review Notes

Include in the review notes (from `metadata.json`):
> "CreateAI Brain is a progressive web app (PWA) wrapped in a Capacitor native shell. The app loads the live web application via WKWebView. An internet connection is required for full functionality."

---

## PATH 4: Alternative Distribution (No App Store needed)

### TestFlight (Beta Distribution)
- Distribute to up to 10,000 beta testers without App Store approval
- Same Xcode build process as App Store
- Users install via TestFlight app
- Great for building initial user base while awaiting App Store approval

### PWABuilder for Microsoft Store
1. Go to [pwabuilder.com](https://pwabuilder.com)
2. Enter your app URL
3. Download the Windows package
4. Submit to Microsoft Store (free for PWAs)

### AltStore (Sideloading)
- Users can install directly on their iPhones without App Store
- No Apple Developer Account required for this path
- Requires users to have AltStore installed

---

## Icon & Asset Checklist

All icons have been generated in `public/icons/`:

| File | Size | Used For |
|------|------|----------|
| icon-57.png | 57×57 | Legacy iOS |
| icon-60.png | 60×60 | iPhone @2x |
| icon-72.png | 72×72 | iPad @1x |
| icon-76.png | 76×76 | iPad @1x |
| icon-96.png | 96×96 | Android HDPI |
| icon-114.png | 114×114 | iPhone @2x |
| icon-120.png | 120×120 | iPhone @3x |
| icon-128.png | 128×128 | Chrome Web Store |
| icon-144.png | 144×144 | IE / Win8 tile |
| icon-152.png | 152×152 | iPad Retina |
| icon-167.png | 167×167 | iPad Pro |
| icon-180.png | 180×180 | iPhone 6+ / current |
| icon-192.png | 192×192 | Android / PWA |
| icon-384.png | 384×384 | Android XXXHDPI |
| icon-512.png | 512×512 | App Store / Play Store |
| icon-maskable-192.png | 192×192 | Android adaptive icon |
| icon-maskable-512.png | 512×512 | Android adaptive icon |

All 11 splash screens generated in `public/splash/` covering all iPhone and iPad sizes.

---

## Contact

Sara Stadler / Lakeside Trinity LLC  
Email: admin@lakesidetrinity.com  
Cash App: $CreateAIDigital  
Venmo: @CreateAIDigital
