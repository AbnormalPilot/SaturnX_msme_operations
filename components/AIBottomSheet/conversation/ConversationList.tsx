import AsyncStorage from '@react-native-async-storage/async-storage';
import { Clock, Star } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { Message } from '../messages/MessageBubble';

export interface Conversation {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messages: Message[];
  isFavorite: boolean;
}

interface ConversationListProps {
  onSelect: (conversation: Conversation) => void;
  onClose: () => void;
}

const STORAGE_KEY = '@vyapar_ai_conversations';

export function ConversationList({ onSelect, onClose }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const withDates = parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setConversations(withDates);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }

  const toggleFavorite = async (id: string) => {
    const updated = conversations.map((conv) =>
      conv.id === id ? { ...conv, isFavorite: !conv.isFavorite } : conv
    );
    setConversations(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteConversation = async (id: string) => {
    const updated = conversations.filter((conv) => conv.id !== id);
    setConversations(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversation History</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>Close</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
          >
            <View style={styles.conversationContent}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                  <Star
                    size={16}
                    color={item.isFavorite ? Colors.accent : Colors.textTertiary}
                    fill={item.isFavorite ? Colors.accent : 'transparent'}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.preview} numberOfLines={2}>
                {item.preview}
              </Text>
              <View style={styles.footer}>
                <Clock size={12} color={Colors.textTertiary} />
                <Text style={styles.time}>{formatRelativeTime(item.timestamp)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        }
      />
    </View>
  );
}

// Helper function to save a new conversation
export async function saveConversation(messages: Message[], title?: string) {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const existing = stored ? JSON.parse(stored) : [];

    const newConv: Conversation = {
      id: Date.now().toString(),
      title: title || messages[0]?.content.substring(0, 50) || 'New conversation',
      preview: messages[messages.length - 1]?.content.substring(0, 100) || '',
      timestamp: new Date(),
      messages,
      isFavorite: false,
    };

    const updated = [newConv, ...existing].slice(0, 50); // Keep last 50
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save conversation:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  conversationItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  conversationContent: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  preview: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  time: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
