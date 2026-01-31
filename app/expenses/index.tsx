import { useRouter } from "expo-router";
import { ArrowLeft, Receipt, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { Text } from "react-native-paper";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    BorderRadius,
    Colors,
    Spacing,
    Typography,
} from "../../constants/theme";

interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
}

export default function ExpensesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const handleAddExpense = () => {
    if (!newTitle || !newAmount) return;
    const expense: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      amount: parseFloat(newAmount),
      date: new Date().toLocaleDateString(),
    };
    setExpenses([expense, ...expenses]);
    setNewTitle("");
    setNewAmount("");
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, Typography.h2]}>Expenses</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.addCard}>
          <Text style={styles.cardHeader}>Add Shop Expense</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Tea, Rent, Electricity"
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Amount (₹)"
            keyboardType="numeric"
            value={newAmount}
            onChangeText={setNewAmount}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddExpense}>
            <Text style={styles.addBtnText}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <Receipt size={48} color={Colors.textTertiary} opacity={0.3} />
            <Text style={styles.emptyText}>No expenses recorded today.</Text>
          </View>
        ) : (
          expenses.map((expense, index) => (
            <Animated.View
              key={expense.id}
              entering={FadeInDown.delay(index * 50)}
              style={styles.expenseItem}
            >
              <View>
                <Text style={styles.expenseTitle}>{expense.title}</Text>
                <Text style={styles.expenseDate}>{expense.date}</Text>
              </View>
              <View style={styles.rightSide}>
                <Text style={styles.expenseAmount}>₹{expense.amount}</Text>
                <TouchableOpacity onPress={() => deleteExpense(expense.id)}>
                  <Trash2 size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  backBtn: {
    padding: Spacing.sm,
  },
  title: {
    color: Colors.text,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  addCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surfaceVariant,
    padding: 12,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    fontSize: 16,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  addBtnText: {
    color: "#FFF",
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  expenseTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: Colors.text,
  },
  expenseDate: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  rightSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.error,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
    gap: 10,
  },
  emptyText: {
    color: Colors.textTertiary,
    fontSize: 15,
  },
});
