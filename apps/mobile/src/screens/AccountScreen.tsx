import React, {useCallback} from 'react';
import {Button, SafeAreaView, StyleSheet, Text, View} from 'react-native';

import {useAuth} from '../auth/AuthContext';

type AccountScreenProps = {
  onNavigateToHome: () => void;
};

export default function AccountScreen({onNavigateToHome}: AccountScreenProps) {
  const {user, signOut} = useAuth();

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>Signed in as</Text>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email ?? 'Unknown email'}</Text>

        <View style={styles.buttonGroup}>
          <Button title="Back to Home" onPress={onNavigateToHome} />
          <Button title="Sign Out" onPress={handleSignOut} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#f8fafc'},
  container: {flex: 1, padding: 24, gap: 16},
  title: {fontSize: 24, fontWeight: '700', color: '#0f172a'},
  subtitle: {fontSize: 14, color: '#475569'},
  name: {fontSize: 20, fontWeight: '700', color: '#0f172a'},
  email: {fontSize: 16, color: '#475569'},
  buttonGroup: {gap: 12},
});

