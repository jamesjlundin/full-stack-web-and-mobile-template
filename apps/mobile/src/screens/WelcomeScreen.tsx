import React from 'react';
import {
  Button,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type WelcomeScreenProps = {
  onCreateAccount: () => void;
  onSignIn: () => void;
};

export default function WelcomeScreen({onCreateAccount, onSignIn}: WelcomeScreenProps) {
  const handleGitHubPress = () => {
    Linking.openURL('https://github.com/jamesjlundin');
  };

  const handleLinkedInPress = () => {
    Linking.openURL('https://www.linkedin.com/in/jamesjlundin');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Full-Stack Template</Text>
          </View>

          <Text style={styles.title}>Build your next</Text>
          <Text style={styles.titleAccent}>great project</Text>

          <Text style={styles.subtitle}>
            A complete full-stack foundation with authentication, database, and
            modern tooling ready to go.
          </Text>

          <View style={styles.buttonGroup}>
            <View style={styles.primaryButton}>
              <Button title="Create account" onPress={onCreateAccount} />
            </View>
            <View style={styles.secondaryButton}>
              <Button title="Sign in" onPress={onSignIn} color="#64748b" />
            </View>
          </View>
        </View>

        <View style={styles.creatorSection}>
          <View style={styles.separator} />
          <Text style={styles.creatorLabel}>
            Created by <Text style={styles.creatorName}>James Lundin</Text>
          </Text>
          <Text style={styles.creatorBio}>
            Full-stack engineer passionate about building modern web and mobile
            applications
          </Text>
          <View style={styles.socialLinks}>
            <TouchableOpacity style={styles.socialLink} onPress={handleGitHubPress}>
              <Text style={styles.socialIcon}>{'</>'}</Text>
              <Text style={styles.socialText}>GitHub</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialLink} onPress={handleLinkedInPress}>
              <Text style={styles.socialIcon}>in</Text>
              <Text style={styles.socialText}>LinkedIn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#f8fafc'},
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  titleAccent: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonGroup: {gap: 12, width: '100%', maxWidth: 280},
  primaryButton: {},
  secondaryButton: {},
  creatorSection: {
    alignItems: 'center',
    gap: 8,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
  },
  creatorLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  creatorName: {
    fontWeight: '600',
    color: '#0f172a',
  },
  creatorBio: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 280,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  socialText: {
    fontSize: 14,
    color: '#64748b',
  },
});
