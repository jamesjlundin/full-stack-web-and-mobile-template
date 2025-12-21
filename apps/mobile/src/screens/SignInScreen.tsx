import React, {useCallback, useState} from 'react';
import {Button, SafeAreaView, StyleSheet, Text, TextInput, View} from 'react-native';

import {useAuth} from '../auth/AuthContext';

type SignInScreenProps = {
  onSwitchToSignUp: () => void;
  onSignedIn: () => void;
  onForgotPassword?: () => void;
};

export default function SignInScreen({onSwitchToSignUp, onSignedIn, onForgotPassword}: SignInScreenProps) {
  const {signIn} = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await signIn(email.trim(), password);
      onSignedIn();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to sign in');
      }
    } finally {
      setSubmitting(false);
    }
  }, [email, onSignedIn, password, signIn, submitting]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign in</Text>
        <Text style={styles.subtitle}>Enter your email and password to access your account</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            style={styles.input}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonGroup}>
          <Button title={submitting ? 'Signing In…' : 'Sign In'} onPress={handleSubmit} disabled={submitting} />
          <Button title="Need an account? Sign Up" onPress={onSwitchToSignUp} />
          {onForgotPassword ? (
            <Button title="Forgot Password?" onPress={onForgotPassword} />
          ) : null}
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
  inputGroup: {gap: 8},
  label: {fontSize: 16, fontWeight: '600', color: '#0f172a'},
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonGroup: {gap: 12},
  errorText: {color: '#b91c1c'},
});

