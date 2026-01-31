import * as Haptics from 'expo-haptics';
import { ArrowRight, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, Colors, Spacing } from '@/constants/theme';

export interface CardData {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onPress: () => void;
  };
  variant?: 'default' | 'success' | 'warning' | 'error';
}

interface ActionableCardProps {
  data: CardData;
}

export function ActionableCard({ data }: ActionableCardProps) {
  const Icon = data.icon;

  const variantColors = {
    default: { bg: Colors.surfaceVariant, accent: Colors.primary },
    success: { bg: '#E8F5E9', accent: Colors.secondary },
    warning: { bg: '#FFF3E0', accent: Colors.accent },
    error: { bg: '#FFEBEE', accent: Colors.error },
  };

  const colors = variantColors[data.variant || 'default'];

  const handleActionPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    data.action?.onPress();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        {Icon && (
          <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
            <Icon size={24} color={colors.accent} />
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={styles.title}>{data.title}</Text>
          {data.description && <Text style={styles.description}>{data.description}</Text>}
        </View>
      </View>

      {data.action && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent }]}
          onPress={handleActionPress}
          activeOpacity={0.8}
        >
          <Text style={styles.actionLabel}>{data.action.label}</Text>
          <ArrowRight size={16} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
