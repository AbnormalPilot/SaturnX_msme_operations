import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Bell,
    ChevronRight,
    CreditCard,
    Globe,
    HelpCircle,
    LogOut,
    Moon,
    Shield,
    Store,
    X,
} from "lucide-react-native";
import React from "react";
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { IconButton, Text } from "react-native-paper";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BottomNav from "../../components/BottomNav";
import { BorderRadius, Colors, Spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";
import { useSheet } from "../../context/SheetContext";
import { useUserStore } from "../../store/useUserStore";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openSheet } = useSheet();
  const { signOut } = useAuth();
  const {
    name,
    email,
    shopName,
    avatarUri,
    upiId,
    setUpiId,
    resetOnboarding,
    showCP,
    toggleShowCP,
  } = useUserStore();
  const [darkMode, setDarkMode] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // UPI Edit State
  const [showUpiModal, setShowUpiModal] = React.useState(false);
  const [tempUpiId, setTempUpiId] = React.useState("");

  // Shop Profile Edit State
  const [showShopModal, setShowShopModal] = React.useState(false);
  const [tempShopName, setTempShopName] = React.useState("");

  // Language Selection State
  const [showLanguageModal, setShowLanguageModal] = React.useState(false);

  const handleEditProfile = () => {
    Alert.alert(
      "Edit Profile",
      "Profile editing will be available in the next update. You can currently edit your shop profile and payment settings.",
      [{ text: "OK" }]
    );
  };

  const handleEditShop = () => {
    setTempShopName(shopName || "");
    setShowShopModal(true);
  };

  const saveShopName = () => {
    if (tempShopName.trim()) {
      useUserStore.getState().setShopName(tempShopName.trim());
      setShowShopModal(false);
    } else {
      Alert.alert("Error", "Shop name cannot be empty");
    }
  };

  const handleLanguageSelect = (language: string) => {
    setShowLanguageModal(false);
    Alert.alert(
      "Language Changed",
      `Language will be set to ${language} in the next update.`,
      [{ text: "OK" }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      "Help & FAQ",
      "Need help? Contact us at:\n\nEmail: support@vyapar.com\nPhone: +91-XXXX-XXXXXX\n\nFAQ section coming soon!",
      [{ text: "OK" }]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      "Privacy Policy",
      "We respect your privacy. Your data is stored securely and never shared with third parties.\n\nFull privacy policy coming soon.",
      [{ text: "OK" }]
    );
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await signOut();
            resetOnboarding();
            router.replace("/(auth)/login");
          } catch (error) {
            Alert.alert("Error", "Failed to log out. Please try again.");
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleEditUpi = () => {
    setTempUpiId(upiId);
    setShowUpiModal(true);
  };

  const saveUpiId = () => {
    setUpiId(tempUpiId);
    setShowUpiModal(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 44 }} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {name ? name.charAt(0).toUpperCase() : "U"}
                </Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{name || "User"}</Text>
              <Text style={styles.profileSubtitle}>
                {email || "Shop Owner"}
              </Text>
            </View>
            <TouchableOpacity style={styles.editBtn} activeOpacity={0.7} onPress={handleEditProfile}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Shop Settings */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.groupTitle}>Shop Settings</Text>
          <View style={styles.groupCard}>
            <TouchableOpacity
              style={[styles.settingItem, styles.settingBorder]}
              activeOpacity={0.7}
              onPress={handleEditShop}
            >
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: Colors.scanBlue },
                ]}
              >
                <Store size={18} color={Colors.scanBlueDark} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Shop Profile</Text>
                <Text style={styles.settingSubtitle}>
                  {shopName || "Tap to set shop name"}
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.settingItem, styles.settingBorder]}
              activeOpacity={0.7}
              onPress={() => setShowLanguageModal(true)}
            >
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: Colors.trackGreen },
                ]}
              >
                <Globe size={18} color={Colors.trackGreenDark} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Language</Text>
                <Text style={styles.settingSubtitle}>English / हिंदी</Text>
              </View>
              <ChevronRight size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
            <View style={styles.settingItem}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: Colors.askYellow },
                ]}
              >
                <Moon size={18} color={Colors.askYellowDark} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </Animated.View>

        {/* Payment Settings */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Text style={styles.groupTitle}>Payments</Text>
          <View style={styles.groupCard}>
            <TouchableOpacity
              style={styles.settingItem}
              activeOpacity={0.7}
              onPress={handleEditUpi}
            >
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: Colors.primary },
                ]}
              >
                <CreditCard size={18} color="#FFF" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>UPI ID</Text>
                <Text style={styles.settingSubtitle}>
                  {upiId || "Tap to set UPI ID"}
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Inventory Settings */}
        <Animated.View entering={FadeInDown.delay(280).duration(400)}>
          <Text style={styles.groupTitle}>Inventory</Text>
          <View style={styles.groupCard}>
            <View style={styles.settingItem}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: Colors.surfaceVariant },
                ]}
              >
                <Shield size={18} color={Colors.textSecondary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Show Cost Price (CP)</Text>
                <Text style={styles.settingSubtitle}>
                  Show CP in inventory list
                </Text>
              </View>
              <Switch
                value={showCP}
                onValueChange={toggleShowCP}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </Animated.View>

        {/* Notifications */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.groupTitle}>Notifications</Text>
          <View style={styles.groupCard}>
            <View style={styles.settingItem}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: `${Colors.error}15` },
                ]}
              >
                <Bell size={18} color={Colors.error} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </Animated.View>

        {/* Support */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={styles.groupTitle}>Support</Text>
          <View style={styles.groupCard}>
            <TouchableOpacity
              style={[styles.settingItem, styles.settingBorder]}
              activeOpacity={0.7}
              onPress={handleHelp}
            >
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: Colors.surfaceVariant },
                ]}
              >
                <HelpCircle size={18} color={Colors.textSecondary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Help & FAQ</Text>
              </View>
              <ChevronRight size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7} onPress={handlePrivacyPolicy}>
              <View
                style={[
                  styles.settingIcon,
                  { backgroundColor: Colors.surfaceVariant },
                ]}
              >
                <Shield size={18} color={Colors.textSecondary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>Privacy Policy</Text>
              </View>
              <ChevronRight size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <TouchableOpacity
            style={[styles.logoutBtn, isLoggingOut && styles.logoutBtnDisabled]}
            activeOpacity={0.7}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut size={18} color={Colors.error} />
            <Text style={styles.logoutText}>
              {isLoggingOut ? "Logging out..." : "Log Out"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.version}>Version 1.0.0</Text>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Nav */}
      <BottomNav onAiPress={openSheet} />

      {/* UPI Edit Modal */}
      <Modal
        visible={showUpiModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set UPI ID</Text>
              <IconButton
                icon={() => <X size={24} color={Colors.text} />}
                onPress={() => setShowUpiModal(false)}
              />
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.label}>Enter your UPI ID</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. shopname@upi"
                value={tempUpiId}
                onChangeText={setTempUpiId}
                autoCapitalize="none"
                autoFocus
              />
              <Text style={styles.helperText}>
                This will be used to generate QR codes for receiving payments.
              </Text>

              <TouchableOpacity style={styles.primaryBtn} onPress={saveUpiId}>
                <Text style={styles.primaryBtnText}>Save UPI ID</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Shop Profile Edit Modal */}
      <Modal
        visible={showShopModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShopModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Shop Profile</Text>
              <IconButton
                icon={() => <X size={24} color={Colors.text} />}
                onPress={() => setShowShopModal(false)}
              />
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.label}>Shop Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. My Store"
                value={tempShopName}
                onChangeText={setTempShopName}
                autoFocus
              />
              <Text style={styles.helperText}>
                This name will appear on invoices and reports.
              </Text>

              <TouchableOpacity style={styles.primaryBtn} onPress={saveShopName}>
                <Text style={styles.primaryBtnText}>Save Shop Name</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <IconButton
                icon={() => <X size={24} color={Colors.text} />}
                onPress={() => setShowLanguageModal(false)}
              />
            </View>

            <View style={styles.formContainer}>
              <TouchableOpacity
                style={[styles.languageOption, styles.languageOptionBorder]}
                onPress={() => handleLanguageSelect("English")}
              >
                <Text style={styles.languageText}>English</Text>
                <ChevronRight size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.languageOption}
                onPress={() => handleLanguageSelect("हिंदी (Hindi)")}
              >
                <Text style={styles.languageText}>हिंदी (Hindi)</Text>
                <ChevronRight size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  profileSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  editBtn: {
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  groupCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
  },
  settingSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: `${Colors.error}10`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.error,
  },
  logoutBtnDisabled: {
    opacity: 0.6,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: Colors.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  formContainer: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 8,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
  },
  languageOptionBorder: {
    marginBottom: Spacing.sm,
  },
  languageText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
  },
});
