import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Plus } from "lucide-react-native";
import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CustomerList from "../components/MoneyManager/CustomerList";
import MoneyManagerSummary from "../components/MoneyManager/MoneyManagerSummary";
import { BorderRadius, Colors, Spacing } from "../constants/theme";
import { useCustomers, useCustomerMutations } from "../hooks/queries/useCustomers";
import { useCustomersRealtime } from "../hooks/queries/useCustomersRealtime";

export default function CustomersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  // Default to 'customer' if not specified, but check params safely
  const initialType = (params.type === "supplier" ? "supplier" : "customer") as
    | "customer"
    | "supplier";

  const [activeTab, setActiveTab] = useState<"customer" | "supplier">(
    initialType,
  );

  // TanStack Query hooks
  const { data: customers = [], isLoading, error, refetch, userId } = useCustomers({
    type: activeTab,
    status: viewStatus,
  });
  const { createCustomer } = useCustomerMutations();

  // Enable real-time subscriptions
  useCustomersRealtime(userId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  // New State for Add Modal
  const [initialAmount, setInitialAmount] = useState("");
  const [balanceType, setBalanceType] = useState<"to_receive" | "to_pay">(
    "to_receive",
  );

  // View State
  const [viewStatus, setViewStatus] = useState<"active" | "settled">("active");

  const handleAddCustomer = () => {
    if (newCustomerName.trim()) {
      const amount = parseFloat(initialAmount);
      createCustomer.mutate(
        {
          name: newCustomerName,
          type: activeTab,
          phone: newCustomerPhone,
          initialBalance: isNaN(amount) ? 0 : amount,
          balanceType,
        },
        {
          onSuccess: () => {
            setNewCustomerName("");
            setNewCustomerPhone("");
            setInitialAmount("");
            setBalanceType("to_receive");
            setIsAddModalOpen(false);
          },
        }
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Money Manager</Text>
      </View>

      {/* Dynamic Header */}
      {viewStatus === "active" ? (
        // Active Mode: Tabs + History Button Side-by-Side
        <View style={styles.headerContainer}>
          <View style={[styles.tabContainer, { flex: 1 }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "customer" && styles.activeTab]}
              onPress={() => setActiveTab("customer")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "customer" && styles.activeTabText,
                ]}
              >
                Customer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "supplier" && styles.activeTab]}
              onPress={() => setActiveTab("supplier")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "supplier" && styles.activeTabText,
                ]}
              >
                Supplier
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => setViewStatus("settled")}
          >
            <Text style={styles.historyText}>History</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Settled Mode: Title/Button Row -> Tabs Row
        <View style={styles.settledHeaderContainer}>
          <View style={styles.settledTopRow}>
            <Text style={styles.settledTitle}>History (Settled)</Text>
            <TouchableOpacity
              style={[styles.historyButton, styles.historyButtonActive]}
              onPress={() => setViewStatus("active")}
            >
              <Text style={[styles.historyText, { color: Colors.primary }]}>
                Active
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "customer" && styles.activeTab]}
              onPress={() => setActiveTab("customer")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "customer" && styles.activeTabText,
                ]}
              >
                Customer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "supplier" && styles.activeTab]}
              onPress={() => setActiveTab("supplier")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "supplier" && styles.activeTabText,
                ]}
              >
                Supplier
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryContainer}>
          {viewStatus === "active" && <MoneyManagerSummary />}
        </View>

        <CustomerList type={activeTab} status={viewStatus} />
      </ScrollView>

      {/* Add Button (Floating Action Button style or just fixed at bottom) */}
      {viewStatus === "active" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIsAddModalOpen(true)}
        >
          <Plus size={24} color="white" />
          <Text style={styles.fabText}>
            New {activeTab === "customer" ? "Customer" : "Supplier"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Add Customer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddModalOpen}
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Add New {activeTab === "customer" ? "Customer" : "Supplier"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Name"
              value={newCustomerName}
              onChangeText={setNewCustomerName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number (Optional)"
              value={newCustomerPhone}
              onChangeText={setNewCustomerPhone}
              keyboardType="phone-pad"
            />

            {/* Initial Balance Section */}
            <Text style={styles.label}>Initial Balance</Text>
            <View style={styles.balanceTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.radioBtn,
                  balanceType === "to_receive" &&
                    styles.radioBtnActiveReceivable,
                ]}
                onPress={() => setBalanceType("to_receive")}
              >
                <Text
                  style={[
                    styles.radioText,
                    balanceType === "to_receive" && { color: "white" },
                  ]}
                >
                  To Receive
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioBtn,
                  balanceType === "to_pay" && styles.radioBtnActivePayable,
                ]}
                onPress={() => setBalanceType("to_pay")}
              >
                <Text
                  style={[
                    styles.radioText,
                    balanceType === "to_pay" && { color: "white" },
                  ]}
                >
                  To Pay
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Amount (0 if none)"
              value={initialAmount}
              onChangeText={setInitialAmount}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: Colors.surfaceVariant },
                ]}
                onPress={() => setIsAddModalOpen(false)}
              >
                <Text style={{ color: Colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: Colors.primary },
                ]}
                onPress={handleAddCustomer}
              >
                <Text style={{ color: "white" }}>Save</Text>
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
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    // borderBottomWidth: 1,
    // borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 8,
    marginRight: Spacing.sm,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
    padding: 4,
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
  historyButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  historyButtonActive: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  historyText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  settledHeaderContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  settledTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settledTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  summaryContainer: {
    marginBottom: Spacing.sm,
  },
  fab: {
    position: "absolute",
    bottom: Spacing.xl,
    right: Spacing.xl,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.full,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: Colors.textSecondary,
  },
  balanceTypeContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  radioBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  radioBtnActiveReceivable: {
    backgroundColor: "#27AE60", // Green
    borderColor: "#27AE60",
  },
  radioBtnActivePayable: {
    backgroundColor: "#EB5757", // Red
    borderColor: "#EB5757",
  },
  radioText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
});
