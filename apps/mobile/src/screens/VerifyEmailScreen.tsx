import React, {useCallback, useState} from 'react';
import {Button, SafeAreaView, StyleSheet, Text, View} from 'react-native';

import {useAuth} from '../auth/AuthContext';

type VerifyEmailScreenProps = {
  /** Email for unauthenticated verification (from pendingVerificationEmail) */
  email?: string;
};

export default function VerifyEmailScreen({
  email: propEmail,
}: VerifyEmailScreenProps) {
  const {
    user,
    signOut,
    refreshSession,
    requestVerificationEmail,
    clearPendingVerification,
  } = useAuth();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use prop email (from pendingVerificationEmail) or user email
  const displayEmail = propEmail || user?.email;
  // User is unauthenticated if we have propEmail but no user
  const isUnauthenticated = !!propEmail && !user;

  const handleResendEmail = useCallback(async () => {
    if (resending || !displayEmail) {
      return;
    }

    setResending(true);
    setError(null);
    setMessage(null);

    try {
      const result = await requestVerificationEmail(displayEmail);
      if (result.ok) {
        setMessage('Verification email sent! Check your inbox.');
      } else {
        setError(result.error || 'Failed to send verification email');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send verification email');
      }
    } finally {
      setResending(false);
    }
  }, [displayEmail, requestVerificationEmail, resending]);

  const handleCheckStatus = useCallback(async () => {
    if (checking) {
      return;
    }

    setChecking(true);
    setError(null);
    setMessage(null);

    try {
      if (isUnauthenticated) {
        // For unauthenticated users, try to sign in again
        // This will either succeed (if verified) or fail (if still unverified)
        // We don't have the password here, so just clear and let them sign in again
        clearPendingVerification();
      } else {
        await refreshSession();
        // If still on this screen after refresh, the user is still not verified
        // The navigation will handle redirecting if verified
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to check verification status');
      }
    } finally {
      setChecking(false);
    }
  }, [checking, clearPendingVerification, isUnauthenticated, refreshSession]);

  const handleSignOut = useCallback(async () => {
    if (isUnauthenticated) {
      clearPendingVerification();
    } else {
      await signOut();
    }
  }, [clearPendingVerification, isUnauthenticated, signOut]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          Please verify your email address to continue using the app.
        </Text>

        <View style={styles.emailContainer}>
          <Text style={styles.emailLabel}>Email:</Text>
          <Text style={styles.email}>{displayEmail}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            We&apos;ve sent a verification email to your inbox. Click the link
            in the email to verify your account.
          </Text>
        </View>

        {message ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{message}</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonGroup}>
          <Button
            title={resending ? 'Sending...' : 'Resend Verification Email'}
            onPress={handleResendEmail}
            disabled={resending}
          />

          <Button
            title={
              checking
                ? 'Checking...'
                : isUnauthenticated
                  ? "I've Verified - Sign In Again"
                  : "I've Verified My Email"
            }
            onPress={handleCheckStatus}
            disabled={checking}
          />

          <View style={styles.signOutContainer}>
            <Button
              title={isUnauthenticated ? 'Back to Sign In' : 'Sign Out'}
              onPress={handleSignOut}
              color="#6b7280"
            />
          </View>
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
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  emailLabel: {fontSize: 14, fontWeight: '600', color: '#475569'},
  email: {fontSize: 14, color: '#0f172a', fontWeight: '500'},
  infoBox: {
    padding: 16,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  infoText: {fontSize: 14, color: '#1e40af', lineHeight: 20},
  successBox: {
    padding: 16,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  successText: {fontSize: 14, color: '#166534'},
  buttonGroup: {gap: 12, marginTop: 8},
  signOutContainer: {marginTop: 16},
  errorText: {color: '#b91c1c'},
});
