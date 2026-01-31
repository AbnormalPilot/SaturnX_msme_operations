import { Link } from 'expo-router';
import { BarChart2, IndianRupee, Megaphone, Package, Truck, Users } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { Agent } from '../store/useAgentStore';

const iconMap: Record<string, any> = {
    package: Package,
    users: Users,
    'indian-rupee': IndianRupee,
    megaphone: Megaphone,
    truck: Truck,
    'bar-chart-2': BarChart2,
};

interface AgentCardProps {
    agent: Agent;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent }) => {
    const theme = useTheme();
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    // Pulse animation for active agents
    useEffect(() => {
        if (agent.status === 'Active' || agent.status === 'Working') {
            opacity.value = withRepeat(
                withSequence(
                    withTiming(0.7, { duration: 1000 }),
                    withTiming(1, { duration: 1000 })
                ),
                -1,
                true
            );
        } else {
            opacity.value = withTiming(1);
        }
    }, [agent.status]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const IconComponent = iconMap[agent.icon] || Package;

    const handlePressIn = () => {
        scale.value = withTiming(0.95);
    };

    const handlePressOut = () => {
        scale.value = withTiming(1);
    };

    return (
        <Link href={`/agent/${agent.id}`} asChild>
            <TouchableOpacity
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
                style={styles.container}
            >
                <Animated.View style={[styles.wrapper, animatedStyle, { backgroundColor: agent.color }]}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <IconComponent size={24} color="#FFF" />
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: agent.status === 'Active' ? '#34A853' : 'rgba(0,0,0,0.2)' }]}>
                            <Text style={styles.statusText}>{agent.status}</Text>
                        </View>
                    </View>

                    <View style={styles.content}>
                        <Text variant="titleMedium" style={styles.name}>{agent.name}</Text>
                        <Text variant="bodySmall" style={styles.action} numberOfLines={2}>
                            {agent.lastAction}
                        </Text>
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </Link>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 8,
        height: 140,
    },
    wrapper: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    iconContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    content: {
        marginTop: 'auto',
    },
    name: {
        color: '#FFF',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    action: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
    },
});
