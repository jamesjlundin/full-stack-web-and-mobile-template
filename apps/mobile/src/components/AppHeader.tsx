import React from 'react';
import {Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

type AppHeaderProps = {
  title: string;
  onMenuPress: () => void;
};

function HamburgerIcon() {
  return (
    <View style={styles.hamburgerIcon}>
      <View style={styles.hamburgerLine} />
      <View style={styles.hamburgerLine} />
      <View style={styles.hamburgerLine} />
    </View>
  );
}

export default function AppHeader({title, onMenuPress}: AppHeaderProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={onMenuPress}
          activeOpacity={0.7}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <HamburgerIcon />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.placeholder} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
    // Android doesn't handle SafeAreaView the same way, add extra padding
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerIcon: {
    width: 22,
    height: 16,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: 22,
    height: 2,
    backgroundColor: '#374151',
    borderRadius: 1,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
});
