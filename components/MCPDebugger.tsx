/**
 * MCP Debugger Component
 * Add this to any screen to test MCP tool execution
 *
 * Usage:
 * import MCPDebugger from '@/components/MCPDebugger';
 * <MCPDebugger />
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { callMCPTool, checkMCPHealth, getMCPTools } from '@/utils/mcp-client';
import { supabase } from '@/utils/supabase';

export default function MCPDebugger() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    clearLogs();
    addLog('🔍 Testing MCP connection...');

    try {
      // Test 1: Check authentication
      addLog('1️⃣ Checking authentication...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addLog('❌ Not authenticated!');
        Alert.alert('Error', 'Please sign in first');
        setIsLoading(false);
        return;
      }
      setUserId(session.user.id);
      addLog(`✅ User ID: ${session.user.id}`);
      addLog(`✅ Token: ${session.access_token.substring(0, 20)}...`);

      // Test 2: Check server health
      addLog('2️⃣ Checking server health...');
      const isHealthy = await checkMCPHealth();
      if (!isHealthy) {
        addLog('❌ MCP server is down or unreachable!');
        setIsLoading(false);
        return;
      }
      addLog('✅ Server is healthy');

      // Test 3: List available tools
      addLog('3️⃣ Listing available tools...');
      const tools = await getMCPTools();
      addLog(`✅ Found ${tools.length} tools`);
      addLog(`   First 5: ${tools.slice(0, 5).join(', ')}`);

      // Test 4: Call get_products tool
      addLog('4️⃣ Testing get_products tool...');
      const result = await callMCPTool({
        name: 'get_products',
        arguments: { user_id: session.user.id },
      });

      if (result.error) {
        addLog(`❌ get_products failed: ${result.error}`);
      } else if (result.result) {
        const products = result.result as any;
        addLog(`✅ get_products succeeded!`);
        addLog(`   Found ${products.products?.length || 0} products`);
        if (products.products && products.products.length > 0) {
          addLog(`   First product: ${products.products[0].name}`);
        }
      } else {
        addLog('⚠️  get_products returned unexpected format');
        addLog(`   Response: ${JSON.stringify(result).substring(0, 100)}`);
      }

      // Test 5: Call get_inventory_alerts
      addLog('5️⃣ Testing get_inventory_alerts tool...');
      const alertsResult = await callMCPTool({
        name: 'get_inventory_alerts',
        arguments: { user_id: session.user.id },
      });

      if (alertsResult.error) {
        addLog(`❌ get_inventory_alerts failed: ${alertsResult.error}`);
      } else {
        addLog('✅ get_inventory_alerts succeeded!');
      }

      addLog('━━━━━━━━━━━━━━━━━━━━━━━');
      addLog('✅ All tests completed!');
    } catch (error: any) {
      addLog(`❌ Exception: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSpecificTool = async (toolName: string, args: Record<string, any>) => {
    setIsLoading(true);
    addLog(`🔧 Testing ${toolName}...`);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        addLog('❌ Not authenticated!');
        setIsLoading(false);
        return;
      }

      const result = await callMCPTool({
        name: toolName,
        arguments: { ...args, user_id: session.user.id },
      });

      if (result.error) {
        addLog(`❌ ${toolName} failed: ${result.error}`);
      } else {
        addLog(`✅ ${toolName} succeeded!`);
        addLog(`   Result: ${JSON.stringify(result).substring(0, 200)}`);
      }
    } catch (error: any) {
      addLog(`❌ Exception: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) {
    return (
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsVisible(true)}
      >
        <Text style={styles.floatingButtonText}>🔧</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>MCP Debugger</Text>
        <TouchableOpacity onPress={() => setIsVisible(false)}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={testConnection}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Run Tests</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonSecondary} onPress={clearLogs}>
          <Text style={styles.buttonSecondaryText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Tests */}
      <View style={styles.quickTests}>
        <Text style={styles.quickTestsTitle}>Quick Tests:</Text>
        <TouchableOpacity
          style={styles.quickTestButton}
          onPress={() => testSpecificTool('get_products', {})}
        >
          <Text style={styles.quickTestText}>get_products</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickTestButton}
          onPress={() => testSpecificTool('get_sales_analytics', { period: 'week' })}
        >
          <Text style={styles.quickTestText}>get_sales_analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickTestButton}
          onPress={() => testSpecificTool('get_business_summary', {})}
        >
          <Text style={styles.quickTestText}>get_business_summary</Text>
        </TouchableOpacity>
      </View>

      {/* Logs */}
      <ScrollView style={styles.logsContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
        {logs.length === 0 && (
          <Text style={styles.emptyText}>No logs yet. Run tests to see results.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  floatingButtonText: {
    fontSize: 24,
  },
  container: {
    position: 'absolute',
    top: 60,
    left: 10,
    right: 10,
    bottom: 100,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#667eea',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  buttonSecondary: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  buttonSecondaryText: {
    color: '#666',
    fontWeight: '600',
  },
  quickTests: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  quickTestsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  quickTestButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  quickTestText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#667eea',
  },
  logsContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  logText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
});
