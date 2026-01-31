import { useRouter } from "expo-router";
import {
    ArrowLeft,
    TrendingDown,
    TrendingUp
} from "lucide-react-native";
import React, { useState } from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";
import { Text } from "react-native-paper";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BottomNav from "../../components/BottomNav";
import { BorderRadius, Colors, Spacing } from "../../constants/theme";
import { useSheet } from "../../context/SheetContext";
import { useSalesStats, useInvoices } from "../../hooks/queries/useInvoices";
import { useInvoicesRealtime } from "../../hooks/queries/useInvoicesRealtime";

export default function SalesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { openSheet } = useSheet();

  // TanStack Query hooks
  const { data: todayStats = { revenue: 0, profit: 0, cost: 0 }, isLoading: loadingToday } = useSalesStats('today');
  const { data: yesterdayStats = { revenue: 0, profit: 0, cost: 0 }, isLoading: loadingYesterday } = useSalesStats('yesterday');
  const { data: monthStats = { revenue: 0, profit: 0, cost: 0 }, isLoading: loadingMonth } = useSalesStats('month');
  const { userId } = useInvoices();

  // Enable real-time subscriptions
  useInvoicesRealtime(userId);

  const [period, setPeriod] = useState<"Monthly" | "Yearly">("Monthly");

  // Compare Today vs Yesterday
  const profitDiff = todayStats.profit - yesterdayStats.profit;
  const isProfitUp = profitDiff >= 0;

  // Dummy data for charts (Use real data from store if available ideally)
  const barData = [
    {
      value: yesterdayStats.profit,
      label: "Yest",
      frontColor: Colors.textTertiary,
    },
    {
      value: todayStats.profit,
      label: "Today",
      frontColor: isProfitUp ? Colors.secondary : Colors.error,
    },
  ];

  const monthlyData = [
    { value: 5000, label: "W1" },
    { value: 7000, label: "W2" },
    { value: 4500, label: "W3" },
    { value: todayStats.revenue + 2000, label: "W4" }, // Just simulation
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View
          style={[
            styles.headerCenter,
            { alignItems: "flex-start", paddingLeft: 8 },
          ]}
        >
          <Text style={styles.headerTitle}>Profit & Loss</Text>
          <Text style={styles.headerSubtitle}>Track your business growth</Text>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Overview */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={styles.overviewRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Today's Sale</Text>
              <Text style={[styles.statValue, { color: Colors.primary }]}>
                ₹{todayStats.revenue.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Today's Profit</Text>
              <Text style={[styles.statValue, { color: Colors.secondary }]}>
                ₹{todayStats.profit.toLocaleString()}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Comparison Chart */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(500)}
          style={styles.chartCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Yesterday vs Today Profit</Text>
            <View
              style={[
                styles.trendBadge,
                isProfitUp ? styles.trendUp : styles.trendDown,
              ]}
            >
              {isProfitUp ? (
                <TrendingUp size={14} color={Colors.secondary} />
              ) : (
                <TrendingDown size={14} color={Colors.error} />
              )}
              <Text
                style={[
                  styles.trendText,
                  isProfitUp
                    ? { color: Colors.secondary }
                    : { color: Colors.error },
                ]}
              >
                {Math.abs(profitDiff).toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.barChartContainer}>
            <BarChart
              data={barData}
              barWidth={40}
              noOfSections={3}
              barBorderRadius={4}
              frontColor={Colors.primary}
              yAxisThickness={0}
              xAxisThickness={0}
              hideRules
              height={150}
              width={200}
              yAxisTextStyle={{ color: Colors.textTertiary }}
              xAxisLabelTextStyle={{ color: Colors.textSecondary }}
            />
          </View>
        </Animated.View>

        {/* Monthly Calculator */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(500)}
          style={styles.chartCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Calculator</Text>
            <View style={styles.periodToggle}>
              <TouchableOpacity
                onPress={() => setPeriod("Monthly")}
                style={[styles.pBtn, period === "Monthly" && styles.pBtnActive]}
              >
                <Text
                  style={[
                    styles.pText,
                    period === "Monthly" && styles.pTextActive,
                  ]}
                >
                  Month
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.monthStats}>
            <View style={styles.monthRow}>
              <Text style={styles.monthLabel}>Total Sales</Text>
              <Text style={styles.monthValue}>
                ₹{monthStats.revenue.toLocaleString()}
              </Text>
            </View>
            <View style={styles.monthRow}>
              <Text style={styles.monthLabel}>Total Profit</Text>
              <Text style={[styles.monthValue, { color: Colors.secondary }]}>
                ₹{monthStats.profit.toLocaleString()}
              </Text>
            </View>
          </View>

          <LineChart
            data={monthlyData}
            color={Colors.askYellowDark}
            thickness={3}
            curved
            hideRules
            hideYAxisText
            hideDataPoints={false}
            dataPointsColor={Colors.askYellowDark}
            startFillColor={Colors.askYellow}
            endFillColor="white"
            startOpacity={0.3}
            endOpacity={0.1}
            areaChart
            height={100}
            width={280}
            spacing={60}
          />
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomNav onAiPress={openSheet} />
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
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    justifyContent: "center",
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  overviewRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  trendUp: {
    backgroundColor: Colors.trackGreen,
  },
  trendDown: {
    backgroundColor: `${Colors.error}15`,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  barChartContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  periodToggle: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  pBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  pBtnActive: {
    backgroundColor: Colors.surface,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  pText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  pTextActive: {
    color: Colors.text,
    fontWeight: "500",
  },
  monthStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  monthRow: {},
  monthLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  monthValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
});
