import { BlurView } from "expo-blur";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Barcode,
    CreditCard,
    Image as ImageIcon,
    X,
    Zap,
    ZapOff,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    Alert,
    Dimensions,
    Linking,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../constants/theme";
import { useProducts } from "../hooks/queries/useProducts";

const { width, height } = Dimensions.get("window");
const SCAN_FRAME_SIZE = 280;

export default function ScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // TanStack Query hooks
  const { data: products = [] } = useProducts();

  const initialMode = params.mode === "payment" ? "Payment" : "Barcode";

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState<"Barcode" | "Payment">(initialMode as any);
  const [flash, setFlash] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Mock scan success since we can't easily decode static QR client-side
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setScanned(true);

        // Simulate processing
        setTimeout(() => {
          alert("Image selected from gallery!");
          setScanned(false);
          router.back();
        }, 500);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert("Failed to pick image");
    }
  };

  const handleModeChange = (newMode: "Barcode" | "Payment") => {
    if (mode !== newMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setMode(newMode);
      setScanned(false);
    }
  };

  const handleBarCodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned) return;

    // Haptic feedback on scan
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setScanned(true);

    if (mode === "Payment") {
      if (data.startsWith("upi://")) {
        Linking.openURL(data).catch(() => {
          alert(
            "Could not open payment app. Make sure a UPI app is installed.",
          );
        });
        router.back();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        alert("Invalid QR Code. Please scan a valid UPI QR.");
        setTimeout(() => setScanned(false), 2000);
      }
      return;
    }

    // Barcode Mode - Product Identification

    // Check if we're in "return mode" (scanning for another screen)
    if (params.returnTo === "inventory") {
      setScanned(false);
      router.push({
        pathname: "/(tabs)/inventory",
        params: { scannedBarcode: data },
      });
      return;
    }

    const product = products.find((p) => p.barcode === data);

    if (product) {
      Alert.alert(
        "Product Found",
        `Name: ${product.name}\nPrice: ₹${product.price}\nStock: ${product.quantity} units`,
        [
          {
            text: "OK",
            onPress: () => {
              setScanned(false);
              router.back();
            },
          },
        ]
      );
    } else if (data.startsWith("http")) {
      Linking.openURL(data);
      setTimeout(() => {
        setScanned(false);
        router.back();
      }, 1500);
    } else {
      // Unknown barcode - offer to add to inventory
      Alert.alert(
        "Product Not Found",
        `Barcode: ${data}\n\nThis product is not in your inventory. Would you like to add it?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              setScanned(false);
              router.back();
            },
          },
          {
            text: "Add to Inventory",
            onPress: () => {
              setScanned(false);
              router.push({
                pathname: "/(tabs)/inventory",
                params: { addBarcode: data },
              });
            },
          },
        ]
      );
    }
  };

  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash(!flash);
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: "#FFF", marginBottom: 20 }}>
          Camera access is required
        </Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={flash}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {/* Immersive Overlay - positioned absolutely over camera */}
      <View style={styles.overlay}>
        <View style={styles.maskRow} />
        <View style={styles.maskCenterRow}>
          <View style={styles.maskSide} />
          <View style={styles.scanWindow}>
            {/* Thick White Box Corners */}
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
          <View style={styles.maskSide} />
        </View>
        <View style={styles.maskRow} />

        {/* UI Layer */}
        <View
          style={[
            styles.uiLayer,
            { paddingTop: insets.top, paddingBottom: insets.bottom + 20 },
          ]}
        >
          {/* Header Controls */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.back()}
            >
              <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
                <X color="#FFF" size={24} />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={toggleFlash}>
              <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
                {flash ? (
                  <Zap
                    color={Colors.askYellow}
                    size={24}
                    fill={Colors.askYellow}
                  />
                ) : (
                  <ZapOff color="#FFF" size={24} />
                )}
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Hint Text */}
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>
              {mode === "Payment"
                ? "Scan any UPI QR Code to pay"
                : params.returnTo === "inventory"
                ? "Scan barcode to add to product form"
                : "Align barcode within the frame"}
            </Text>
          </View>

          {/* Bottom Controls */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <ImageIcon color="#FFF" size={24} />
            </TouchableOpacity>

            {/* Mode Switcher */}
            <BlurView intensity={40} tint="dark" style={styles.modeSwitch}>
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  mode === "Barcode" && styles.activeMode,
                ]}
                onPress={() => handleModeChange("Barcode")}
              >
                <Barcode
                  color={mode === "Barcode" ? "#000" : "#FFF"}
                  size={20}
                />
                {mode === "Barcode" && (
                  <Text style={styles.activeModeText}>Barcode</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeOption,
                  mode === "Payment" && styles.activeMode,
                ]}
                onPress={() => handleModeChange("Payment")}
              >
                <CreditCard
                  color={mode === "Payment" ? "#000" : "#FFF"}
                  size={20}
                />
                {mode === "Payment" && (
                  <Text style={styles.activeModeText}>Pay</Text>
                )}
              </TouchableOpacity>
            </BlurView>

            {/* Spacer for symmetry since we removed the 3rd mode */}
            <View style={{ width: 50 }} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  // Mask System
  maskRow: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  maskCenterRow: {
    height: SCAN_FRAME_SIZE,
    flexDirection: "row",
  },
  maskSide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  // Scan Window
  scanWindow: {
    width: SCAN_FRAME_SIZE,
    height: SCAN_FRAME_SIZE,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  uiLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  blurContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Corners - Updated to white and thicker
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 6,
    borderLeftWidth: 6,
    borderColor: "#FFF",
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 6,
    borderRightWidth: 6,
    borderColor: "#FFF",
    borderTopRightRadius: 16,
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 6,
    borderLeftWidth: 6,
    borderColor: "#FFF",
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 6,
    borderRightWidth: 6,
    borderColor: "#FFF",
    borderBottomRightRadius: 16,
  },

  // Hints
  hintContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  hintText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginTop: 20,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
    fontWeight: "500",
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modeSwitch: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 30,
    padding: 4,
    overflow: "hidden",
    height: 56,
    alignItems: "center",
  },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 6,
  },
  activeMode: {
    backgroundColor: "#FFF",
  },
  activeModeText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 13,
  },

  permButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
  },
  permButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
