import { useNavigation } from 'expo-router';
import {
  Award,
  HelpCircle,
  Package,
  Receipt,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AITypography, BorderRadius, Colors, Spacing } from '@/constants/theme';

interface QuickAction {
  icon: LucideIcon;
  label: string;
  query: string;
}

const contextMap: Record<string, QuickAction[]> = {
  inventory: [
    { icon: Package, label: 'Low Stock', query: 'Show items running low', },
    { icon: TrendingUp, label: 'Best Sellers', query: 'Show best selling products', },
  ],
  sales: [
    { icon: TrendingUp, label: "Today's Sales", query: "Show today's summary", },
    { icon: Award, label: 'Top Products', query: 'Best sellers this month', },
  ],
  home: [
    { icon: TrendingUp, label: 'Sales Report', query: 'Show weekly sales report', },
    { icon: Package, label: 'Low Stock', query: 'Low stock items', },
    { icon: Receipt, label: 'GST Help', query: 'Calculate GST for invoice', },
    { icon: HelpCircle, label: 'Business Tips', query: 'Tips to improve my business', },
  ],
};

interface AIQuickActionsProps {
  onActionPress: (query: string) => void;
}

export function AIQuickActions({ onActionPress }: AIQuickActionsProps) {
  const navigation = useNavigation();
  const [actions, setActions] = useState<QuickAction[]>(contextMap.home);

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      const state = navigation.getState();
      const currentRoute = state.routes[state.index];
      const routeName = currentRoute.name;

      // Map route names to context keys
      let contextKey = 'home';
      if (routeName.includes('inventory')) contextKey = 'inventory';
      else if (routeName.includes('sales')) contextKey = 'sales';

      setActions(contextMap[contextKey] || contextMap.home);
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {actions.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={styles.actionCard}
          onPress={() => onActionPress(action.query)}
          activeOpacity={0.7}
        >
          <action.icon size={20} color={Colors.primary} />
          <Text style={styles.actionLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionLabel: {
    ...AITypography.quickActionLabel,
    color: Colors.text,
  },
});
