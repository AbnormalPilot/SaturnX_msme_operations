import React, { createContext, useCallback, useContext } from "react";
import { Dimensions } from "react-native";
import {
    Easing,
    SharedValue,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SNAP_POINT = -SCREEN_HEIGHT; // Full screen

interface SheetContextType {
  openSheet: () => void;
  closeSheet: () => void;
  toggleSheet: () => void;
  translateY: SharedValue<number>;
  isSheetOpen: boolean;
}

const SheetContext = createContext<SheetContextType | undefined>(undefined);

export function SheetProvider({ children }: { children: React.ReactNode }) {
  const translateY = useSharedValue(0);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const openSheet = useCallback(() => {
    setIsSheetOpen(true);
    translateY.value = withTiming(SNAP_POINT, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    translateY.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const toggleSheet = useCallback(() => {
    if (isSheetOpen) {
      closeSheet();
    } else {
      openSheet();
    }
  }, [closeSheet, openSheet, isSheetOpen]);

  return (
    <SheetContext.Provider
      value={{ openSheet, closeSheet, toggleSheet, translateY, isSheetOpen }}
    >
      {children}
    </SheetContext.Provider>
  );
}

export function useSheet() {
  const context = useContext(SheetContext);
  if (context === undefined) {
    throw new Error("useSheet must be used within a SheetProvider");
  }
  return context;
}
