import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
    Camera,
    ChevronRight,
    Image as ImageIcon,
    Package,
    Plus,
    ScanLine,
    Search,
    Trash2,
    Wand2,
    X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Text } from "react-native-paper";
import Animated, {
    Easing,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScaleButton from "../../components/Animated/ScaleButton";
import { BorderRadius, Colors, Spacing } from "../../constants/theme";
import { useSheet } from "../../context/SheetContext";
import { Product, useProducts, useProductMutations } from "../../hooks/queries/useProducts";
import { useProductsRealtime } from "../../hooks/queries/useProductsRealtime";
import { useUserStore } from "../../store/useUserStore";

const AI_MESSAGES = [
  "Add items using AI camera",
  "Generate stock reports via AI",
  "Fill inventory using AI voice",
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
          <Wand2 size={24} color="#FFF" />
        </View>
        <View style={styles.aiHeroContent}>
          <Animated.Text style={[styles.aiHeroText, animatedStyle]}>
            {AI_MESSAGES[index]}
          </Animated.Text>
          <Text style={styles.aiHeroSubtitle}>Powered by BusinessAI</Text>
        </View>
        <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
      </LinearGradient>
    </ScaleButton>
  );
};

export default function InventoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { openSheet } = useSheet();
  const { showCP } = useUserStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"All" | "Low Stock">("All");

  // TanStack Query hooks
  const { data: products = [], isLoading, error, refetch, userId } = useProducts({
    search: searchQuery,
    low_stock_only: filter === "Low Stock",
  });
  const { createProduct, updateProduct, deleteProduct: deleteProductMutation } = useProductMutations();

  // Enable real-time subscriptions
  useProductsRealtime(userId);

  // Add Product State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [newMRP, setNewMRP] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newBarcode, setNewBarcode] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  // Auto-extract image from internet when name changes
  useEffect(() => {
    if (newName.length > 2 && !newImage) {
      setIsExtracting(true);
      const timer = setTimeout(() => {
        setIsExtracting(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [newName]);

  // Handle barcode from scanner (when adding new product from unknown barcode)
  useEffect(() => {
    if (params.addBarcode && typeof params.addBarcode === 'string') {
      setNewBarcode(params.addBarcode);
      setIsAddModalOpen(true);
      // Clear the param after handling
      router.setParams({ addBarcode: undefined });
    }
  }, [params.addBarcode]);

  // Handle scanned barcode (when manually scanning from Add Product modal)
  useEffect(() => {
    if (params.scannedBarcode && typeof params.scannedBarcode === 'string') {
      setNewBarcode(params.scannedBarcode);
      // Clear the param after handling
      router.setParams({ scannedBarcode: undefined });
    }
  }, [params.scannedBarcode]);
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow camera access to take product photos.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewImage(result.assets[0].uri);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to remove "${name}" from inventory?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteProductMutation.mutate(id),
        },
      ],
    );
  };

  const lowStockCount = products.filter(
    (p) => p.quantity <= p.low_stock_threshold,
  ).length;

  const handleAddProduct = () => {
    if (!newName || !newCostPrice || !newMRP || !newQty) {
      Alert.alert("Missing Fields", "Please fill all fields.");
      return;
    }

    createProduct.mutate(
      {
        name: newName,
        hindi_name: newName, // Auto-fill for now
        category: "General",
        price: parseFloat(newPrice || newMRP), // Default Selling Price to Price
        cost_price: parseFloat(newCostPrice),
        mrp: parseFloat(newMRP),
        quantity: parseInt(newQty),
        low_stock_threshold: 10,
        image: newImage || "https://via.placeholder.com/150", // Use manual image or placeholder for AI to fill
        barcode: newBarcode || undefined,
      },
      {
        onSuccess: () => {
          setIsAddModalOpen(false);
          setNewName("");
          setNewPrice("");
          setNewCostPrice("");
          setNewMRP("");
          setNewQty("");
          setNewBarcode("");
          setNewImage(null);
          Alert.alert("Success", "Product added successfully!");
        },
        onError: (error: any) => {
          Alert.alert("Error", error.message || "Failed to add product");
        },
      }
    );
  };

  const renderItem = ({ item, index }: { item: Product; index: number }) => {
    const isLowStock = item.quantity <= item.low_stock_threshold;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 80)
          .springify()
          .damping(12)}
      >
        <View style={styles.productCard}>
          <View style={styles.productImage}>
            {item.image ? (
              <Image
                source={{ uri: item.image } as any}
                style={styles.productImageActual}
                resizeMode="cover"
              />
            ) : (
              <Package
                size={24}
                color={isLowStock ? Colors.error : Colors.primary}
              />
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            {item.barcode && (
              <Text style={styles.barcodeText}>#{item.barcode}</Text>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.productPrice}>Price: ₹{item.mrp}</Text>
            </View>
            <View style={styles.productMeta}>
              <View
                style={[styles.stockBadge, isLowStock && styles.stockBadgeLow]}
              >
                <Text
                  style={[styles.stockText, isLowStock && styles.stockTextLow]}
                >
                  {item.quantity} units
                </Text>
              </View>
              {showCP && (
                <Text style={styles.hiddenCP}>CP: ₹{item.cost_price}</Text>
              )}
            </View>
          </View>

          <View style={styles.actionContainer}>
            <ScaleButton
              onPress={() => handleDelete(item.id, item.name)}
              style={styles.deleteBtn}
            >
              <Trash2 size={24} color={Colors.textTertiary} />
            </ScaleButton>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={{ height: insets.top }} />

      {/* Search Bar */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.searchContainer}
      >
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => router.push("/scanner")}
        >
          <ScanLine size={20} color="#FFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Filter Chips */}
      <Animated.View
        entering={FadeInDown.delay(150).duration(400)}
        style={styles.filterRow}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            filter === "All" && styles.filterChipActive,
          ]}
          onPress={() => setFilter("All")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "All" && styles.filterTextActive,
            ]}
          >
            All Items
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filter === "Low Stock" && styles.filterChipActive,
          ]}
          onPress={() => setFilter("Low Stock")}
        >
          <Text
            style={[
              styles.filterText,
              filter === "Low Stock" && styles.filterTextActive,
            ]}
          >
            Low Stock
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Product List */}
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isLoading}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Package size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>
              {isLoading ? "Loading..." : error ? "Error loading products" : "No products found"}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsAddModalOpen(true)}
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Sticky AI Hero Bar at Bottom */}
      <Animated.View
        style={[styles.stickyAiContainer, { bottom: insets.bottom + 20 }]}
        entering={FadeInDown.delay(100).duration(500)}
      >
        <AIHeroBar onPress={openSheet} />
      </Animated.View>

      {/* Add Product Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddModalOpen}
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Product</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.imagePickerContainer}>
                {newImage ? (
                  <TouchableOpacity
                    onPress={handlePickImage}
                    style={styles.pickedImageWrapper}
                  >
                    <Image
                      source={{ uri: newImage } as any}
                      style={styles.pickedImage}
                    />
                    <View style={styles.changeImageBadge}>
                      <Camera size={14} color="#FFF" />
                    </View>
                  </TouchableOpacity>
                ) : newName.length > 2 ? (
                  <View style={styles.extractionPreview}>
                    <Image
                      source={
                        {
                          uri: `https://tse1.mm.bing.net/th?q=${encodeURIComponent(newName.toLowerCase() + " product package")}&w=400&h=400&c=7&rs=1&p=0&dpr=2&pid=1.7&mkt=en-IN&adlt=moderate`,
                        } as any
                      }
                      style={styles.extractedImage}
                    />
                    <View style={styles.extractionBadge}>
                      <Wand2 size={12} color="#FFF" />
                      <Text style={styles.extractionBadgeText}>
                        Internet Extracted
                      </Text>
                    </View>
                    <View style={styles.extractionOverlay}>
                      <TouchableOpacity
                        style={styles.miniOptionBtn}
                        onPress={handleCamera}
                      >
                        <Camera size={16} color="#FFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.miniOptionBtn}
                        onPress={handlePickImage}
                      >
                        <ImageIcon size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imageOptions}>
                    <TouchableOpacity
                      style={styles.imageOptionBtn}
                      onPress={handleCamera}
                    >
                      <Camera size={24} color={Colors.primary} />
                      <Text style={styles.imageOptionText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.imageOptionBtn}
                      onPress={handlePickImage}
                    >
                      <ImageIcon size={24} color={Colors.primary} />
                      <Text style={styles.imageOptionText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Text style={styles.label}>Product Name</Text>
              <TextInput
                style={styles.input}
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Parle-G"
              />

              <Text style={styles.label}>Barcode (Optional)</Text>
              <View style={styles.barcodeInputContainer}>
                <TextInput
                  style={[styles.input, styles.barcodeInput]}
                  value={newBarcode}
                  onChangeText={setNewBarcode}
                  placeholder="Scan or enter barcode"
                />
                <TouchableOpacity
                  style={styles.scanBarcodeButton}
                  onPress={() => router.push({
                    pathname: "/scanner",
                    params: { returnTo: "inventory" }
                  })}
                >
                  <ScanLine size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Price (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={newMRP}
                    onChangeText={setNewMRP}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Cost Price (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={newCostPrice}
                    onChangeText={setNewCostPrice}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={newQty}
                onChangeText={setNewQty}
                placeholder="0"
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAddProduct}
              >
                <Text style={styles.saveBtnText}>Save Product</Text>
              </TouchableOpacity>
            </ScrollView>
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
    paddingTop: 20,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scanButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    marginLeft: Spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFF",
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 180,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    overflow: "hidden",
  },
  productImageActual: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  barcodeText: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.primary,
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.surfaceVariant,
    alignSelf: "flex-start",
  },
  stockBadgeLow: {
    backgroundColor: "transparent",
  },
  stockText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  stockTextLow: {
    color: Colors.error,
  },
  actionContainer: {
    alignItems: "flex-end",
    gap: 8,
  },
  alertBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
  },
  fab: {
    position: "absolute",
    bottom: 120,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  formContent: {
    paddingBottom: Spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  barcodeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barcodeInput: {
    flex: 1,
  },
  scanBarcodeButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  aiHeroBarWrapper: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  aiHeroBarGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  aiHeroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  aiHeroContent: {
    flex: 1,
  },
  aiHeroText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  aiHeroSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  stickyAiContainer: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  hiddenCP: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: "bold",
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  imagePickerContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  pickedImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  pickedImage: {
    width: "100%",
    height: "100%",
  },
  changeImageBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  imageOptions: {
    flexDirection: "row",
    gap: 20,
  },
  imageOptionBtn: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  imageOptionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    fontWeight: "600",
  },
  extractionPreview: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  extractedImage: {
    width: "100%",
    height: "100%",
  },
  extractionBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  extractionBadgeText: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  extractionOverlay: {
    position: "absolute",
    bottom: 6,
    right: 6,
    flexDirection: "row",
    gap: 6,
  },
  miniOptionBtn: {
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.background,
  },
});
