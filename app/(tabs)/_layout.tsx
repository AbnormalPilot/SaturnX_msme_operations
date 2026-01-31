import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
import AIBottomSheetGlass from "../../components/AIBottomSheetGlass";
import { SheetProvider, useSheet } from "../../context/SheetContext";

function TabsNavigator() {
  const { translateY, openSheet, closeSheet, isSheetOpen } = useSheet();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="inventory" options={{ href: null }} />
        <Tabs.Screen name="sales" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
      </Tabs>
      <AIBottomSheetGlass
        isVisible={isSheetOpen}
        translateY={translateY}
        onOpen={openSheet}
        onClose={closeSheet}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <SheetProvider>
      <TabsNavigator />
    </SheetProvider>
  );
}
