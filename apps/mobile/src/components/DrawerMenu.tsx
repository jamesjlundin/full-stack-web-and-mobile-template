import React from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

type MenuItem = {
  id: string;
  label: string;
  icon?: string;
};

type DrawerMenuProps = {
  visible: boolean;
  onClose: () => void;
  items: MenuItem[];
  activeItem: string;
  onSelectItem: (id: string) => void;
  onSignOut?: () => void;
  userName?: string;
  userEmail?: string;
};

export default function DrawerMenu({
  visible,
  onClose,
  items,
  activeItem,
  onSelectItem,
  onSignOut,
  userName,
  userEmail,
}: DrawerMenuProps) {
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleItemPress = (id: string) => {
    onSelectItem(id);
    onClose();
  };

  const handleSignOut = () => {
    onClose();
    onSignOut?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[styles.drawer, {transform: [{translateX: slideAnim}]}]}>
          {/* User Info Header */}
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userName?.[0]?.toUpperCase() ||
                  userEmail?.[0]?.toUpperCase() ||
                  '?'}
              </Text>
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {userName || 'User'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {userEmail || ''}
            </Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            {items.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  activeItem === item.id && styles.menuItemActive,
                ]}
                onPress={() => handleItemPress(item.id)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.menuItemText,
                    activeItem === item.id && styles.menuItemTextActive,
                  ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sign Out Button */}
          {onSignOut && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
                activeOpacity={0.7}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 2, height: 0},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuItems: {
    paddingTop: 8,
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemActive: {
    backgroundColor: '#eff6ff',
    borderRightWidth: 3,
    borderRightColor: '#3b82f6',
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
  },
  menuItemTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: 34, // Safe area padding for bottom
  },
  signOutButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  signOutText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '500',
  },
});
