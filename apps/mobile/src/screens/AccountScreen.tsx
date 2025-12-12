import React, {useCallback} from 'react';
import {Button, SafeAreaView, StyleSheet, Text, View} from 'react-native';

import {useAuth} from '../auth/AuthContext';

type AccountScreenProps = {
  onNavigateToChat: () => void;
};

export default function AccountScreen({onNavigateToChat}: AccountScreenProps) {
  const {user, signOut} = useAuth();

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>Signed in as</Text>
        <Text style={styles.email}>{user?.email ?? 'Unknown user'}</Text>

        <View style={styles.buttonGroup}>
          <Button title="Back to Chat" onPress={onNavigateToChat} />
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
  email: {fontSize: 18, fontWeight: '600', color: '#0f172a'},
  buttonGroup: {gap: 12},
});

