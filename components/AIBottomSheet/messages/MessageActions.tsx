import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Copy, RefreshCw, Share2, Star } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/theme';

interface MessageActionsProps {
  content: string;
  onRegenerate?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export function MessageActions({
  content,
  onRegenerate,
  onFavorite,
  isFavorite = false,
}: MessageActionsProps) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(content);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShare = async () => {
    // TODO: Implement share functionality
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRegenerate = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRegenerate?.();
  };

  const handleFavorite = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFavorite?.();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleCopy}
        style={styles.actionButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Copy size={14} color={Colors.actionIconNeutral} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleShare}
        style={styles.actionButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Share2 size={14} color={Colors.actionIconNeutral} />
      </TouchableOpacity>

      {onRegenerate && (
        <TouchableOpacity
          onPress={handleRegenerate}
          style={styles.actionButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <RefreshCw size={14} color={Colors.actionIconNeutral} />
        </TouchableOpacity>
      )}

      {onFavorite && (
        <TouchableOpacity
          onPress={handleFavorite}
          style={styles.actionButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Star
            size={14}
            color={isFavorite ? Colors.accent : Colors.actionIconNeutral}
            fill={isFavorite ? Colors.accent : 'transparent'}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  actionButton: {
    padding: 4,
  },
});
