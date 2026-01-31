import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MessageSquare, Phone, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { BorderRadius, Colors, Spacing } from "../../constants/theme";
import { useCustomers, useCustomerMutations, useCustomerTransactions } from "../../hooks/queries/useCustomers";
import { useUserStore } from "../../store/useUserStore";
import { getAvatarColor, getInitial } from "../../utils/ui/avatar-utils";
import { sendWhatsAppReminder } from "../../utils/whatsapp/WhatsAppService";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { shopName } = useUserStore();

  // TanStack Query hooks
  const { data: customers = [] } = useCustomers();
  const { data: transactions = [] } = useCustomerTransactions(id as string);
  const { addTransaction, toggleCustomerStatus, deleteCustomer: deleteCustomerMutation } = useCustomerMutations();

  const customer = customers.find(c => c.id === id);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<"gave" | "got" | undefined>(undefined);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  if (!customer) {
    return (
      <View style={styles.container}>
        <Text>Customer not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Customer",
      `Are you sure you want to delete ${customer.name}? This will also delete all their transaction history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteCustomerMutation.mutate(customer.id, {
              onSuccess: () => {
                router.replace("/customers");
              },
            });
          },
        },
      ],
    );
  };

  const customerTransactions = transactions;

  const handleTransaction = () => {
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount > 0 && txType) {
      addTransaction.mutate(
        {
          customerId: customer.id,
          amount: parsedAmount,
          type: txType,
          description,
        },
        {
          onSuccess: () => {
            setAmount("");
            setDescription("");
            setIsTxModalOpen(false);
          },
        }
      );
    }
  };

  const handleSettle = () => {
    if (customer) {
      toggleCustomerStatus.mutate(customer.id, {
        onSuccess: () => {
          if (customer.status === "active" || !customer.status) {
            router.back();
          }
        },
      });
    }
  };

  const openTxModal = (type: "gave" | "got") => {
    setTxType(type);
    setIsTxModalOpen(true);
  };

  const handleWhatsApp = () => {
    if (customer?.phone) {
      sendWhatsAppReminder(
        customer.name,
        customer.phone,
        customer.balance,
        shopName || "My Shop",
      );
    } else {
      alert("No phone number saved for this customer.");
    }
  };

  const avatarColor = customer
    ? getAvatarColor(customer.name)
    : Colors.surfaceVariant;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>

        {/* Customer Avatar - Side Image */}
        <View
          style={[styles.avatarContainer, { backgroundColor: avatarColor }]}
        >
          <Text style={styles.avatarText}>{getInitial(customer.name)}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.name}>{customer.name}</Text>
          {customer.phone && <Text style={styles.phone}>{customer.phone}</Text>}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionBtnHeader}
            onPress={handleWhatsApp}
          >
            <MessageSquare size={22} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnHeader}>
            <Phone size={22} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionBtnHeader,
              { backgroundColor: `${Colors.error}15` },
            ]}
            onPress={handleDelete}
          >
            <Trash2 size={22} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance Status */}
      <View style={styles.balanceContainer}>
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>
            {customer.balance >= 0 ? "You will get" : "You will give"}
          </Text>
          <Text
            style={[
              styles.balanceAmount,
              {
                color: customer.balance >= 0 ? Colors.secondary : Colors.error,
              },
            ]}
          >
            ₹ {Math.abs(customer.balance).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Settle Button - Moved Below Cash */}
      <View style={styles.settleContainer}>
        <TouchableOpacity
          style={[
            styles.settleButton,
            customer.status === "settled" && styles.settleButtonActive,
          ]}
          onPress={handleSettle}
        >
          <Text
            style={[
              styles.settleText,
              customer.status === "settled" && { color: "white" },
            ]}
          >
            {customer.status === "settled" ? "Restored" : "All Sorted"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <FlatList
        data={customerTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.txItem}>
            <View style={styles.txLeft}>
              <Text style={styles.txDate}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
              {item.description ? (
                <Text style={styles.txDesc}>{item.description}</Text>
              ) : null}
            </View>
            <View style={styles.txRight}>
              <Text
                style={[
                  styles.txAmount,
                  {
                    color:
                      item.type === "gave" ? Colors.error : Colors.secondary,
                  },
                ]}
              >
                {item.type === "gave" ? "-" : "+"} ₹{item.amount}
              </Text>
              <Text style={styles.txTypeLabel}>
                {item.type === "gave" ? "Udhari" : "Bhugtan"}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet.</Text>
          </View>
        }
      />

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.error }]}
          onPress={() => openTxModal("gave")}
        >
          <Text style={styles.actionBtnText}>Udhari</Text>
          <Text style={styles.actionBtnSub}>(You Gave)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.secondary }]}
          onPress={() => openTxModal("got")}
        >
          <Text style={styles.actionBtnText}>Bhugtan</Text>
          <Text style={styles.actionBtnSub}>(You Got)</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction Modal */}
      <Modal
        visible={isTxModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsTxModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {txType === "gave"
                ? "Udhari (You Gave)"
                : "Bhugtan (You Received)"}
            </Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
            <TextInput
              style={styles.descInput}
              placeholder="Description (Optional)"
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setIsTxModalOpen(false)}>
                <Text style={styles.cancelLink}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor:
                      txType === "gave" ? Colors.error : Colors.secondary,
                  },
                ]}
                onPress={handleTransaction}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  backBtn: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  phone: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  actionBtnHeader: {
    padding: 10,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.full,
  },
  settleContainer: {
    backgroundColor: Colors.surfaceVariant,
    paddingBottom: Spacing.md,
    alignItems: "center",
  },
  settleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settleButtonActive: {
    backgroundColor: "#27AE60",
    borderColor: "#27AE60",
  },
  settleText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  balanceContainer: {
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.md,
    alignItems: "center",
  },
  balanceInfo: {
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: "700",
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  txItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  txLeft: {
    justifyContent: "center",
  },
  txDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  txDesc: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 2,
  },
  txRight: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  txTypeLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.textTertiary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  actionBtnSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
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
    fontWeight: "600",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  amountInput: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  descInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancelLink: {
    color: Colors.textSecondary,
    fontSize: 16,
    padding: Spacing.sm,
  },
  saveBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  saveBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
