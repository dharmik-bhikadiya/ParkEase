# Android APK / AAB Release Build Guide

## Local Release APK Build Commands

1. **Generate Keystore** (if not already existing):
   ```bash
   keytool -genkey -v -keystore release.keystore -alias parkease-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure `apps/mobile/android/gradle.properties`**:
   Add keystore passwords and alias properties securely.

3. **Assemble Release APK**:
   ```bash
   cd apps/mobile/android
   ./gradlew assembleRelease
   ```
   Output APK path: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
