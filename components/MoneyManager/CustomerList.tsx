import { Search } from "lucide-react-native";
import React, { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View, ActivityIndicator } from "react-native";
import { BorderRadius, Colors, Spacing } from "../../constants/theme";
import { useCustomers } from "../../hooks/queries/useCustomers";
import { useCustomersRealtime } from "../../hooks/queries/useCustomersRealtime";
import CustomerListItem from "./CustomerListItem";

interface Props {
  type: "customer" | "supplier";
  status?: "active" | "settled"; // Added status prop
  limit?: number;
  hideSearch?: boolean;
}

export default function CustomerList({
  type,
  status = "active", // Default to active
  limit,
  hideSearch = false,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  // TanStack Query hooks
  const { data: customers = [], isLoading, error, userId } = useCustomers({
    type,
    status,
    search: searchQuery,
  });

  // Enable real-time subscriptions
  useCustomersRealtime(userId);

  const filteredData = limit ? customers.slice(0, limit) : customers;

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      {!hideSearch && (
        <View style={styles.searchContainer}>
          <Search
            size={20}
            color={Colors.textTertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${type === "customer" ? "Customers" : "Suppliers"}`}
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CustomerListItem customer={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {error ? "Error loading customers" : `No ${type}s found`}
              </Text>
            </View>
          }
          scrollEnabled={false} // Since this will be inside the main ScrollView
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    height: "100%",
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.textTertiary,
    fontSize: 14,
  },
});
