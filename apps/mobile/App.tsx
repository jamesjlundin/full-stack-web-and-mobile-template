import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Button, SafeAreaView, StyleSheet, View} from 'react-native';

import {AuthProvider, useAuth} from './src/auth/AuthContext';
import AccountScreen from './src/screens/AccountScreen';
import ChatStream from './src/screens/ChatStream';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';

type AuthStackScreen = 'signIn' | 'signUp';
type AppStackScreen = 'chat' | 'account';

function Navigator() {
  const {token, loading} = useAuth();
  const [authScreen, setAuthScreen] = useState<AuthStackScreen>('signIn');
  const [appScreen, setAppScreen] = useState<AppStackScreen>('chat');

  useEffect(() => {
    if (!token) {
      setAuthScreen('signIn');
      setAppScreen('chat');
    }
  }, [token]);

  const screen = useMemo(() => {
    if (loading) {
      return (
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator size="large" />
        </SafeAreaView>
      );
    }

    if (!token) {
      if (authScreen === 'signUp') {
        return (
          <SignUpScreen
            onSignedUp={() => setAppScreen('chat')}
            onSwitchToSignIn={() => setAuthScreen('signIn')}
          />
        );
      }

      return (
        <SignInScreen
          onSignedIn={() => setAppScreen('chat')}
          onSwitchToSignUp={() => setAuthScreen('signUp')}
        />
      );
    }

    return appScreen === 'account' ? (
      <AccountScreen onNavigateToChat={() => setAppScreen('chat')} />
    ) : (
      <ChatStream />
    );
  }, [appScreen, authScreen, loading, token]);

  const handleSelectChat = useCallback(() => setAppScreen('chat'), []);
  const handleSelectAccount = useCallback(() => setAppScreen('account'), []);

  return (
    <View style={styles.root}>
      {token ? (
        <SafeAreaView style={styles.navBar}>
          <View style={styles.navButtons}>
            <View style={styles.navButtonWrapper}>
              <Button title="Chat" onPress={handleSelectChat} disabled={appScreen === 'chat'} />
            </View>
            <View style={styles.navButtonWrapper}>
              <Button title="Account" onPress={handleSelectAccount} disabled={appScreen === 'account'} />
            </View>
          </View>
        </SafeAreaView>
      ) : null}
      {screen}
    </View>
  );
}

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <Navigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  navBar: {padding: 12, backgroundColor: '#e2e8f0'},
  navButtons: {flexDirection: 'row', gap: 12, justifyContent: 'flex-end'},
  navButtonWrapper: {width: 120},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});

export default App;
