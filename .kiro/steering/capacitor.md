# Capacitor Mobile App Setup

## Overview

Easy CSP uses **Capacitor** to wrap the React web app for iOS and Android app stores. This allows us to reuse 95% of the existing React codebase while publishing native apps.

---

## Why Capacitor?

- **Reuses existing React code** — components, hooks, Redux, React Query, Firebase SDK all work unchanged
- **Publishes to real app stores** — Google Play and Apple App Store
- **Fast time to market** — 1-2 weeks vs months for React Native/Flutter rewrites
- **Native features when needed** — push notifications, biometrics, camera, etc.
- **Maintains web version** — same codebase serves web and mobile
- **Well supported** — owned by Ionic, active development, large community

---

## Platform Support

### Android ✅
- Full support on Windows development machine
- Publishes to Google Play Store
- All features work (push notifications, biometric auth, background tasks)
- Faster development cycle (no Mac needed)
- Chrome-based WebView (excellent compatibility)

### iOS ⚠️
- Requires Mac + Xcode for builds
- Publishes to Apple App Store
- All features work but more restricted (background tasks, etc.)
- Options for Windows developers:
  - Use cloud build services (Capacitor Cloud, Ionic Appflow)
  - Borrow/rent a Mac
  - Partner with someone who has a Mac
  - Start Android-only, add iOS later

---

## Installation

```bash
# In easy-csp directory
npm install @capacitor/core @capacitor/cli

# Initialize Capacitor
npx cap init
# App name: Easy CSP
# Package ID: com.easycsp.app (or your chosen ID)
# Web asset directory: dist

# Add platforms
npx cap add android
npx cap add ios  # Only if you have a Mac
```

---

## Essential Plugins

Install these for core mobile features:

```bash
npm install @capacitor/splash-screen
npm install @capacitor/status-bar
npm install @capacitor/keyboard
npm install @capacitor/push-notifications
npm install @capacitor/haptics
npm install @capacitor/app
```

### Plugin Usage

| Plugin | Purpose |
|--------|---------|
| `@capacitor/splash-screen` | Native splash screen |
| `@capacitor/status-bar` | Control status bar color/style |
| `@capacitor/keyboard` | Keyboard behavior and events |
| `@capacitor/push-notifications` | Push notifications (iOS & Android) |
| `@capacitor/haptics` | Vibration feedback |
| `@capacitor/app` | App lifecycle events, deep linking |

---

## Development Workflow

### 1. Build Web App
```bash
npm run build
```

### 2. Sync to Native Projects
```bash
npx cap sync
```
This copies web assets to native projects and updates native dependencies.

### 3. Open in Native IDE

**Android:**
```bash
npx cap open android
```
Opens Android Studio. Run on emulator or physical device.

**iOS (Mac only):**
```bash
npx cap open ios
```
Opens Xcode. Run on simulator or physical device.

### 4. Live Reload (Optional)

For faster development, run Vite dev server and point Capacitor to it:

```bash
# Terminal 1: Start Vite
npm run dev

# Terminal 2: Update capacitor.config.ts with server URL
# Then sync and run in native IDE
```

---

## Configuration

### capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.easycsp.app',
  appName: 'Easy CSP',
  webDir: 'dist',
  server: {
    // For live reload during development
    // url: 'http://192.168.1.100:5173',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
```

---

## Firebase Integration

Firebase SDK works seamlessly with Capacitor:

- **Firestore** — use existing Firebase SDK (client-side)
- **Auth** — Firebase Auth works as-is
- **Cloud Functions** — call via `httpsCallable` as usual
- **Push Notifications** — use Firebase Cloud Messaging (FCM) via `@capacitor/push-notifications`

No changes needed to existing Firebase code.

---

## Native Features for Easy CSP

### Biometric Authentication

```typescript
import { NativeBiometric } from 'capacitor-native-biometric';

// Check if biometrics available
const result = await NativeBiometric.isAvailable();

// Authenticate
await NativeBiometric.verifyIdentity({
  reason: 'Unlock Easy CSP',
  title: 'Biometric Authentication',
});
```

### Push Notifications

```typescript
import { PushNotifications } from '@capacitor/push-notifications';

// Request permission
await PushNotifications.requestPermissions();

// Register for push
await PushNotifications.register();

// Listen for token
PushNotifications.addListener('registration', (token) => {
  console.log('Push token:', token.value);
  // Send to your backend
});

// Listen for notifications
PushNotifications.addListener('pushNotificationReceived', (notification) => {
  console.log('Notification received:', notification);
});
```

### Haptic Feedback

```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Light tap
await Haptics.impact({ style: ImpactStyle.Light });

// Medium tap (for button presses)
await Haptics.impact({ style: ImpactStyle.Medium });

// Heavy tap (for errors)
await Haptics.impact({ style: ImpactStyle.Heavy });
```

---

## App Store Deployment

### Android (Google Play)

1. **Build release APK/AAB:**
   ```bash
   npx cap sync android
   npx cap open android
   # In Android Studio: Build > Generate Signed Bundle/APK
   ```

2. **Create Google Play Console account** ($25 one-time fee)

3. **Upload AAB** and fill out store listing

4. **Review process** — typically 1-3 days

### iOS (App Store)

1. **Build release IPA:**
   ```bash
   npx cap sync ios
   npx cap open ios
   # In Xcode: Product > Archive > Distribute App
   ```

2. **Create Apple Developer account** ($99/year)

3. **Upload via Xcode** or Transporter app

4. **Review process** — typically 1-7 days

---

## PWA vs Capacitor Comparison

| Feature | PWA | Capacitor |
|---------|-----|-----------|
| **App Store Presence** | ❌ No | ✅ Yes |
| **iOS Push Notifications** | ❌ No | ✅ Yes |
| **Biometric Auth** | ❌ No | ✅ Yes |
| **Background Sync** | ⚠️ Limited | ✅ Yes |
| **Native UI Elements** | ❌ No | ✅ Yes |
| **Development Time** | 1-2 days | 1-2 weeks |
| **Code Reuse** | 100% | 95% |
| **User Trust (Financial App)** | ⚠️ Lower | ✅ Higher |

---

## Troubleshooting

### Build fails after adding plugin
```bash
npx cap sync
```
Always sync after installing new plugins.

### Changes not showing in app
```bash
npm run build
npx cap sync
```
Must rebuild and sync after code changes.

### Android emulator not starting
- Ensure Android Studio is installed
- Create AVD (Android Virtual Device) in Android Studio
- Enable virtualization in BIOS if needed

### iOS build issues (Mac)
- Update Xcode to latest version
- Run `pod install` in `ios/App` directory
- Clean build folder in Xcode

---

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [Ionic Forum](https://forum.ionicframework.com/)
- [Capacitor GitHub](https://github.com/ionic-team/capacitor)

---

## Development Strategy

### Phase 1: Android First (Windows Machine)
1. Set up Capacitor for Android
2. Test on Android emulator/device
3. Launch on Google Play Store
4. Gather user feedback

### Phase 2: iOS (When Mac Available)
1. Add iOS platform
2. Test on iOS simulator/device
3. Launch on Apple App Store

This approach allows faster iteration and market validation without needing Mac access immediately.
