import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors, Spacing } from "../../constants/theme";
import { Customer } from "../../hooks/queries/useCustomers";
import { useUserStore } from "../../store/useUserStore";
import { sendWhatsAppReminder } from "../../utils/whatsapp/WhatsAppService";

import { getAvatarColor, getInitial } from "../../utils/ui/avatar-utils";

interface Props {
  customer: Customer;
}

export default function CustomerListItem({ customer }: Props) {
  const router = useRouter();
  const { shopName } = useUserStore();

  const handlePress = () => {
    router.push(`/customer/${customer.id}` as any);
  };

  const handleReminder = (e: any) => {
    e.stopPropagation();
    if (customer.phone) {
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

  const isPositive = customer.balance >= 0;
  const balanceColor = isPositive ? Colors.secondary : Colors.error;
  const balanceText = isPositive ? "UDHARI (Receivable)" : "BHUGTAN (Payable)";

  const avatarColor = getAvatarColor(customer.name);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{getInitial(customer.name)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{customer.name}</Text>
          <Text style={styles.time}>
            {customer.phone ? customer.phone : "No Phone"}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.amount, { color: balanceColor }]}>
              ₹ {Math.abs(customer.balance).toLocaleString()}
            </Text>
            <Text style={styles.status}>{balanceText}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    justifyContent: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  time: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  reminderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  amount: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  status: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  avatarText: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },
});
