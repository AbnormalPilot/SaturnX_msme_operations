import { TrendingUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Text } from 'react-native-paper';

import { BorderRadius, Colors, Spacing } from '../constants/theme';
import { getSalesAnalytics } from '../utils/mcp-client';
import { supabase } from '../utils/supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;
// Parent padding (index.tsx) = Spacing.lg * 2 (approx 16*2=32)
// Card internal padding = Spacing.lg * 2
// Y-Axis label approx width = 45
const PARENT_PADDING = Spacing.lg * 2;
const CARD_INTERNAL_PADDING = Spacing.lg * 2;
const CHART_WIDTH = SCREEN_WIDTH - PARENT_PADDING - CARD_INTERNAL_PADDING - 55;

export default function SummaryCard() {
    const [period, setPeriod] = useState<'Weekly' | 'Monthly'>('Weekly');
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const formatYLabel = (value: string) => {
        const num = parseFloat(value);
        if (num >= 10000000) return (num / 10000000).toFixed(1) + 'C';
        if (num >= 100000) return (num / 100000).toFixed(1) + 'L';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
        return value;
    };

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Get current user ID
                const { data: { user } } = await supabase.auth.getUser();
                const currentUserId = user?.id || 'user_123';

                // 'Weekly' -> last 7 days (API 'week')
                // 'Monthly' -> last 12 months (API 'year')
                const periodParam = period === 'Weekly' ? 'week' : 'year';

                const result = await getSalesAnalytics({
                    user_id: currentUserId,
                    period: periodParam
                });

                if (isMounted && result.result) {
                    const analytics = result.result as any;
                    const rawData = analytics.daily_breakdown || analytics.monthly_breakdown || [];

                    const chartData = rawData.map((d: any) => {
                        let label = '';
                        if (period === 'Weekly') {
                            // Date format: YYYY-MM-DD -> DD
                            label = new Date(d.date).getDate().toString();
                        } else {
                            // Month format: YYYY-MM -> MMM
                            const date = new Date(d.date || d.month);
                            label = date.toLocaleString('default', { month: 'short' });
                        }

                        return {
                            value: d.amount || 0,
                            label: label,
                            dataPointText: (d.amount || 0).toString(),
                            textColor: Colors.textSecondary,
                            dataPointColor: Colors.askYellowDark,
                        };
                    });

                    if (chartData.length === 0) {
                        setData([]);
                    } else {
                        setData(chartData);
                    }

                    setTotalRevenue(analytics.total_revenue || 0);
                }
            } catch (err) {
                console.error("Failed to fetch sales summary:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, [period]);

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>
                        {period === 'Weekly' ? "This Week's Balance" : "Yearly Balance"}
                    </Text>
                    <View style={styles.amountContainer}>
                        <Text style={styles.currency}>₹</Text>
                        <Text style={styles.amount}>{totalRevenue.toLocaleString()}</Text>
                    </View>
                </View>
                <View style={styles.badge}>
                    <TrendingUp size={14} color={Colors.trackGreenDark} />
                    <Text style={styles.badgeText}>+12%</Text>
                </View>
            </View>

            {/* Toggle */}
            <View style={styles.toggleContainer}>
                {(['Weekly', 'Monthly'] as const).map((p) => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.toggleButton, period === p && styles.toggleButtonActive]}
                        onPress={() => setPeriod(p)}
                    >
                        <Text style={[styles.toggleText, period === p && styles.toggleTextActive]}>
                            {p}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Chart */}
            <View style={styles.chartContainer}>
                {isLoading ? (
                    <View style={styles.loadingState}>
                        <ActivityIndicator size="large" color={Colors.askYellowDark} />
                    </View>
                ) : data.length > 0 ? (
                    <LineChart
                        data={data}
                        color={Colors.askYellowDark}
                        thickness={3}
                        dataPointsColor={Colors.askYellowDark}
                        startFillColor="rgba(124, 77, 255, 0.2)"
                        endFillColor="rgba(124, 77, 255, 0.05)"
                        startOpacity={0.9}
                        endOpacity={0.2}
                        areaChart
                        curved
                        hideRules
                        hideYAxisText={false}
                        yAxisLabelTexts={data.map(d => formatYLabel(d.value.toString()))}
                        formatYLabel={formatYLabel}
                        yAxisTextStyle={{ color: Colors.textTertiary, fontSize: 10 }}
                        xAxisLabelTextStyle={{ color: Colors.textTertiary, fontSize: 10 }}
                        width={CHART_WIDTH}
                        height={180}
                        spacing={period === 'Weekly' ? (CHART_WIDTH - 20) / 7 : (CHART_WIDTH - 20) / 12}
                        hideDataPoints={period === 'Monthly'}
                        initialSpacing={10}
                        adjustToWidth={false}
                        pointerConfig={{
                            pointerStripUptoDataPoint: true,
                            pointerStripColor: Colors.askYellowDark,
                            pointerStripWidth: 2,
                            strokeDashArray: [2, 5],
                            pointerColor: Colors.askYellowDark,
                            radius: 4,
                            pointerLabelWidth: 100,
                            pointerLabelHeight: 120,
                            activatePointersOnLongPress: true,
                            autoAdjustPointerLabelPosition: false,
                            pointerLabelComponent: (items: any) => {
                                return (
                                    <View
                                        style={{
                                            height: 100,
                                            width: 100,
                                            backgroundColor: '#282C3E',
                                            borderRadius: 4,
                                            justifyContent: 'center',
                                            paddingLeft: 16,
                                        }}>
                                        <Text style={{ color: 'white', fontSize: 12 }}>{items[0].label}</Text>
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>
                                            ₹{formatYLabel(items[0].value.toString())}
                                        </Text>
                                    </View>
                                );
                            },
                        }}
                    />
                ) : (
                    <View style={styles.noData}>
                        <Text style={styles.noDataText}>No data available for this period</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        // Removed marginHorizontal to respect parent padding from index.tsx
        marginBottom: Spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 4,
        fontWeight: '500',
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    currency: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textTertiary,
        marginTop: 4,
        marginRight: 2,
    },
    amount: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.trackGreen,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.trackGreenDark,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.surfaceVariant,
        borderRadius: BorderRadius.lg,
        padding: 4,
        marginBottom: Spacing.md,
        alignSelf: 'flex-start',
    },
    toggleButton: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: BorderRadius.md,
    },
    toggleButtonActive: {
        backgroundColor: Colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    toggleTextActive: {
        color: Colors.text,
        fontWeight: '600',
    },
    chartContainer: {
        alignItems: 'center',
        overflow: 'visible',
    },
    loadingState: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noData: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noDataText: {
        color: Colors.textTertiary,
        fontSize: 14,
    },
});
