import { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BorderRadius, Colors, Spacing } from '../constants/theme';

interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  backgroundColor: string;
  iconColor: string;
  onPress: () => void;
  delay?: number;
}

export default function ActionCard({
  title,
  subtitle,
  icon: Icon,
  backgroundColor,
  iconColor,
  onPress,
  delay = 0,
}: ActionCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400).springify()}
      style={styles.container}
    >
      <TouchableOpacity
        style={[styles.card, { backgroundColor }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
          <Icon size={28} color={iconColor} strokeWidth={2} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    minHeight: 160,
    height: '100%', // Fill the flex container
    justifyContent: 'space-between', // Distribute content
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
