import { TrendingUp, Package, AlertTriangle, FileText } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BorderRadius, Colors, Spacing } from '../constants/theme';
import { useProducts } from '../hooks/queries/useProducts';
import { useInvoices } from '../hooks/queries/useInvoices';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  delay: number;
}

function StatCard({ icon, label, value, color, delay }: StatCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(500)}
      style={[styles.statCard, { borderLeftColor: color }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </Animated.View>
  );
}

export default function BusinessStats() {
  // Fetch products
  const { data: products = [], isLoading: loadingProducts } = useProducts();

  // Fetch invoices
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices({
    status: 'paid',
  });

  // Calculate stats
  const totalProducts = products.length;
  const lowStockItems = products.filter(p => p.quantity <= p.low_stock_threshold).length;
  const totalStockValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

  // Today's sales
  const today = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter(inv => {
    const invDate = inv.created_at?.split('T')[0];
    return invDate === today;
  });
  const todaySales = todayInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

  const totalInvoices = invoices.length;

  if (loadingProducts || loadingInvoices) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading business data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Business Overview</Text>

      <View style={styles.statsGrid}>
        <StatCard
          icon={<Package size={24} color={Colors.primary} />}
          label="Total Products"
          value={totalProducts.toString()}
          color={Colors.primary}
          delay={100}
        />

        <StatCard
          icon={<AlertTriangle size={24} color="#F2994A" />}
          label="Low Stock Items"
          value={lowStockItems.toString()}
          color="#F2994A"
          delay={150}
        />

        <StatCard
          icon={<TrendingUp size={24} color="#6FCF97" />}
          label="Today's Sales"
          value={`₹${todaySales.toLocaleString('en-IN')}`}
          color="#6FCF97"
          delay={200}
        />

        <StatCard
          icon={<FileText size={24} color="#56CCF2" />}
          label="Total Invoices"
          value={totalInvoices.toString()}
          color="#56CCF2"
          delay={250}
        />
      </View>

      {totalStockValue > 0 && (
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryLabel}>Total Stock Value</Text>
          <Text style={styles.summaryValue}>₹{totalStockValue.toLocaleString('en-IN')}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  statsGrid: {
    gap: Spacing.md,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
});
