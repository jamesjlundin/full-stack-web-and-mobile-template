# iOS Release to TestFlight

This document explains how to set up and use the iOS TestFlight deployment workflow.

## Overview

The iOS TestFlight workflow is **manual-only** (`workflow_dispatch`). This means it will not run automatically on pushes or pull requests. You must manually trigger it from the GitHub Actions tab by clicking "Run workflow".

This design ensures the workflow won't fail while App Store Connect is not yet configured.

## Required GitHub Secrets

Before running the workflow, you must add the following secrets in your GitHub repository:

**GitHub → Repo → Settings → Secrets and variables → Actions**

| Secret | Description |
|--------|-------------|
| `APP_IDENTIFIER` | Your iOS app's bundle identifier (e.g., `com.example.myapp`) |
| `APPLE_TEAM_ID` | Your Apple Developer Team ID |
| `APP_STORE_CONNECT_ISSUER_ID` | App Store Connect API Key Issuer ID |
| `APP_STORE_CONNECT_KEY_ID` | App Store Connect API Key ID |
| `APP_STORE_CONNECT_PRIVATE_KEY` | App Store Connect API Private Key (`.p8` file contents) |
| `MATCH_GIT_URL` | Private git repository URL for Match certificates/profiles |
| `MATCH_PASSWORD` | Encryption password for Match repository |

### Optional Secrets

| Secret | Description | Default |
|--------|-------------|---------|
| `IOS_SCHEME` | Xcode scheme name | `Production` |
| `APPLE_ID` | Apple ID email for Fastlane | `ios-ci@example.com` |

## Setting Up App Store Connect API Key

1. Go to [App Store Connect → Users and Access → Keys](https://appstoreconnect.apple.com/access/api)
2. Click the "+" button to create a new key
3. Give it a name (e.g., "CI/CD Key") and select "App Manager" role
4. Download the `.p8` file (you can only download it once!)
5. Note the Key ID and Issuer ID from the page
6. Add these as GitHub secrets

## Setting Up Match

Match stores your iOS code signing certificates and provisioning profiles in a private git repository.

1. Create a new **private** git repository for certificates
2. Set `MATCH_GIT_URL` to this repository URL (e.g., `git@github.com:yourorg/ios-certificates.git`)
3. Set `MATCH_PASSWORD` to a secure encryption password

### First-Time Bootstrap

Once all secrets are configured, you can bootstrap code signing by running locally or via the macOS runner:

```bash
cd apps/mobile/ios
bundle install
bundle exec fastlane ios bootstrap_signing
```

This will:
- Connect to App Store Connect using your API key
- Enable automatic code signing
- Sync certificates and profiles to your Match repository

## Running the Workflow

1. Go to **Actions** tab in your GitHub repository
2. Select **iOS TestFlight Upload** from the left sidebar
3. Click **Run workflow** button
4. Select the branch and click **Run workflow**

## Fastlane Lanes

The following Fastlane lanes are available:

### `preflight`
Checks that all required secrets are present. Exits gracefully with exit code 0 if secrets are missing, printing a helpful message about which secrets need to be added.

### `bootstrap_signing`
Sets up code signing for the first time:
- Configures App Store Connect API key
- Enables automatic code signing
- Syncs Match certificates and profiles

### `upload_testflight`
Builds and uploads to TestFlight:
- Installs CocoaPods dependencies
- Runs TypeScript and ESLint checks
- Gets the latest TestFlight build number and increments it
- Builds the app with `gym`
- Uploads to TestFlight with `pilot`

## Troubleshooting

### "Missing APP_IDENTIFIER" error
The `APP_IDENTIFIER` secret is required. Add it to your GitHub secrets.

### Preflight shows missing secrets
This is expected if you're setting up the project for the first time. Add the missing secrets listed in the output.

### Code signing errors
Run `bundle exec fastlane ios bootstrap_signing` to set up code signing, or check that your Match repository is accessible and the password is correct.

### Build fails on Xcode project not found
Ensure you have initialized the iOS project with React Native and the `.xcodeproj` file exists at `apps/mobile/ios/`.
