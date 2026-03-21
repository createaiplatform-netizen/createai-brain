import type { CapacitorConfig } from "@capacitor/cli";

/**
 * CreateAI Brain — Capacitor Native App Configuration
 * 
 * This config wraps the deployed CreateAI Brain web app into a native
 * iOS and Android shell. The native app loads the live production URL,
 * giving Sara a real App Store / Google Play submission package.
 *
 * To build:
 *   iOS:     npx cap add ios && npx cap open ios
 *   Android: npx cap add android && npx cap open android
 *
 * Requires: Apple Developer Account ($99/yr) for App Store submission
 *           Google Play Developer Account ($25 one-time) for Play Store
 */

const config: CapacitorConfig = {
  appId: "com.lakesidetrinity.createaibrain",
  appName: "CreateAI Brain",
  webDir: "dist/public",

  // When using server.url, Capacitor loads the live web URL instead of bundled files.
  // Remove or comment out `server` to bundle the built web assets locally (offline support).
  server: {
    // Replace with your production Replit deployment URL:
    url: "https://createaibrain.app",
    cleartext: false,
    allowNavigation: [
      "*.replit.app",
      "*.lakesidetrinity.com",
      "createaibrain.app",
      "api.openai.com",
      "fonts.googleapis.com",
      "fonts.gstatic.com",
    ],
  },

  ios: {
    contentInset: "always",
    backgroundColor: "#020617",
    preferredContentMode: "mobile",
    limitsNavigationsToAppBoundDomains: false,
    scrollEnabled: true,
    allowsLinkPreview: false,
  },

  android: {
    backgroundColor: "#020617",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    loggingBehavior: "none",
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#020617",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "large",
      spinnerColor: "#6366f1",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#6366f1",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
