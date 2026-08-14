# Android Physical Device Setup & Local Build Guide

## Prerequisites Checklist
- [x] Java JDK 17 (`java -version`)
- [x] Android SDK Platform 34 & Build Tools 34.0.0
- [x] Environment Variables:
  - `ANDROID_HOME`: `C:\Users\bhika\AppData\Local\Android\Sdk`
  - `ANDROID_SDK_ROOT`: `C:\Users\bhika\AppData\Local\Android\Sdk`
  - `PATH`: Includes `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\cmdline-tools\latest\bin`
- [x] Physical Android device connected over USB with **USB Debugging** enabled.
- [x] `adb devices` shows connected device authorized.

---

## Local Android Build Steps (NO EAS / NO EXPO CLOUD)

1. **Verify Device Connection**
   ```bash
   adb devices
   ```

2. **Configure Host IP**
   Update `EXPO_PUBLIC_API_BASE_URL` in `.env` to your PC's LAN IP address (e.g., `http://192.168.1.100:8000/api/v1`).

3. **Build & Install Locally**
   ```bash
   cd apps/mobile
   npx expo run:android
   ```
   This compiles native C++/Java bindings locally via Gradle and installs `com.parkease.app` directly onto your connected Android device over ADB.
