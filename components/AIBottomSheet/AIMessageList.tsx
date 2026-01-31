import { FlashList } from '@shopify/flash-list';
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Colors, Spacing } from '@/constants/theme';

import { Message, MessageBubble } from './messages/MessageBubble';

interface AIMessageListProps {
  messages: Message[];
  isTyping: boolean;
  loadingText: string;
  onRegenerate?: (messageId: string) => void;
  onFavorite?: (messageId: string) => void;
  onViewPDF?: (message: Message) => void;
}

export function AIMessageList({
  messages,
  isTyping,
  loadingText,
  onRegenerate,
  onFavorite,
  onViewPDF,
}: AIMessageListProps) {
  const listRef = useRef<FlashList<Message>>(null);

  return (
    <FlashList
      ref={listRef}
      data={messages}
      renderItem={({ item }) => (
        <MessageBubble
          message={item}
          onRegenerate={() => onRegenerate?.(item.id)}
          onFavorite={() => onFavorite?.(item.id)}
          onViewPDF={onViewPDF}
        />
      )}
      estimatedItemSize={80}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      keyExtractor={(item) => item.id}
      onContentSizeChange={() => {
        // Auto-scroll to bottom when new messages are added
        if (messages.length > 0) {
          listRef.current?.scrollToEnd({ animated: true });
        }
      }}
      ListFooterComponent={
        isTyping ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.typingContainer}>
            <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingText}>
                <Animated.Text style={styles.loadingText}>{loadingText}</Animated.Text>
              </View>
            </View>
          </Animated.View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: Spacing.sm,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 12,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 12,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textTertiary,
  },
  typingText: {
    marginLeft: 4,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
