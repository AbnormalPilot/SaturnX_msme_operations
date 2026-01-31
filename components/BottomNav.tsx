import { usePathname, useRouter } from "expo-router";
import { FileText, Home, Package, TrendingUp } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "../constants/theme";

interface BottomNavProps {
  onAiPress?: () => void;
}

export default function BottomNav({ onAiPress }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isActive = (route: string) => {
    if (route === "/" && pathname === "/") return true;
    if (route !== "/" && pathname.startsWith(route)) return true;
    return false;
  };

  const NavButton = ({
    icon: Icon,
    route,
    label,
  }: {
    icon: typeof Home;
    route: string;
    label: string;
  }) => {
    const active = isActive(route);
    return (
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => router.push(route as any)}
        activeOpacity={0.7}
      >
        <Icon
          size={24}
          color={active ? Colors.primary : Colors.textTertiary}
          strokeWidth={active ? 2.5 : 2}
        />
        <Text
          style={[
            styles.navLabel,
            { color: active ? Colors.primary : Colors.textTertiary },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      {/* Left side buttons */}
      <View style={styles.sideGroup}>
        <NavButton icon={Home} route="/" label="Home" />
        <NavButton icon={FileText} route="/create" label="Billing" />
      </View>

      {/* Center FAB - AI Trigger */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          onPress={onAiPress}
          activeOpacity={0.9}
          style={styles.fabWrapper}
        >
          <View style={styles.fab}>
            {/* 3D Effect Layers */}
            <View style={styles.fabHighlight} />
            <Image
              source={require("../assets/icon.png")}
              style={{ width: 56, height: 56, borderRadius: 28 }}
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>
        <Text style={styles.aiLabel}>AI</Text>
      </View>

      {/* Right side buttons */}
      <View style={styles.sideGroup}>
        <NavButton icon={Package} route="/inventory" label="Stock" />
        <NavButton icon={TrendingUp} route="/sales" label="Profit" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    paddingHorizontal: 16,
    zIndex: 90,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  sideGroup: {
    flexDirection: "row",
    gap: 24,
    alignItems: "center",
  },
  navButton: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  fabContainer: {
    alignItems: "center",
    marginTop: -40, // Push it up
  },
  fabWrapper: {
    // 3D Shadow attempt
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 4,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: Colors.surface, // To blend with background if needed
    overflow: "hidden",
  },
  fabHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    zIndex: 1,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
  },
});
