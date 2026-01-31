import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    BarChart3,
    Box,
    Calculator,
    ChevronRight,
    FileText,
    Home,
    Maximize2,
    Wand2,
    Zap,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScaleButton from "../../components/Animated/ScaleButton";
import BusinessStats from "../../components/BusinessStats";
import MoneyManagerSummary from "../../components/MoneyManager/MoneyManagerSummary";
import SettingsDrawer, { DRAWER_WIDTH } from "../../components/SettingsDrawer";
import {
    BorderRadius,
    Colors,
    Spacing,
    Typography,
} from "../../constants/theme";
import { useSheet } from "../../context/SheetContext";
import { useCustomerMutations } from "../../hooks/queries/useCustomers";
import { useUserStore } from "../../store/useUserStore";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const AI_MESSAGES = [
  "Start chatting with AI",
  "Generate bills using AI",
  "Fill the inventory via AI",
];

const AIHeroBar = ({ onPress }: { onPress: () => void }) => {
  const [index, setIndex] = useState(0);
  const fadeAnim = useSharedValue(1);

  React.useEffect(() => {
    const interval = setInterval(() => {
      fadeAnim.value = withSequence(
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      );
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % AI_MESSAGES.length);
      }, 600);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: (1 - fadeAnim.value) * 5 }],
  }));

  return (
    <ScaleButton onPress={onPress} style={styles.aiHeroBarWrapper}>
      <LinearGradient
        colors={["#008080", "#004d4d", "#002b2b"]} // Deep Teal to Ocean
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.aiHeroBarGradient}
      >
        <View style={styles.aiHeroIconContainer}>
          <Wand2 size={22} color="white" strokeWidth={2.5} />
        </View>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <Text style={styles.aiHeroBarText}>{AI_MESSAGES[index]}</Text>
        </Animated.View>
        <View style={styles.aiHeroBarAction}>
          <Text style={styles.aiHeroBarActionText}>Open AI</Text>
          <ChevronRight size={16} color="rgba(255,255,255,0.8)" />
        </View>
      </LinearGradient>
    </ScaleButton>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openSheet } = useSheet();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { name: ownerName, avatarUri } = useUserStore();

  const [activeTab, setActiveTab] = useState<"customer" | "supplier">(
    "customer",
  );

  // Drawer Logic
  const drawerTranslateX = useSharedValue(-DRAWER_WIDTH);
  const drawerContext = useSharedValue({ x: 0 });

  const sideDrawerGesture = Gesture.Pan()
    .activeOffsetX(20)
    .failOffsetY([-20, 20])
    .onStart(() => {
      drawerContext.value = { x: drawerTranslateX.value };
    })
    .onUpdate((event) => {
      const newX = event.translationX + drawerContext.value.x;
      drawerTranslateX.value = Math.max(Math.min(newX, 0), -DRAWER_WIDTH);
    })
    .onEnd((event) => {
      if (event.velocityX > 500 || drawerTranslateX.value > -DRAWER_WIDTH / 2) {
        // Open
        drawerTranslateX.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        runOnJS(setIsSettingsOpen)(true);
      } else {
        // Close
        drawerTranslateX.value = withTiming(-DRAWER_WIDTH, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        runOnJS(setIsSettingsOpen)(false);
      }
    });

  // Floating animation for AI Bar
  const floatingY = useSharedValue(0);

  React.useEffect(() => {
    floatingY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingY.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Global Gesture Handler */}
      <GestureDetector gesture={sideDrawerGesture}>
        <Animated.View style={styles.gestureContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingTop: insets.top + Spacing.md, paddingBottom: 220 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.header}
            >
              <ScaleButton onPress={() => router.push("/settings")}>
                <Image
                  source={
                    avatarUri
                      ? { uri: avatarUri }
                      : require("../../assets/images/shopkeeper_avatar.png")
                  }
                  style={styles.avatarImage}
                />
              </ScaleButton>

              <View style={styles.headerCenter}>
                <Text style={[styles.ownerName, Typography.h2]}>BusinessAI</Text>
              </View>

              <View style={styles.headerRight}>
                <ScaleButton>
                  <View style={styles.iconButton}>
                    <Home size={24} color={Colors.text} />
                  </View>
                </ScaleButton>

                <ScaleButton onPress={() => router.push("/customers")}>
                  <View style={styles.iconButton}>
                    <Maximize2 size={24} color={Colors.text} />
                  </View>
                </ScaleButton>
              </View>
            </Animated.View>

            {/* Money Manager Summary */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <MoneyManagerSummary />

              <ScaleButton
                style={styles.viewMoreButton}
                onPress={() =>
                  router.push({
                    pathname: "/customers",
                    params: { type: "customer" }, // Defaulting to customer
                  })
                }
              >
                <Text style={styles.viewMoreText}>View More</Text>
                <ChevronRight size={14} color={Colors.primary} />
              </ScaleButton>
            </Animated.View>

            {/* Business Stats */}
            <BusinessStats />

            {/* Action Cards (Inventory & Dashboard) */}
            <View style={styles.actionGrid}>
              <Animated.View
                entering={FadeInDown.delay(200).duration(600)}
                style={{ flex: 1 }}
              >
                <ScaleButton
                  style={styles.actionCardWrapper}
                  onPress={() => router.push("/inventory")}
                >
                  <LinearGradient
                    colors={["#FF9966", "#FF5E62"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Box
                      size={100}
                      color="rgba(255,255,255,0.15)"
                      style={styles.decorativeIcon}
                    />
                    <View style={styles.actionIconCircle}>
                      <Box size={32} color="#FF5E62" fill="white" />
                    </View>
                    <Text style={styles.actionCardTitle}>Inventory</Text>
                  </LinearGradient>
                </ScaleButton>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(300).duration(600)}
                style={{ flex: 1 }}
              >
                <ScaleButton
                  style={styles.actionCardWrapper}
                  onPress={() => router.push("/sales")}
                >
                  <LinearGradient
                    colors={["#56CCF2", "#2F80ED"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <BarChart3
                      size={100}
                      color="rgba(255,255,255,0.15)"
                      style={styles.decorativeIcon}
                    />
                    <View style={styles.actionIconCircle}>
                      <BarChart3 size={32} color="#2F80ED" fill="white" />
                    </View>
                    <Text style={styles.actionCardTitle}>Dashboard</Text>
                  </LinearGradient>
                </ScaleButton>
              </Animated.View>
            </View>

            {/* Tools Row: Digital Notes & Instant Invoice */}
            <View style={[styles.actionRow, { paddingBottom: Spacing.lg }]}>
              <Animated.View
                entering={FadeInDown.delay(400).duration(600)}
                style={{ flex: 1 }}
              >
                <ScaleButton
                  onPress={() => router.push("/notes" as any)}
                  style={styles.actionCardWrapper}
                >
                  <LinearGradient
                    colors={["#6FCF97", "#27AE60"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <FileText
                      size={100}
                      color="rgba(255,255,255,0.15)"
                      style={styles.decorativeIcon}
                    />
                    <View style={styles.actionIconCircle}>
                      <FileText size={32} color="#27AE60" fill="white" />
                    </View>
                    <Text style={styles.actionCardTitle}>Digital Notes</Text>
                  </LinearGradient>
                </ScaleButton>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(500).duration(600)}
                style={{ flex: 1 }}
              >
                <ScaleButton
                  onPress={() => router.push("/instant-invoice" as any)}
                  style={styles.actionCardWrapper}
                >
                  <LinearGradient
                    colors={["#F2994A", "#F2C94C"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionCard}
                  >
                    <Zap
                      size={100}
                      color="rgba(255,255,255,0.15)"
                      style={styles.decorativeIcon}
                    />
                    <View style={styles.actionIconCircle}>
                      <Zap size={32} color="#F2994A" fill="white" />
                    </View>
                    <Text style={styles.actionCardTitle}>Instant Invoice</Text>
                  </LinearGradient>
                </ScaleButton>
              </Animated.View>
            </View>

            {/* Start Billing - Classical Graphic Style */}
            <Animated.View
              entering={FadeInDown.delay(600).duration(600)}
              style={styles.billingSection}
            >
              <ScaleButton onPress={() => router.push("/create")}>
                <LinearGradient
                  colors={[Colors.primary, "#4a90e2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.billingButtonGradient}
                >
                  <View style={styles.billingIconCircle}>
                    <Calculator
                      size={24}
                      color={Colors.primary}
                      strokeWidth={2.5}
                    />
                  </View>
                  <View style={styles.billingTextContainer}>
                    <Text style={styles.billingButtonTitle}>Start Billing</Text>
                    <Text style={styles.billingButtonSubtitle}>
                      Quick & Easy Invoicing
                    </Text>
                  </View>
                  <ChevronRight size={24} color="white" opacity={0.6} />
                </LinearGradient>
              </ScaleButton>
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </GestureDetector>

      {/* Sticky AI Hero Bar at Bottom */}
      <Animated.View
        style={[
          styles.stickyAiContainer,
          { bottom: insets.bottom + Spacing.sm },
          floatingStyle,
        ]}
        entering={FadeInDown.delay(100).duration(500)}
      >
        <AIHeroBar onPress={openSheet} />
      </Animated.View>

      {/* Settings Drawer */}

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
        }}
        translateX={drawerTranslateX}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gestureContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    marginLeft: Spacing.md,
    alignItems: "center", // Center the title if needed, or keep left
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  ownerName: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },
  headerRight: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  // Action Grid
  actionGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionCardWrapper: {
    flex: 1,
    height: 130,
    borderRadius: BorderRadius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    justifyContent: "space-between",
  },
  actionIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  decorativeIcon: {
    position: "absolute",
    bottom: -20,
    right: -20,
    transform: [{ rotate: "15deg" }],
  },
  actionCardTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  actionCardSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "600",
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  activeTab: {
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.text,
    fontWeight: "600",
  },

  // View More
  viewMoreButton: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 4,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 20,
    gap: 4,
    marginBottom: Spacing.md,
  },
  viewMoreText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 12,
  },

  // AI Hero Bar
  stickyAiContainer: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 100,
  },
  aiHeroBarWrapper: {
    borderRadius: BorderRadius.xl,
    shadowColor: "#008080",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  aiHeroBarGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    height: 70,
  },
  aiHeroIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  aiHeroBarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  aiHeroBarAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  aiHeroBarActionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },

  // Billing Section
  billingSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  billingButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  billingIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  billingTextContainer: {
    flex: 1,
  },
  billingButtonTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },
  billingButtonSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "500",
  },
});
