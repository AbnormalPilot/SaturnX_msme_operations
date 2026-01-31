import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BorderRadius, Colors, Spacing } from '@/constants/theme';

export interface TableData {
  title?: string;
  headers: string[];
  rows: string[][];
}

interface TableMessageProps {
  data: TableData;
}

export function TableMessage({ data }: TableMessageProps) {
  return (
    <View style={styles.container}>
      {data.title && <Text style={styles.title}>{data.title}</Text>}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <View>
          {/* Header Row */}
          <View style={styles.headerRow}>
            {data.headers.map((header, index) => (
              <View key={index} style={styles.headerCell}>
                <Text style={styles.headerText}>{header}</Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {data.rows.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={[styles.dataRow, rowIndex % 2 === 0 && styles.dataRowEven]}
            >
              {row.map((cell, cellIndex) => (
                <View key={cellIndex} style={styles.dataCell}>
                  <Text style={styles.dataText}>{cell}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.surfaceVariant,
  },
  scrollView: {
    maxHeight: 300,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
  },
  headerCell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dataRowEven: {
    backgroundColor: Colors.surfaceVariant,
  },
  dataCell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 100,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  dataText: {
    fontSize: 13,
    color: Colors.text,
  },
});
