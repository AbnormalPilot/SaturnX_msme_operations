import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Check,
    IndianRupee,
    Plus,
    Receipt,
    X,
    Zap,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { BorderRadius, Colors, Spacing } from "../constants/theme";
import { useUserStore } from "../store/useUserStore";
import {
    generateInvoicePDF,
    InvoiceItem,
    shareInvoicePDF,
} from "../utils/pdf/PDFService";

export default function InstantInvoiceScreen() {
  const router = useRouter();
  const { shopName } = useUserStore();

  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [isGenerating, setIsGenerating] = useState(false);

  const addItem = () => {
    if (!itemName.trim() || !itemPrice || parseFloat(itemPrice) <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid item name and price.");
      return;
    }

    const newItem: InvoiceItem = {
      name: itemName.trim(),
      price: parseFloat(itemPrice),
      quantity: parseInt(itemQty) || 1,
    };

    setItems([...items, newItem]);
    setItemName("");
    setItemPrice("");
    setItemQty("1");
    Keyboard.dismiss();
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const totalAmount = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const handleGenerateInvoice = async () => {
    if (items.length === 0) {
      Alert.alert("Cart Empty", "Please add at least one item to the bill.");
      return;
    }

    if (!customerPhone) {
      Alert.alert("Missing Info", "Please enter customer phone number.");
      return;
    }

    try {
      setIsGenerating(true);
      const invoiceData = {
        shopName: shopName || "My BusinessAI Shop",
        customerPhone,
        items,
        total: totalAmount,
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

      Alert.alert(
        "✅ Success",
        "Invoice sent! Would you like to clear the items and go back?",
        [
          {
            text: "Clear & Done",
            onPress: () => {
              setItems([]);
              setCustomerPhone("");
              router.back();
            },
          },
          { text: "Keep Editing", style: "cancel" },
        ],
      );
    } catch (error) {
      Alert.alert("Error", "Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleRow}>
            <Zap size={20} color={Colors.primary} fill={Colors.primary} />
            <Text style={styles.title}>Instant Invoice</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Customer Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Customer Details</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Customer Phone Number"
                placeholderTextColor={Colors.textTertiary}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Item Entry Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Add Item</Text>
            <View style={styles.itemForm}>
              <View style={[styles.inputWrapper, { flex: 2 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Item Name"
                  placeholderTextColor={Colors.textTertiary}
                  value={itemName}
                  onChangeText={setItemName}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Price"
                  placeholderTextColor={Colors.textTertiary}
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputWrapper, { width: 40 }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Qty"
                  placeholderTextColor={Colors.textTertiary}
                  value={itemQty}
                  onChangeText={setItemQty}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={addItem}>
                <Plus size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Items List */}
          <View style={[styles.section, { flex: 1 }]}>
            <View style={styles.listHeader}>
              <Text style={styles.sectionLabel}>Items ({items.length})</Text>
              {items.length > 0 && (
                <TouchableOpacity onPress={() => setItems([])}>
                  <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={items}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <Animated.View
                  entering={FadeInUp.delay(index * 50)}
                  style={styles.itemRow}
                >
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSubText}>
                      ₹{item.price} x {item.quantity}
                    </Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.itemTotal}>
                      ₹{item.price * item.quantity}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeItem(index)}
                      style={styles.removeBtn}
                    >
                      <X size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Receipt size={48} color={Colors.textTertiary} />
                  <Text style={styles.emptyText}>No items added yet</Text>
                </View>
              }
            />
          </View>
        </View>

        {/* Bottom Total & Button */}
        <Animated.View entering={FadeInDown} style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Invoice Total</Text>
            <View style={styles.totalValueRow}>
              <IndianRupee size={22} color={Colors.secondary} strokeWidth={3} />
              <Text style={styles.totalAmount}>{totalAmount}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.generateBtn,
              (items.length === 0 || isGenerating) && styles.btnDisabled,
            ]}
            onPress={handleGenerateInvoice}
            disabled={items.length === 0 || isGenerating}
          >
            <LinearGradient
              colors={["#F2994A", "#F2C94C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Check size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.btnText}>
                {isGenerating ? "Generating..." : "Generate & Share Invoice"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    height: 60,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputWrapper: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    height: 50,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    fontSize: 16,
    color: Colors.text,
  },
  itemForm: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  clearText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: "600",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: BorderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  itemSubText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.secondary,
  },
  removeBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textTertiary,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === "ios" ? 20 : Spacing.md,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  totalValueRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: Colors.secondary,
  },
  generateBtn: {
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  btnGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
