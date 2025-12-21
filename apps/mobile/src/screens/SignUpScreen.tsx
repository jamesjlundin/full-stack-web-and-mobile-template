import React, {useCallback, useState} from 'react';
import {Button, SafeAreaView, StyleSheet, Text, TextInput, View} from 'react-native';

import {useAuth} from '../auth/AuthContext';

type SignUpScreenProps = {
  onSwitchToSignIn: () => void;
  onSignedUp: () => void;
};

export default function SignUpScreen({onSwitchToSignIn, onSignedUp}: SignUpScreenProps) {
  const {signUp} = useAuth();
  const [name, setName] = useState('');
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
      const result = await signUp(name.trim(), email.trim(), password);
      // If verification is required, the navigation will be handled by RootNavigator
      // based on needsVerification state. Otherwise, call onSignedUp.
      if (!result.requiresVerification) {
        onSignedUp();
      }
      // If verification is required, the user state will trigger navigation to VerifyEmailScreen
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to sign up');
      }
    } finally {
      setSubmitting(false);
    }
  }, [name, email, onSignedUp, password, signUp, submitting]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Create an Account</Text>
        <Text style={styles.subtitle}>Sign up to start chatting</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholder="Your name"
            style={styles.input}
          />
        </View>

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
          <Button title={submitting ? 'Creating Account…' : 'Sign Up'} onPress={handleSubmit} disabled={submitting} />
          <Button title="Have an account? Sign In" onPress={onSwitchToSignIn} />
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

