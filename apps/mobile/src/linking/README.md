# Deep Linking Configuration

This document describes how to configure deep linking for the password reset flow on iOS and Android.

## Overview

The app supports password reset deep links in the format:

```
{MOBILE_APP_SCHEME}://reset?token={token}
```

Default scheme: `app-template`

Example: `app-template://reset?token=abc123def456`

## iOS Configuration

Add the URL scheme to your `Info.plist` file (located at `ios/{YourAppName}/Info.plist`):

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>app-template</string>
    </array>
    <key>CFBundleURLName</key>
    <string>com.yourcompany.yourapp</string>
  </dict>
</array>
```

Replace `app-template` with your custom scheme (matching `MOBILE_APP_SCHEME` env var).

### iOS Universal Links (Optional)

For Universal Links (HTTPS deep links), add Associated Domains capability:

1. In Xcode, select your target → Signing & Capabilities
2. Add "Associated Domains" capability
3. Add: `applinks:yourdomain.com`

Then configure your server's `.well-known/apple-app-site-association` file.

## Android Configuration

Add an intent filter to your `AndroidManifest.xml` (located at `android/app/src/main/AndroidManifest.xml`):

```xml
<activity
  android:name=".MainActivity"
  android:launchMode="singleTask">

  <!-- Deep Link Intent Filter -->
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="app-template" />
  </intent-filter>

</activity>
```

Replace `app-template` with your custom scheme (matching `MOBILE_APP_SCHEME` env var).

### Android App Links (Optional)

For App Links (HTTPS deep links), add the `autoVerify` attribute:

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="yourdomain.com" android:pathPrefix="/reset-password" />
</intent-filter>
```

Then configure your server's `/.well-known/assetlinks.json` file.

## Environment Variables

| Variable                   | Default        | Description                                                      |
| -------------------------- | -------------- | ---------------------------------------------------------------- |
| `MOBILE_APP_SCHEME`        | `app-template` | Custom URL scheme for mobile deep links                          |
| `MOBILE_DEEP_LINK_ENABLED` | `0`            | Set to `1` to include mobile deep links in password reset emails |

## Testing Deep Links

### iOS Simulator

```bash
xcrun simctl openurl booted "app-template://reset?token=test123"
```

### Android Emulator

```bash
adb shell am start -W -a android.intent.action.VIEW -d "app-template://reset?token=test123" com.yourpackage.name
```

### React Native CLI

```bash
npx uri-scheme open "app-template://reset?token=test123" --ios
npx uri-scheme open "app-template://reset?token=test123" --android
```

## How It Works

1. User requests password reset on web or mobile
2. Backend generates reset token and sends email
3. If `MOBILE_DEEP_LINK_ENABLED=1`, email includes mobile deep link
4. User taps link on mobile device
5. App opens and parses the deep link via `DeepLinkHandler.ts`
6. App navigates to `ResetConfirmScreen` with the token pre-filled
7. User enters new password and confirms reset
