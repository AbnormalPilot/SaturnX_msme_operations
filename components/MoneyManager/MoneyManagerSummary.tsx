import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { BorderRadius, Colors, Spacing } from "../../constants/theme";
import { useCustomers } from "../../hooks/queries/useCustomers";
import { getAvatarColor } from "../../utils/ui/avatar-utils";

// Default color for suppliers/others if needed
const PAY_COLOR = Colors.error; // Red

export default function MoneyManagerSummary() {
  // TanStack Query hooks - fetch all active customers (both customers and suppliers)
  const { data: customers = [], isLoading } = useCustomers({
    status: 'active',
  });

  // 1. Calculate Totals
  const activeCustomers = customers;

  const toReceiveCustomers = activeCustomers
    .filter((c) => c.balance > 0)
    .sort((a, b) => b.balance - a.balance); // Highest debt first

  const toReceiveTotal = toReceiveCustomers.reduce(
    (acc, curr) => acc + curr.balance,
    0,
  );

  const toPayTotal = activeCustomers
    .filter((c) => c.balance < 0)
    .reduce((acc, curr) => acc + Math.abs(curr.balance), 0);

  const totalVolume = toReceiveTotal + toPayTotal;

  // 2. Prepare Segments
  const segments: {
    id: string;
    label: string;
    amount: number;
    color: string;
    widthPercent: number;
    textPercent: number;
    type: "pay" | "receive";
  }[] = [];

  // Segment 1: To Pay (Red Block)
  if (toPayTotal > 0) {
    segments.push({
      id: "to-pay",
      label: "To Pay (Total)",
      amount: toPayTotal,
      color: PAY_COLOR,
      widthPercent: (toPayTotal / totalVolume) * 100, // Visual width
      textPercent: 100, // It's the whole "To Pay" bucket
      type: "pay",
    });
  }

  // Segment 2+: To Receive (Breakdown)
  // Take top 4, group rest
  const topReceivables = toReceiveCustomers.slice(0, 4);
  const otherReceivables = toReceiveCustomers.slice(4);
  const otherTotal = otherReceivables.reduce((acc, c) => acc + c.balance, 0);

  topReceivables.forEach((customer, index) => {
    segments.push({
      id: customer.id,
      label: customer.name,
      amount: customer.balance,
      color: getAvatarColor(customer.name),
      widthPercent: (customer.balance / totalVolume) * 100, // Visual
      textPercent: (customer.balance / toReceiveTotal) * 100, // Statistical (Group relative)
      type: "receive",
    });
  });

  if (otherTotal > 0) {
    segments.push({
      id: "others",
      label: "Others",
      amount: otherTotal,
      color: "#6FCF97", // Fixed color for 'Others' grouping
      widthPercent: (otherTotal / totalVolume) * 100,
      textPercent: (otherTotal / toReceiveTotal) * 100,
      type: "receive",
    });
  }

  const handlePressSegment = (segment: (typeof segments)[0]) => {
    Alert.alert(
      segment.label,
      `Amount: ₹${segment.amount.toLocaleString()}\nShare: ${Math.round(segment.textPercent)}% of ${segment.type === "pay" ? "Payables" : "Receivables"}`,
    );
  };

  // If no data
  if (totalVolume === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No items to track yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Row: Big Totals */}
      <View style={styles.header}>
        <View>
          <Text style={styles.totalLabel}>Total To Pay</Text>
          <Text style={[styles.totalAmount, { color: Colors.error }]}>
            ₹ {toPayTotal.toLocaleString()}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.totalLabel}>Total To Receive</Text>
          <Text style={[styles.totalAmount, { color: Colors.primary }]}>
            ₹ {toReceiveTotal.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* The Segmented Bar */}
      <View style={styles.barContainer}>
        {segments.map((segment, index) => (
          <TouchableOpacity
            key={segment.id}
            activeOpacity={0.8}
            onPress={() => handlePressSegment(segment)}
            style={[
              styles.barSegment,
              {
                backgroundColor: segment.color,
                width: `${segment.widthPercent}%`,
                // Rounded corners for first/last
                borderTopLeftRadius: index === 0 ? 8 : 0,
                borderBottomLeftRadius: index === 0 ? 8 : 0,
                borderTopRightRadius: index === segments.length - 1 ? 8 : 0,
                borderBottomRightRadius: index === segments.length - 1 ? 8 : 0,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: "700",
  },
  barContainer: {
    flexDirection: "row",
    height: 40, // Deeper bar
    width: "100%",
    backgroundColor: Colors.surfaceVariant, // Background for empty/loading
    borderRadius: 10,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  barSegment: {
    height: "100%",
    // color and width set dynamically
  },
  emptyText: {
    textAlign: "center",
    color: Colors.textTertiary,
    fontStyle: "italic",
  },
});
