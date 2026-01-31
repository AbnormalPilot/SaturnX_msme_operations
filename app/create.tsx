import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Minus,
    Package,
    Plus,
    Search
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Modal,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Text } from "react-native-paper";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Spacing } from "../constants/theme";
import { useCartStore } from "../store/useCartStore";
import { Product, useProducts } from "../hooks/queries/useProducts";
import { useProductsRealtime } from "../hooks/queries/useProductsRealtime";
import { useInvoiceMutations } from "../hooks/queries/useInvoices";
import { useUserStore } from "../store/useUserStore";
import { generateInvoicePDF, shareInvoicePDF } from "../utils/pdf/PDFService";

export default function CreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { shopName } = useUserStore();

  // TanStack Query hooks
  const [searchQuery, setSearchQuery] = useState("");
  const { data: products = [], isLoading, refetch, userId } = useProducts({
    search: searchQuery,
  });
  const { createInvoice } = useInvoiceMutations();

  // Enable real-time subscriptions
  useProductsRealtime(userId);

  const {
    items,
    addToCart,
    removeFromCart,
    decreaseQuantity,
    getTotal,
    clearCart,
  } = useCartStore();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const filteredProducts = products;

  const cartTotal = getTotal();
  const cartItemCount = items.reduce(
    (acc: number, item: any) => acc + item.quantity,
    0,
  );

  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (!customerPhone) {
      Alert.alert(
        "Customer Details",
        "Please enter customer phone number to generate bill.",
      );
      return;
    }

    try {
      setIsGeneratingPDF(true);

      const invoiceData = {
        shopName: shopName || "My BusinessAI Shop",
        customerPhone,
        items: items.map((item: any) => ({
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
        total: cartTotal,
        date: new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const uri = await generateInvoicePDF(invoiceData);
      await shareInvoicePDF(uri);

      // Create invoice in database
      createInvoice.mutate({
        customer_phone: customerPhone,
        items: items.map((item: any) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          cost_price: item.product.cost_price || item.product.costPrice,
          gst_rate: 0, // Default 0, can be enhanced later
          total: item.product.price * item.quantity,
        })),
        payment_method: "Cash", // Default for now
        status: "paid",
      });

      Alert.alert(
        "✅ Success",
        "Invoice sent! Would you like to clear the cart?",
        [
          {
            text: "Clear & Done",
            onPress: () => {
              clearCart();
              setIsCartOpen(false);
              setCustomerPhone("");
              router.back();
            },
          },
          { text: "Keep Editing", style: "cancel" },
        ],
      );
    } catch (error) {
      Alert.alert("Error", "Failed to generate PDF invoice.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const renderProduct = ({ item, index }: { item: Product; index: number }) => {
    const cartItem = items.find((i) => i.product.id === item.id);
    const qty = cartItem ? cartItem.quantity : 0;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50)
          .springify()
          .damping(15)}
        style={styles.billingCard}
      >
        <View style={styles.productImageWrapper}>
          {item.image ? (
            <Image
              source={{ uri: item.image } as any}
              style={styles.billingImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Package size={24} color={Colors.textTertiary} />
            </View>
          )}
        </View>

        <View style={styles.billingInfo}>
          <Text style={styles.billingName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.billingPrice}>₹{item.price}</Text>
        </View>

        <View style={styles.billingQty}>
          {qty === 0 ? (
            <TouchableOpacity
              style={styles.billingAddBtn}
              onPress={() => addToCart(item)}
              activeOpacity={0.6}
            >
              <Text style={styles.billingAddText}>ADD</Text>
              <Plus size={12} color={Colors.primary} strokeWidth={3} />
            </TouchableOpacity>
          ) : (
            <View style={styles.billingStepper}>
              <TouchableOpacity
                style={styles.stepperAction}
                onPress={() => decreaseQuantity(item.id)}
              >
                <Minus size={14} color={Colors.primary} strokeWidth={3} />
              </TouchableOpacity>
              <View style={styles.stepperValueContainer}>
                <Text style={styles.stepperValueText}>{qty}</Text>
              </View>
              <TouchableOpacity
                style={styles.stepperAction}
                onPress={() => addToCart(item)}
              >
                <Plus size={14} color={Colors.primary} strokeWidth={3} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Search size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Package size={64} color={Colors.surfaceVariant} />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />

      {items.length > 0 && (
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={[
            styles.checkoutBarContainer,
            { paddingBottom: insets.bottom + 20 },
          ]}
        >
          <LinearGradient
            colors={["#008080", "#006666"]}
            style={styles.checkoutBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity
              style={styles.checkoutBarContent}
              onPress={() => setIsCartOpen(true)}
              activeOpacity={0.9}
            >
              <View style={styles.checkoutInfo}>
                <View style={styles.checkoutBadge}>
                  <Text style={styles.checkoutBadgeText}>{cartItemCount}</Text>
                </View>
                <View>
                  <Text style={styles.checkoutBillAmount}>₹{cartTotal}</Text>
                  <Text style={styles.checkoutTaxLabel}>
                    Including all taxes
                  </Text>
                </View>
              </View>
              <View style={styles.checkoutAction}>
                <Text style={styles.checkoutActionText}>View Bill</Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Cart Modal */}
      <Modal
        visible={isCartOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsCartOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Order Summary</Text>
            <TouchableOpacity onPress={() => setIsCartOpen(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={items}
            keyExtractor={(item) => item.product.id}
            contentContainerStyle={styles.cartList}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName}>{item.product.name}</Text>
                  <Text style={styles.cartItemPrice}>
                    ₹{item.product.price} x {item.quantity}
                  </Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    onPress={() => decreaseQuantity(item.product.id)}
                    style={styles.qtyBtn}
                  >
                    <Minus size={16} color={Colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.qtyVal}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => addToCart(item.product)}
                    style={styles.qtyBtn}
                  >
                    <Plus size={16} color={Colors.text} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemTotal}>
                  ₹{item.product.price * item.quantity}
                </Text>
              </View>
            )}
          />

          <View style={styles.checkoutFooter}>
            <Text style={styles.customerLabel}>Customer Phone</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter Number"
              keyboardType="phone-pad"
              value={customerPhone}
              onChangeText={setCustomerPhone}
            />

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Total Payable</Text>
              <Text style={styles.billValue}>₹ {cartTotal}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleCheckout}
            >
              <Text style={styles.checkoutBtnText}>
                Acccept Payment & Send Bill
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#FFF",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#1E293B",
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 150,
  },
  billingCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  productImageWrapper: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  billingImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  billingInfo: {
    flex: 1,
    marginLeft: 16,
  },
  billingName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 4,
  },
  billingPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.primary,
  },
  billingQty: {
    marginLeft: 12,
  },
  billingAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  billingAddText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.primary,
  },
  billingStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 2,
  },
  stepperAction: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
  },
  stepperValueContainer: {
    width: 36,
    alignItems: "center",
  },
  stepperValueText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },
  checkoutBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  checkoutBar: {
    borderRadius: 24,
    overflow: "hidden",
  },
  checkoutBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingHorizontal: 20,
  },
  checkoutInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkoutBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  checkoutBadgeText: {
    color: "#FFF",
    fontWeight: "700",
  },
  checkoutBillAmount: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  checkoutTaxLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
  },
  checkoutAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  checkoutActionText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
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
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
  },
  closeText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "700",
  },
  cartList: {
    padding: Spacing.md,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  cartItemPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 8,
  },
  qtyVal: {
    width: 28,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
    width: 70,
    textAlign: "right",
  },
  checkoutFooter: {
    padding: 20,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  customerLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 8,
  },
  phoneInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
    color: "#1E293B",
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  billLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  billValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1E293B",
  },
  checkoutBtn: {
    backgroundColor: "#10B981",
    padding: 18,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 16,
  },
});
