import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';

import {AuthProvider, useAuth} from './src/auth/AuthContext';
import AppHeader from './src/components/AppHeader';
import DrawerMenu from './src/components/DrawerMenu';
import {
  setupDeepLinkListener,
  DeepLinkHandler,
} from './src/linking/DeepLinkHandler';
import AccountScreen from './src/screens/AccountScreen';
import AgentScreen from './src/screens/AgentScreen';
import HomeScreen from './src/screens/HomeScreen';
import ResetConfirmScreen from './src/screens/ResetConfirmScreen';
import ResetRequestScreen from './src/screens/ResetRequestScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import SplashScreen from './src/screens/SplashScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';

// ============================================================================
// Navigation Types
// ============================================================================

/** Screens available when user is NOT authenticated */
type AuthStackScreen =
  | 'welcome'
  | 'signIn'
  | 'signUp'
  | 'resetRequest'
  | 'resetConfirm';

/** Screens available when user IS authenticated */
type AppStackScreen = 'home' | 'agent' | 'account';

// ============================================================================
// Screen Titles
// ============================================================================

const SCREEN_TITLES: Record<AppStackScreen, string> = {
  home: 'Dashboard',
  agent: 'AI Agent',
  account: 'Account',
};

// ============================================================================
// Menu Items
// ============================================================================

const MENU_ITEMS = [
  {id: 'home', label: 'Dashboard'},
  {id: 'agent', label: 'AI Agent'},
  {id: 'account', label: 'Account'},
];

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
 * - Welcome screen (default)
 * - Sign In screen
 * - Sign Up screen
 * - Password Reset Request screen
 * - Password Reset Confirm screen
 */
function AuthStack({onDeepLinkReset}: AuthStackProps) {
  const [screen, setScreen] = useState<AuthStackScreen>('welcome');
  const [resetToken, setResetToken] = useState<string | undefined>(
    onDeepLinkReset,
  );

  // Handle deep link reset token from parent
  useEffect(() => {
    if (onDeepLinkReset) {
      setResetToken(onDeepLinkReset);
      setScreen('resetConfirm');
    }
  }, [onDeepLinkReset]);

  const handleNavigateToResetConfirm = useCallback(
    (tokenFromRequest?: string) => {
      setResetToken(tokenFromRequest);
      setScreen('resetConfirm');
    },
    [],
  );

  const handleResetSuccess = useCallback(() => {
    setResetToken(undefined);
    setScreen('signIn');
  }, []);

  const handleBackToSignIn = useCallback(() => {
    setResetToken(undefined);
    setScreen('signIn');
  }, []);

  if (screen === 'welcome') {
    return (
      <WelcomeScreen
        onCreateAccount={() => setScreen('signUp')}
        onSignIn={() => setScreen('signIn')}
      />
    );
  }

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
 * Uses a hamburger menu with slide-out drawer navigation.
 *
 * Includes:
 * - Home/Dashboard screen (default)
 * - Agent screen
 * - Account screen
 *
 * Protected: Only accessible when user != null
 */
function AppStack() {
  const {user, signOut} = useAuth();
  const [screen, setScreen] = useState<AppStackScreen>('home');
  const [drawerVisible, setDrawerVisible] = useState(false);

  const handleOpenDrawer = useCallback(() => setDrawerVisible(true), []);
  const handleCloseDrawer = useCallback(() => setDrawerVisible(false), []);

  const handleSelectScreen = useCallback((id: string) => {
    setScreen(id as AppStackScreen);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const screenTitle = useMemo(() => SCREEN_TITLES[screen], [screen]);

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            onNavigateToAgent={() => setScreen('agent')}
            onSignOut={handleSignOut}
          />
        );
      case 'agent':
        return <AgentScreen />;
      case 'account':
        return <AccountScreen onNavigateToHome={() => setScreen('home')} />;
      default:
        return (
          <HomeScreen
            onNavigateToAgent={() => setScreen('agent')}
            onSignOut={handleSignOut}
          />
        );
    }
  };

  return (
    <View style={styles.root}>
      {/* Header with hamburger menu */}
      <AppHeader title={screenTitle} onMenuPress={handleOpenDrawer} />

      {/* Screen Content */}
      {renderScreen()}

      {/* Drawer Menu */}
      <DrawerMenu
        visible={drawerVisible}
        onClose={handleCloseDrawer}
        items={MENU_ITEMS}
        activeItem={screen}
        onSelectItem={handleSelectScreen}
        onSignOut={handleSignOut}
        userName={user?.name}
        userEmail={user?.email}
      />
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
  const {user, loading, needsVerification, pendingVerificationEmail} =
    useAuth();
  const [deepLinkResetToken, setDeepLinkResetToken] = useState<
    string | undefined
  >();

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
    backgroundColor: '#f8fafc',
  },
});

export default App;
