import React, {useCallback, useState, useEffect} from 'react';
import {
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {API_BASE} from '../config/api';

type ResetConfirmScreenProps = {
  initialToken?: string;
  onSuccess: () => void;
  onBackToRequest: () => void;
  onBackToSignIn: () => void;
};

export default function ResetConfirmScreen({
  initialToken,
  onSuccess,
  onBackToRequest,
  onBackToSignIn,
}: ResetConfirmScreenProps) {
  const [token, setToken] = useState(initialToken || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Update token if initialToken changes (e.g., from deep link)
  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  const handleSubmit = useCallback(async () => {
    if (submitting) {
      return;
    }

    setError(null);

    // Client-side validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/reset/confirm`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({token: token.trim(), newPassword}),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setSuccess(true);
        // Navigate back to sign in after a short delay
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        if (data.error === 'invalid_or_expired_token') {
          setError(
            'This reset link is invalid or has expired. Please request a new password reset.',
          );
        } else {
          setError(data.error || 'Failed to reset password');
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reset password');
      }
    } finally {
      setSubmitting(false);
    }
  }, [token, newPassword, confirmPassword, submitting, onSuccess]);

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Password Reset</Text>
          <Text style={styles.successText}>
            Your password has been reset successfully! Redirecting to sign in...
          </Text>
          <View style={styles.buttonGroup}>
            <Button title="Go to Sign In" onPress={onBackToSignIn} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Set New Password</Text>
        <Text style={styles.subtitle}>Enter your new password below.</Text>

        {!initialToken && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Reset Token</Text>
            <TextInput
              value={token}
              onChangeText={setToken}
              autoCapitalize="none"
              placeholder="Paste token from email"
              style={styles.input}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="Min 8 characters"
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Confirm new password"
            style={styles.input}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonGroup}>
          <Button
            title={submitting ? 'Resetting...' : 'Set New Password'}
            onPress={handleSubmit}
            disabled={submitting || !token || !newPassword || !confirmPassword}
          />
          <Button title="Request New Reset Link" onPress={onBackToRequest} />
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
});
