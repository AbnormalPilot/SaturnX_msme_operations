import * as Haptics from 'expo-haptics';
import { Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AITypography, BorderRadius, Colors } from '@/constants/theme';

import { MessageActions } from './MessageActions';
import { TypewriterText } from './TypewriterText';

export interface AIMessageProps {
  content: string;
  onRegenerate?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  showActions?: boolean;
}

export function AIMessage({
  content,
  onRegenerate,
  onFavorite,
  isFavorite = false,
  showActions = true,
}: AIMessageProps) {
  const [actionsVisible, setActionsVisible] = useState(false);

  const handleLongPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActionsVisible(!actionsVisible);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Sparkles size={12} color={Colors.askYellowDark} />
      </View>

      <Pressable onLongPress={handleLongPress} style={styles.bubble}>
        <View style={styles.contentContainer}>
          <TypewriterText text={content} style={styles.text} />
        </View>

        {showActions && actionsVisible && (
          <MessageActions
            content={content}
            onRegenerate={onRegenerate}
            onFavorite={onFavorite}
            isFavorite={isFavorite}
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.askYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  bubble: {
    flex: 1,
    backgroundColor: Colors.aiBubble,
    borderRadius: BorderRadius.md,
    borderBottomLeftRadius: 4,
    overflow: 'hidden',
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    ...AITypography.messageAI,
    color: Colors.text,
  },
});
