import React, {useCallback, useState} from 'react';
import {
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {API_BASE} from '../config/api';

type ResetRequestScreenProps = {
  onNavigateToConfirm: (token?: string) => void;
  onBackToSignIn: () => void;
};

export default function ResetRequestScreen({
  onNavigateToConfirm,
  onBackToSignIn,
}: ResetRequestScreenProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setDevToken(null);

    try {
      const response = await fetch(`${API_BASE}/api/auth/reset/request`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({email: email.trim()}),
      });

      const data = await response.json();

      // Always show success to prevent email enumeration
      setSubmitted(true);

      // In dev mode, we might get a token back
      if (data.devToken) {
        setDevToken(data.devToken);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to request password reset');
      }
    } finally {
      setSubmitting(false);
    }
  }, [email, submitting]);

  const handleReset = useCallback(() => {
    setSubmitted(false);
    setEmail('');
    setDevToken(null);
    setError(null);
  }, []);

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.successText}>
            If that email exists in our system, a reset link has been sent.
            Please check your inbox.
          </Text>

          {/* Dev Token Display (only in dev mode) */}
          {devToken ? (
            <View style={styles.devTokenContainer}>
              <Text style={styles.devTokenLabel}>DEV MODE: Reset Token</Text>
              <Text style={styles.devTokenValue} selectable>
                {devToken}
              </Text>
              <Button
                title="Use this token"
                onPress={() => onNavigateToConfirm(devToken)}
              />
            </View>
          ) : null}

          <View style={styles.buttonGroup}>
            <Button title="Send another request" onPress={handleReset} />
            <Button
              title="Enter reset token manually"
              onPress={() => onNavigateToConfirm()}
            />
            <Button title="Back to Sign In" onPress={onBackToSignIn} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </Text>

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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonGroup}>
          <Button
            title={submitting ? 'Sending...' : 'Send Reset Link'}
            onPress={handleSubmit}
            disabled={submitting || !email.trim()}
          />
          <Button title="Back to Sign In" onPress={onBackToSignIn} />
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
  buttonGroup: {gap: 12, marginTop: 8},
  errorText: {color: '#b91c1c'},
  successText: {color: '#047857', fontSize: 14},
  devTokenContainer: {
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    gap: 8,
  },
  devTokenLabel: {fontWeight: 'bold', color: '#92400e'},
  devTokenValue: {fontSize: 12, color: '#78350f', fontFamily: 'monospace'},
});
