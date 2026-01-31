import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, Colors, Spacing } from '@/constants/theme';

interface Command {
  command: string;
  description: string;
  example: string;
}

const COMMANDS: Command[] = [
  {
    command: '/invoice',
    description: 'Create invoice',
    example: '/invoice for Ram ₹5000',
  },
  {
    command: '/report',
    description: 'Generate report',
    example: '/report sales this week',
  },
  {
    command: '/stock',
    description: 'Check inventory',
    example: '/stock low items',
  },
  {
    command: '/gst',
    description: 'Calculate GST',
    example: '/gst ₹10000 at 18%',
  },
  {
    command: '/forecast',
    description: 'Stock forecasting',
    example: '/forecast what to restock',
  },
  {
    command: '/customer',
    description: 'Customer info',
    example: '/customer Ramesh balance',
  },
];

interface SlashCommandsProps {
  inputValue: string;
  onSelectCommand: (command: string) => void;
}

export function SlashCommands({ inputValue, onSelectCommand }: SlashCommandsProps) {
  const [filtered, setFiltered] = useState<Command[]>([]);

  useEffect(() => {
    if (inputValue.startsWith('/')) {
      const query = inputValue.slice(1).toLowerCase();
      const matches = COMMANDS.filter((cmd) =>
        cmd.command.slice(1).toLowerCase().includes(query) ||
        cmd.description.toLowerCase().includes(query)
      );
      setFiltered(matches);
    } else {
      setFiltered([]);
    }
  }, [inputValue]);

  if (filtered.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.command}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.commandItem}
            onPress={() => onSelectCommand(item.command)}
            activeOpacity={0.7}
          >
            <Text style={styles.command}>{item.command}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.example}>{item.example}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60,
    left: Spacing.md,
    right: Spacing.md,
    maxHeight: 200,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  commandItem: {
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  command: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  example: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
});
