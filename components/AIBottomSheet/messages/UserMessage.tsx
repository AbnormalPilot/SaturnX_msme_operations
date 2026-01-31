import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AITypography, BorderRadius, Colors } from '@/constants/theme';

export interface UserMessageProps {
  content: string;
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    maxWidth: '85%',
    alignSelf: 'flex-end',
  },
  bubble: {
    backgroundColor: Colors.userBubbleGradient1,
    borderRadius: BorderRadius.md,
    borderBottomRightRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text: {
    ...AITypography.messageUser,
    color: '#FFFFFF',
  },
});
