import { useRouter } from 'expo-router';
import {
  Check,
  ChevronRight,
  Globe,
  HelpCircle,
  LogOut,
  Moon,
  Shield,
  Store,
  X
} from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BorderRadius, Colors, Spacing } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.85;
export { DRAWER_WIDTH };

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  translateX: SharedValue<number>;
}

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useUserStore } from '../store/useUserStore';

export default function SettingsDrawer({ isOpen, onClose, translateX }: SettingsDrawerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const { language: selectedLanguage, setLanguage: setSelectedLanguage } = useLanguage();
  const { name, email, shopName, avatarUri, resetOnboarding } = useUserStore();
  const [darkMode, setDarkMode] = React.useState(false);
  const [showLanguageOptions, setShowLanguageOptions] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await signOut();
              resetOnboarding();
              onClose();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const languages = [
    { id: 'English', label: 'English', sub: 'English' },
    { id: 'Hindi', label: 'Hindi', sub: 'हिंदी' },
    { id: 'Hinglish', label: 'Hinglish', sub: 'Hinglish' },
  ];

  // Sync open state with animation if triggered via button
  React.useEffect(() => {
    if (isOpen) {
      translateX.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      // Only close if it's not already closed (to avoid conflicting with gesture close)
      if (translateX.value > -DRAWER_WIDTH) {
        translateX.value = withTiming(-DRAWER_WIDTH, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      }
    }
  }, [isOpen]);



  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const context = useSharedValue({ x: 0 });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { x: translateX.value };
    })
    .onUpdate((event) => {
      const newX = event.translationX + context.value.x;
      // Allow dragging only to the left (closing)
      if (newX <= 0) {
        translateX.value = Math.max(newX, -DRAWER_WIDTH);
      }
    })
    .onEnd((event) => {
      if (event.velocityX < -500 || translateX.value < -DRAWER_WIDTH / 3) {
        // Close
        translateX.value = withTiming(-DRAWER_WIDTH, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        runOnJS(onClose)();
      } else {
        // Snap back to open
        translateX.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
      }
    });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-DRAWER_WIDTH, 0],
      [0, 0.5],
      Extrapolation.CLAMP
    ),
    pointerEvents: isOpen ? 'auto' : 'none',
  }));

  const handleNavigation = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      {/* Drawer */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.drawer, drawerStyle, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                <Image
                  source={avatarUri ? { uri: avatarUri } : require('../assets/images/shopkeeper_avatar.png')}
                  style={{ width: '100%', height: '100%', borderRadius: 25 }}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{name}</Text>
                <Text style={styles.profileEmail}>{email || 'No email'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Shop Settings */}
            <Text style={styles.sectionTitle}>Shop Settings</Text>
            <View style={styles.sectionCard}>
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                activeOpacity={0.7}
                onPress={() => handleNavigation('/settings')}
              >
                <View style={[styles.menuIcon, { backgroundColor: Colors.scanBlue }]}>
                  <Store size={18} color={Colors.scanBlueDark} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Shop Profile</Text>
                  <Text style={styles.menuSubtitle}>{shopName}</Text>
                </View>
                <ChevronRight size={18} color={Colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                activeOpacity={0.7}
                onPress={() => setShowLanguageOptions(!showLanguageOptions)}
              >
                <View style={[styles.menuIcon, { backgroundColor: Colors.trackGreen }]}>
                  <Globe size={18} color={Colors.trackGreenDark} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Language</Text>
                  <Text style={styles.menuSubtitle}>
                    {languages.find(l => l.id === selectedLanguage)?.label} / {languages.find(l => l.id === selectedLanguage)?.sub}
                  </Text>
                </View>
                <ChevronRight
                  size={18}
                  color={Colors.textTertiary}
                  style={{ transform: [{ rotate: showLanguageOptions ? '90deg' : '0deg' }] }}
                />
              </TouchableOpacity>

              {showLanguageOptions && (
                <View style={styles.languageList}>
                  {languages.map((lang) => (
                    <TouchableOpacity
                      key={lang.id}
                      style={[
                        styles.languageItem,
                        selectedLanguage === lang.id && styles.languageItemActive
                      ]}
                      onPress={() => {
                        setSelectedLanguage(lang.id as any);
                        setShowLanguageOptions(false);
                      }}
                    >
                      <View>
                        <Text style={[
                          styles.languageLabel,
                          selectedLanguage === lang.id && styles.languageLabelActive
                        ]}>
                          {lang.label}
                        </Text>
                        <Text style={styles.languageSub}>{lang.sub}</Text>
                      </View>
                      {selectedLanguage === lang.id && (
                        <Check size={16} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.menuItem}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.askYellow }]}>
                  <Moon size={18} color={Colors.askYellowDark} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Dark Mode</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#FFF"
                />
              </View>
            </View>



            {/* Support */}
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.sectionCard}>
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemBorder]}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceVariant }]}>
                  <HelpCircle size={18} color={Colors.textSecondary} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Help & FAQ</Text>
                </View>
                <ChevronRight size={18} color={Colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.surfaceVariant }]}>
                  <Shield size={18} color={Colors.textSecondary} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>Privacy Policy</Text>
                </View>
                <ChevronRight size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>


          {/* Sticky Footer */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <TouchableOpacity
              style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
              activeOpacity={0.7}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              <LogOut size={18} color={Colors.error} />
              <Text style={styles.logoutText}>{isLoggingOut ? 'Logging out...' : 'Log Out'}</Text>
            </TouchableOpacity>
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>
        </Animated.View>
      </GestureDetector >
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 100,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.background,
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  profileEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${Colors.error}10`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,

    borderWidth: 1,
    borderColor: `${Colors.error}30`,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: Spacing.lg,
  },
  languageList: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.border}50`,
  },
  languageItemActive: {
    backgroundColor: `${Colors.primary}08`,
  },
  languageLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  languageLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  languageSub: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
});
