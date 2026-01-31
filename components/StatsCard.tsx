import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Surface, Text } from 'react-native-paper';

interface StatsCardProps {
    title: string;
    value: string;
    trend?: string;
    trendUp?: boolean;
    icon: React.ReactNode;
    color: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, trend, trendUp, icon, color }) => {
    return (
        <Surface style={styles.container} elevation={2}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                {icon}
            </View>
            <View style={styles.content}>
                <Text variant="titleLarge" style={styles.value}>{value}</Text>
                <Text variant="bodySmall" style={styles.title}>{title}</Text>
                {trend && (
                    <Text style={[styles.trend, { color: trendUp ? '#34A853' : '#EA4335' }]}>
                        {trend}
                    </Text>
                )}
            </View>
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 8,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        padding: 12,
        borderRadius: 12,
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    value: {
        fontWeight: 'bold',
        color: '#202124',
    },
    title: {
        color: '#5f6368',
    },
    trend: {
        fontSize: 12,
        marginTop: 2,
        fontWeight: '500',
    },
});
