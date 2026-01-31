# Build APK Locally - Vyapar Mobile

## ✅ Changes Made

### 1. Removed Google Login
- ✅ Removed Google Sign-In button from login screen
- ✅ Removed Google OAuth handler function
- ✅ Removed divider and "OR" text
- ✅ Signup screen didn't have Google login (no changes needed)

## 🔨 Building APK Locally

### Prerequisites

1. **Java Development Kit (JDK)**
   ```bash
   # Check if installed
   java -version

   # Should show JDK 17 or higher
   # If not installed, download from: https://adoptium.net/
   ```

2. **Android SDK** (via Android Studio)
   - Download Android Studio: https://developer.android.com/studio
   - Install and run Android Studio
   - Go to: Tools → SDK Manager
   - Install: Android SDK Platform 34 (or latest)

3. **Environment Variables**
   Add to your `~/.zshrc` or `~/.bash_profile`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

   Then reload:
   ```bash
   source ~/.zshrc
   ```

### Method 1: Using Expo Prebuild + Gradle (Recommended)

#### Step 1: Generate Android Project

The prebuild command is already running! Wait for it to complete, then:

```bash
# Navigate to android folder
cd android

# Check that build.gradle exists
ls build.gradle
```

#### Step 2: Build APK

```bash
# Build debug APK
./gradlew assembleDebug

# APK will be created at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

#### Step 3: Build Release APK (Optimized)

```bash
# Build release APK
./gradlew assembleRelease

# APK will be created at:
# android/app/build/outputs/apk/release/app-release-unsigned.apk
```

**Note**: Release APK needs to be signed for distribution.

### Method 2: Using EAS Build (Cloud Build)

```bash
# Login to Expo account
eas login

# Configure build
eas build:configure

# Build APK
eas build --platform android --profile preview

# Or build locally with EAS
eas build --platform android --profile preview --local
```

### Method 3: Quick Debug APK

```bash
# Fastest way to get a debug APK
npm run android

# This will:
# 1. Generate android folder if needed
# 2. Build debug APK
# 3. Install on connected device/emulator
# 4. APK saved at: android/app/build/outputs/apk/debug/app-debug.apk
```

## 📦 Finding Your APK

After building, your APK will be at:

**Debug APK**:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

**Release APK**:
```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

## 🔐 Signing Release APK (For Distribution)

### Step 1: Generate Keystore

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore vyapar-mobile.keystore \
  -alias vyapar-key \
  -keyalg RSA -keysize 2048 -validity 10000
```

You'll be asked:
- Password (remember this!)
- Your name, organization, etc.

### Step 2: Configure Gradle

Create `android/gradle.properties` (or edit existing):

```properties
VYAPAR_UPLOAD_STORE_FILE=vyapar-mobile.keystore
VYAPAR_UPLOAD_STORE_PASSWORD=your_keystore_password
VYAPAR_UPLOAD_KEY_ALIAS=vyapar-key
VYAPAR_UPLOAD_KEY_PASSWORD=your_key_password
```

### Step 3: Update `android/app/build.gradle`

Add signing config:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('VYAPAR_UPLOAD_STORE_FILE')) {
                storeFile file(VYAPAR_UPLOAD_STORE_FILE)
                storePassword VYAPAR_UPLOAD_STORE_PASSWORD
                keyAlias VYAPAR_UPLOAD_KEY_ALIAS
                keyPassword VYAPAR_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            ...
        }
    }
}
```

### Step 4: Build Signed APK

```bash
cd android
./gradlew assembleRelease

# Signed APK at:
# android/app/build/outputs/apk/release/app-release.apk
```

## 🚀 Install APK on Device

### Via USB:

```bash
# Connect device via USB
# Enable USB debugging on device

# Install debug APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or install release APK
adb install android/app/build/outputs/apk/release/app-release.apk
```

### Via File Transfer:

1. Copy APK to phone
2. Open file manager on phone
3. Tap the APK file
4. Allow "Install from unknown sources"
5. Install!

## 🐛 Troubleshooting

### Issue: `ANDROID_HOME not set`

**Solution**:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
source ~/.zshrc
```

### Issue: `sdkmanager not found`

**Solution**: Install Android SDK via Android Studio

### Issue: `Gradle build failed`

**Solution**:
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### Issue: `Module not found` errors

**Solution**:
```bash
# Clean and rebuild
rm -rf node_modules
npm install
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleDebug
```

### Issue: APK won't install on device

**Solution**:
1. Enable "Unknown Sources" in device settings
2. Uninstall previous version first
3. Check device has enough storage

## 📊 Build Sizes

- **Debug APK**: ~80-120 MB (includes debugging symbols)
- **Release APK**: ~40-60 MB (optimized and minified)
- **AAB (App Bundle)**: ~30-40 MB (Google Play format)

## 🔄 Clean Build

If you encounter issues:

```bash
# Clean everything
rm -rf android/
rm -rf node_modules/
rm -rf .expo/

# Reinstall
npm install

# Rebuild
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
```

## 📱 Testing the APK

1. **Install on device**
2. **Test all features**:
   - ✅ Login (email/password only now)
   - ✅ Voice recognition (🎤 button)
   - ✅ AI chat
   - ✅ PDF generation (Hindi requests)
   - ✅ All other app features

## 📤 Distributing APK

### Option 1: Direct Distribution
- Share APK file directly
- Users install manually
- No app store review needed

### Option 2: Google Play Store
- Build AAB instead of APK:
  ```bash
  cd android
  ./gradlew bundleRelease
  # Creates: android/app/build/outputs/bundle/release/app-release.aab
  ```
- Upload to Google Play Console
- Requires Google Play developer account ($25 one-time fee)

### Option 3: Third-party Stores
- Upload to: APKPure, F-Droid, etc.
- Each has own requirements

## ✅ Checklist Before Distribution

- [ ] Test APK on multiple devices
- [ ] All features working
- [ ] No crashes or bugs
- [ ] Proper app icon and name
- [ ] Privacy policy added (if collecting data)
- [ ] Signed with release keystore
- [ ] Version number updated in app.json

## 🎯 Current Status

- ✅ Google login removed
- ✅ Prebuild running (generating android folder)
- ⏳ Waiting for prebuild to complete
- ⏳ Then run: `cd android && ./gradlew assembleDebug`

---

**Your APK will be ready in a few minutes!** 🚀
