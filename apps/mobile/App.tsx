import {apiClientPlaceholder} from '@acme/api-client';
import React, {useCallback, useState} from 'react';
import {Button, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';

const API_BASE = 'http://localhost:3000';

function App(): React.JSX.Element {
  const [message, setMessage] = useState('Tap "Ping API" to test connectivity.');
  const [loading, setLoading] = useState(false);

  const handlePing = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (!response.ok) {
        setMessage(`Request failed: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();
      setMessage(JSON.stringify(data, null, 2));
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('Unknown error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>API Connectivity</Text>
          <Text style={styles.subtitle}>
            Shared client linked: {apiClientPlaceholder ? 'yes' : 'no'}
          </Text>
          <Button title={loading ? 'Pinging…' : 'Ping API'} onPress={handlePing} disabled={loading} />
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Latest response</Text>
            <Text style={styles.resultText}>{message}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
  },
  resultContainer: {
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    padding: 12,
    gap: 4,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultText: {
    fontFamily: 'Menlo',
    fontSize: 14,
    color: '#0f172a',
  },
});

export default App;
