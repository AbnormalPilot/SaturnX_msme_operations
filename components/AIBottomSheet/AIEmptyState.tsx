import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AITypography, Colors, Spacing } from '@/constants/theme';

import { AIQuickActions } from './AIQuickActions';

interface AIEmptyStateProps {
  onActionPress: (query: string) => void;
}

export function AIEmptyState({ onActionPress }: AIEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Image
          source={require('@/assets/images/ai-logo.png')}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>How can I help?</Text>
      <Text style={styles.subtitle}>
        Ask me about sales, inventory, GST, or business tips
      </Text>

      <View style={styles.actionsContainer}>
        <AIQuickActions onActionPress={onActionPress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.askYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
  },
  title: {
    ...AITypography.emptyStateTitle,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...AITypography.emptyStateSubtitle,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  actionsContainer: {
    width: '100%',
  },
});
