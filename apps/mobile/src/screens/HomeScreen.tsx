import React from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {useAuth} from '../auth/AuthContext';

type HomeScreenProps = {
  onNavigateToAgent: () => void;
  onSignOut: () => void;
};

export default function HomeScreen({
  onNavigateToAgent,
  onSignOut,
}: HomeScreenProps) {
  const {user} = useAuth();

  const displayName = user?.name || user?.email || 'User';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Welcome to your protected area</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Protected</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Account Information</Text>
            <Text style={styles.cardDescription}>
              Your current session details
            </Text>
          </View>

          <View style={styles.alertBox}>
            <Text style={styles.alertTitle}>Signed in as</Text>
            <Text style={styles.alertDescription}>{displayName}</Text>
          </View>

          <View style={styles.buttonGroup}>
            <Button title="AI Agent Demo" onPress={onNavigateToAgent} />
            <Button title="Sign Out" onPress={onSignOut} color="#64748b" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#f8fafc'},
  container: {padding: 24, gap: 24},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {fontSize: 28, fontWeight: '700', color: '#0f172a'},
  subtitle: {fontSize: 14, color: '#64748b', marginTop: 4},
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {fontSize: 12, fontWeight: '600', color: '#475569'},
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 16,
  },
  cardHeader: {gap: 4},
  cardTitle: {fontSize: 18, fontWeight: '600', color: '#0f172a'},
  cardDescription: {fontSize: 14, color: '#64748b'},
  alertBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  alertTitle: {fontSize: 14, fontWeight: '600', color: '#0f172a'},
  alertDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    marginTop: 4,
  },
  buttonGroup: {gap: 12},
});
