import { LinearGradient } from 'expo-linear-gradient';
import { Package, TrendingUp, FileText, Zap } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { GlassColors, GlassRadius, GlassShadow, GlassSpacing } from '../../constants/glass-theme';
import { useUserStore } from '../../store/useUserStore';

interface QuickAction {
  icon: any;
  label: string;
  query: string;
  gradient: string[];
}

const QUICK_ACTIONS_BY_LANGUAGE: Record<'en' | 'hi' | 'hi-en', QuickAction[]> = {
  en: [
    {
      icon: TrendingUp,
      label: 'Sales',
      query: 'Show today\'s sales summary',
      gradient: GlassColors.gradient.success,
    },
    {
      icon: Package,
      label: 'Stock',
      query: 'Show low stock items',
      gradient: GlassColors.gradient.secondary,
    },
    {
      icon: FileText,
      label: 'Invoice',
      query: 'Create a new invoice',
      gradient: GlassColors.gradient.accent,
    },
    {
      icon: Zap,
      label: 'Insights',
      query: 'Give me business insights',
      gradient: GlassColors.gradient.primary,
    },
  ],
  'hi-en': [ // Hinglish
    {
      icon: TrendingUp,
      label: 'Sales',
      query: 'Aaj ki sales dikha',
      gradient: GlassColors.gradient.success,
    },
    {
      icon: Package,
      label: 'Stock',
      query: 'Low stock items batao',
      gradient: GlassColors.gradient.secondary,
    },
    {
      icon: FileText,
      label: 'Bill',
      query: 'Naya bill banao',
      gradient: GlassColors.gradient.accent,
    },
    {
      icon: Zap,
      label: 'Insights',
      query: 'Business insights do',
      gradient: GlassColors.gradient.primary,
    },
  ],
  hi: [ // Pure Hindi
    {
      icon: TrendingUp,
      label: 'बिक्री',
      query: 'आज की बिक्री दिखाएं',
      gradient: GlassColors.gradient.success,
    },
    {
      icon: Package,
      label: 'स्टॉक',
      query: 'कम स्टॉक वाली वस्तुएं दिखाएं',
      gradient: GlassColors.gradient.secondary,
    },
    {
      icon: FileText,
      label: 'बिल',
      query: 'नया बिल बनाएं',
      gradient: GlassColors.gradient.accent,
    },
    {
      icon: Zap,
      label: 'विश्लेषण',
      query: 'व्यापार विश्लेषण दिखाएं',
      gradient: GlassColors.gradient.primary,
    },
  ],
};

interface GlassQuickActionsProps {
  onActionPress: (query: string) => void;
}

export function GlassQuickActions({ onActionPress }: GlassQuickActionsProps) {
  const language = useUserStore((state) => state.language);
  const quickActions = QUICK_ACTIONS_BY_LANGUAGE[language] || QUICK_ACTIONS_BY_LANGUAGE['hi-en'];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {quickActions.map((action, index) => (
          <Animated.View
            key={action.label}
            entering={FadeInRight.duration(400).delay(index * 100)}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onActionPress(action.query)}
            >
              <View style={styles.actionCard}>
                <View style={styles.iconContainer}>
                  <LinearGradient
                    colors={action.gradient}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <action.icon size={18} color="#fff" strokeWidth={2.5} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: GlassSpacing.lg,
  },

  scrollContent: {
    paddingHorizontal: GlassSpacing.lg,
    gap: GlassSpacing.md,
  },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GlassSpacing.sm,
    paddingHorizontal: GlassSpacing.lg,
    paddingVertical: GlassSpacing.md,
    borderRadius: GlassRadius.xl,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...GlassShadow.sm,
  },

  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: GlassRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: GlassColors.text.primary,
    letterSpacing: -0.2,
  },
});
