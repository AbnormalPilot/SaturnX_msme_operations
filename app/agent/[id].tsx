import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, BarChart2, CheckCircle, Clock, IndianRupee, Megaphone, Package, Pause, Play, RefreshCw, Settings, Truck, Users } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAgentStore } from '../../store/useAgentStore';

const BLUE = '#4285F4';
const iconMap: Record<string, any> = { 'package': Package, 'users': Users, 'indian-rupee': IndianRupee, 'megaphone': Megaphone, 'truck': Truck, 'bar-chart-2': BarChart2 };

export default function AgentDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { agents, logs } = useAgentStore();
    const agent = agents.find(a => a.id === id);
    const agentLogs = logs.filter(l => l.agentId === id).slice(0, 10);

    if (!agent) return <View style={styles.container}><Text style={{ color: '#FFF' }}>Agent not found</Text></View>;

    const IconComponent = iconMap[agent.icon] || Package;
    const quickActions = [
        { icon: Play, label: 'Start' }, { icon: Pause, label: 'Pause' }, { icon: RefreshCw, label: 'Restart' }, { icon: Settings, label: 'Configure' }
    ];
    const capabilities = ['Monitor inventory levels', 'Predict reorder points', 'Generate order suggestions', 'Track expiry dates'];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><ArrowLeft size={24} color="#FFF" /></TouchableOpacity>
                    <TouchableOpacity style={styles.settingsBtn}><Settings size={20} color="#FFF" /></TouchableOpacity>
                </View>
                <View style={styles.agentInfo}>
                    <View style={styles.agentIconLarge}><IconComponent size={32} color={BLUE} /></View>
                    <Text style={styles.agentName}>{agent.name}</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: agent.status === 'Active' || agent.status === 'Working' ? BLUE : '#666' }]} />
                        <Text style={styles.statusText}>{agent.status}</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsRow}>
                    {quickActions.map((action, i) => {
                        const ActionIcon = action.icon;
                        return (
                            <TouchableOpacity key={i} style={styles.actionBtn}>
                                <View style={styles.actionIcon}><ActionIcon size={20} color="#FFF" /></View>
                                <Text style={styles.actionLabel}>{action.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.descCard}>
                    <Text style={styles.descTitle}>About this Agent</Text>
                    <Text style={styles.descText}>{agent.description}</Text>
                </View>

                <Text style={styles.sectionTitle}>Capabilities</Text>
                <View style={styles.capCard}>
                    {capabilities.map((cap, i) => (
                        <View key={i} style={styles.capItem}><CheckCircle size={18} color={BLUE} /><Text style={styles.capText}>{cap}</Text></View>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Recent Activity</Text>
                {agentLogs.length > 0 ? agentLogs.map(log => (
                    <View key={log.id} style={styles.logItem}>
                        <View style={styles.logIcon}><Clock size={16} color="#666" /></View>
                        <View style={styles.logContent}><Text style={styles.logText}>{log.message}</Text><Text style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</Text></View>
                    </View>
                )) : <View style={styles.emptyLog}><Text style={styles.emptyText}>No recent activity</Text></View>}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: { backgroundColor: '#1A1A1A', paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
    settingsBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
    agentInfo: { alignItems: 'center' },
    agentIconLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    agentName: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
    scrollContent: { padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 16 },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    actionBtn: { alignItems: 'center' },
    actionIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    actionLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
    descCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 24 },
    descTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
    descText: { fontSize: 15, lineHeight: 24, color: '#000' },
    capCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 24 },
    capItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    capText: { fontSize: 14, color: '#000', flex: 1 },
    logItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, marginBottom: 8 },
    logIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    logContent: { flex: 1 },
    logText: { fontSize: 14, color: '#FFF' },
    logTime: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
    emptyLog: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 24, alignItems: 'center' },
    emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
});
