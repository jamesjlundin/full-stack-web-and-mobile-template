# Mobile App

A React Native mobile application that connects to the backend API for authentication, user management, and AI chat features.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18
- **pnpm** >= 9.12.3
- **Ruby** >= 3.0 (recommended: use [rbenv](https://github.com/rbenv/rbenv))
- **Xcode** (for iOS development) - Mac only
- **CocoaPods** >= 1.13, < 1.15
- **Android Studio** (for Android development)

## Quick Start

### 1. Install Dependencies

From the repository root:

```bash
pnpm install
```

### 2. Configure Environment

Initialize and configure environment variables:

```bash
pnpm env:init
```

To set optional environment variables (like API keys) and propagate them:

```bash
pnpm env:set OPENAI_API_KEY=your_key_here
```

Edit the root `.env` file with your configuration (see main README for details).

### 3. Start the Backend API

The mobile app requires the backend to be running:

```bash
pnpm dev
```

This starts the API server at `http://localhost:3000`.

### 4. iOS Setup (Mac only)

```bash
cd apps/mobile/ios

# Install Ruby dependencies
bundle install

# Install CocoaPods dependencies
bundle exec pod install
```

### 5. Android Setup

Android should work out of the box after running `pnpm install`. Make sure you have:

- Android Studio installed
- Android SDK configured
- An Android emulator set up or a physical device connected

### 6. Start Metro Bundler

In a separate terminal:

```bash
cd apps/mobile
pnpm start
```

### 7. Run the App

**iOS (Mac only):**

```bash
pnpm ios
```

**Android:**

```bash
pnpm android
```

## API Configuration

The app automatically connects to:

- **iOS Simulator**: `http://localhost:3000`
- **Android Emulator**: `http://10.0.2.2:3000`

This is configured in `src/config/api.ts`.

## Troubleshooting

### Ruby Version Issues

If you encounter Ruby-related errors, install a modern Ruby version:

```bash
# Install rbenv (if not installed)
brew install rbenv ruby-build

# Add to shell profile
echo 'eval "$(rbenv init - zsh)"' >> ~/.zshrc
source ~/.zshrc

# Install Ruby 3.2
rbenv install 3.2.2
cd apps/mobile/ios
rbenv local 3.2.2

# Verify
ruby --version
```

### CocoaPods Not Found

Always use `bundle exec` to run pod commands:

```bash
bundle exec pod install
```

### Build Errors

1. Clean the build:

   ```bash
   # iOS
   cd ios && rm -rf Pods Podfile.lock && bundle exec pod install

   # Android
   cd android && ./gradlew clean
   ```

2. Clear Metro cache:

   ```bash
   pnpm start --reset-cache
   ```

3. Clear watchman:

   ```bash
   watchman watch-del-all
   ```

## Project Structure

```txt
apps/mobile/
├── src/
│   ├── auth/           # Authentication context and token storage
│   ├── config/         # API configuration
│   ├── linking/        # Deep linking setup
│   └── screens/        # App screens
├── ios/                # iOS native project
│   ├── mobile/         # iOS app source
│   ├── mobile.xcodeproj/
│   ├── Podfile
│   └── fastlane/       # iOS deployment automation
├── android/            # Android native project
│   ├── app/
│   └── gradle/
├── App.tsx             # Root component
└── index.js            # Entry point
```

## Features

- Email/password authentication
- Secure token storage (iOS Keychain / Android Keystore)
- Email verification flow
- Password reset with deep links
- AI chat with streaming responses
- Account management

## Deep Linking

The app supports deep links for password reset. Configure the URL scheme in:

- **iOS**: `ios/mobile/Info.plist`
- **Android**: `android/app/src/main/AndroidManifest.xml`

Default scheme: `app-template://`

See `src/linking/README.md` for detailed setup.

## iOS Release

For TestFlight deployment, see `ios-release.md`.

## Learn More

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)
