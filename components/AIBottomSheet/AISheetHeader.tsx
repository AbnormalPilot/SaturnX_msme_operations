import { History } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

interface AISheetHeaderProps {
  panGesture?: any;
  tapGesture?: any;
  onHistoryPress?: () => void;
}

export function AISheetHeader({ panGesture, tapGesture, onHistoryPress }: AISheetHeaderProps) {
  const insets = useSafeAreaInsets();

  const composedGesture = panGesture && tapGesture
    ? Gesture.Race(panGesture, tapGesture)
    : undefined;

  const content = (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      {onHistoryPress && (
        <TouchableOpacity style={styles.historyButton} onPress={onHistoryPress}>
          <History size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}

      <View style={styles.header}>
        <View style={styles.indicator}>
          <Image
            source={require('@/assets/images/ai-logo.png')}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Ask BusinessAI</Text>
        <Text style={styles.subtitle}>Swipe up to chat</Text>
      </View>
    </View>
  );

  if (composedGesture) {
    return <GestureDetector gesture={composedGesture}>{content}</GestureDetector>;
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
  },
  indicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.askYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyButton: {
    position: 'absolute',
    right: 16,
    top: 20,
    padding: 8,
    zIndex: 10,
  },
});
