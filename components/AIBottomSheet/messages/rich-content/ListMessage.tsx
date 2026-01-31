import { Check, Circle } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Colors, Spacing } from '@/constants/theme';

export interface ListData {
  title?: string;
  items: Array<{
    text: string;
    checked?: boolean;
    highlighted?: boolean;
  }>;
  ordered?: boolean;
}

interface ListMessageProps {
  data: ListData;
}

export function ListMessage({ data }: ListMessageProps) {
  return (
    <View style={styles.container}>
      {data.title && <Text style={styles.title}>{data.title}</Text>}

      <View style={styles.list}>
        {data.items.map((item, index) => (
          <View
            key={index}
            style={[styles.listItem, item.highlighted && styles.listItemHighlighted]}
          >
            {data.ordered ? (
              <Text style={styles.bullet}>{index + 1}.</Text>
            ) : item.checked !== undefined ? (
              item.checked ? (
                <Check size={16} color={Colors.secondary} />
              ) : (
                <Circle size={16} color={Colors.textSecondary} />
              )
            ) : (
              <View style={styles.dot} />
            )}
            <Text style={styles.itemText}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceVariant,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    padding: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  list: {
    padding: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  listItemHighlighted: {
    backgroundColor: Colors.aiAccentLight,
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginHorizontal: -Spacing.xs,
  },
  bullet: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    minWidth: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 7,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
});
