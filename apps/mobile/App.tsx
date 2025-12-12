import {apiClientPlaceholder} from '@acme/api-client';
import React, {useCallback, useMemo, useState} from 'react';
import {
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const API_BASE = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

function App(): React.JSX.Element {
  const [message, setMessage] = useState('Tap "Ping API" to test connectivity.');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const tokenPreview = useMemo(() => {
    if (!token) return 'No token stored yet';
    return `${token.slice(0, 16)}…`;
  }, [token]);

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

  const handleSignIn = useCallback(async () => {
    setAuthMessage('Signing in…');

    try {
      const response = await fetch(`${API_BASE}/api/auth/token`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({email, password}),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthMessage(`Failed: ${response.status} ${JSON.stringify(data)}`);
        setToken(null);
        return;
      }

      setToken(typeof data.token === 'string' ? data.token : null);
      setAuthMessage(JSON.stringify(data, null, 2));
    } catch (error) {
      if (error instanceof Error) {
        setAuthMessage(error.message);
      } else {
        setAuthMessage('Unknown error');
      }
    }
  }, [email, password]);

  const handleMe = useCallback(async () => {
    if (!token) {
      setAuthMessage('No token available. Please sign in first.');
      return;
    }

    setAuthMessage('Checking /api/me…');

    try {
      const response = await fetch(`${API_BASE}/api/me`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();
      setAuthMessage(`Status ${response.status}: ${text}`);
    } catch (error) {
      if (error instanceof Error) {
        setAuthMessage(error.message);
      } else {
        setAuthMessage('Unknown error');
      }
    }
  }, [token]);

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

        <View style={styles.card}>
          <Text style={styles.title}>Mobile Sign-In</Text>
          <Text style={styles.subtitle}>
            API base: {API_BASE} | Token: {tokenPreview}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              value={email}
              placeholder="user@example.com"
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              autoCapitalize="none"
              secureTextEntry
              style={styles.input}
              value={password}
              placeholder="••••••••"
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.buttonRow}>
            <View style={styles.buttonWrapper}>
              <Button title="Sign In" onPress={handleSignIn} />
            </View>
            <View style={styles.buttonWrapper}>
              <Button title="Me (Bearer)" onPress={handleMe} />
            </View>
          </View>

          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Auth response</Text>
            <Text style={styles.resultText}>{authMessage || 'Awaiting action'}</Text>
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
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
  },
});

export default App;
