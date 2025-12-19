import React, {useCallback, useEffect, useState} from 'react';
import {Button, SafeAreaView, StyleSheet, View} from 'react-native';

import {AuthProvider, useAuth} from './src/auth/AuthContext';
import {setupDeepLinkListener, DeepLinkHandler} from './src/linking/DeepLinkHandler';
import AccountScreen from './src/screens/AccountScreen';
import ChatStream from './src/screens/ChatStream';
import ResetConfirmScreen from './src/screens/ResetConfirmScreen';
import ResetRequestScreen from './src/screens/ResetRequestScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import SplashScreen from './src/screens/SplashScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';

// ============================================================================
// Navigation Types
// ============================================================================

/** Screens available when user is NOT authenticated */
type AuthStackScreen = 'signIn' | 'signUp' | 'resetRequest' | 'resetConfirm';

/** Screens available when user IS authenticated */
type AppStackScreen = 'chat' | 'account';

// ============================================================================
// Auth Stack Navigator
// ============================================================================

type AuthStackProps = {
  onDeepLinkReset?: string;
};

/**
 * AuthStack - Navigation for unauthenticated users
 *
 * Includes:
 * - Sign In screen (default)
 * - Sign Up screen
 * - Password Reset Request screen
 * - Password Reset Confirm screen
 */
function AuthStack({onDeepLinkReset}: AuthStackProps) {
  const [screen, setScreen] = useState<AuthStackScreen>('signIn');
  const [resetToken, setResetToken] = useState<string | undefined>(onDeepLinkReset);

  // Handle deep link reset token from parent
  useEffect(() => {
    if (onDeepLinkReset) {
      setResetToken(onDeepLinkReset);
      setScreen('resetConfirm');
    }
  }, [onDeepLinkReset]);

  const handleNavigateToResetConfirm = useCallback((tokenFromRequest?: string) => {
    setResetToken(tokenFromRequest);
    setScreen('resetConfirm');
  }, []);

  const handleResetSuccess = useCallback(() => {
    setResetToken(undefined);
    setScreen('signIn');
  }, []);

  const handleBackToSignIn = useCallback(() => {
    setResetToken(undefined);
    setScreen('signIn');
  }, []);

  if (screen === 'signUp') {
    return (
      <SignUpScreen
        onSignedUp={() => {
          // Navigation handled by auth state change
        }}
        onSwitchToSignIn={() => setScreen('signIn')}
      />
    );
  }

  if (screen === 'resetRequest') {
    return (
      <ResetRequestScreen
        onNavigateToConfirm={handleNavigateToResetConfirm}
        onBackToSignIn={handleBackToSignIn}
      />
    );
  }

  if (screen === 'resetConfirm') {
    return (
      <ResetConfirmScreen
        initialToken={resetToken}
        onSuccess={handleResetSuccess}
        onBackToRequest={() => {
          setResetToken(undefined);
          setScreen('resetRequest');
        }}
        onBackToSignIn={handleBackToSignIn}
      />
    );
  }

  // Default: Sign In screen
  return (
    <SignInScreen
      onSignedIn={() => {
        // Navigation handled by auth state change
      }}
      onSwitchToSignUp={() => setScreen('signUp')}
      onForgotPassword={() => setScreen('resetRequest')}
    />
  );
}

// ============================================================================
// App Stack Navigator
// ============================================================================

/**
 * AppStack - Navigation for authenticated users
 *
 * Includes:
 * - Chat screen (default)
 * - Account screen
 *
 * Protected: Only accessible when user != null
 */
function AppStack() {
  const [screen, setScreen] = useState<AppStackScreen>('chat');

  const handleSelectChat = useCallback(() => setScreen('chat'), []);
  const handleSelectAccount = useCallback(() => setScreen('account'), []);

  return (
    <View style={styles.root}>
      {/* Navigation Bar */}
      <SafeAreaView style={styles.navBar}>
        <View style={styles.navButtons}>
          <View style={styles.navButtonWrapper}>
            <Button
              title="Chat"
              onPress={handleSelectChat}
              disabled={screen === 'chat'}
            />
          </View>
          <View style={styles.navButtonWrapper}>
            <Button
              title="Account"
              onPress={handleSelectAccount}
              disabled={screen === 'account'}
            />
          </View>
        </View>
      </SafeAreaView>

      {/* Screen Content */}
      {screen === 'account' ? (
        <AccountScreen onNavigateToChat={handleSelectChat} />
      ) : (
        <ChatStream />
      )}
    </View>
  );
}

// ============================================================================
// Root Navigator
// ============================================================================

/**
 * RootNavigator - Decides which stack to show based on auth state
 *
 * Flow:
 * 1. If loading → Show SplashScreen
 * 2. If no user → Show AuthStack
 * 3. If user needs verification → Show VerifyEmailScreen
 * 4. If user exists and verified → Show AppStack
 *
 * Also handles deep links for password reset.
 */
function RootNavigator() {
  const {user, loading, needsVerification, pendingVerificationEmail} = useAuth();
  const [deepLinkResetToken, setDeepLinkResetToken] = useState<string | undefined>();

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = (link: DeepLinkHandler) => {
      if (link.type === 'reset') {
        setDeepLinkResetToken(link.token);
      }
    };

    const cleanup = setupDeepLinkListener(handleDeepLink);
    return cleanup;
  }, []);

  // Clear deep link token after it's been used or when user signs in
  useEffect(() => {
    if (user && deepLinkResetToken) {
      setDeepLinkResetToken(undefined);
    }
  }, [user, deepLinkResetToken]);

  // Show splash screen while restoring session
  if (loading) {
    return <SplashScreen />;
  }

  // Show verification screen if sign-in was blocked due to unverified email
  if (pendingVerificationEmail) {
    return <VerifyEmailScreen email={pendingVerificationEmail} />;
  }

  // Show auth stack if not authenticated
  if (!user) {
    return <AuthStack onDeepLinkReset={deepLinkResetToken} />;
  }

  // Show verification screen if user needs to verify email
  if (needsVerification) {
    return <VerifyEmailScreen />;
  }

  // Show app stack for authenticated and verified users
  return <AppStack />;
}

// ============================================================================
// App Component
// ============================================================================

/**
 * App - Root component with AuthProvider
 *
 * The AuthProvider wraps the entire app and provides:
 * - user: Current authenticated user
 * - token: Current session token
 * - loading: True while restoring session
 * - signIn, signUp, signOut: Auth methods
 * - refreshSession: Re-validate current session
 */
function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  navBar: {
    padding: 12,
    backgroundColor: '#e2e8f0',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  navButtonWrapper: {
    width: 120,
  },
});

export default App;
