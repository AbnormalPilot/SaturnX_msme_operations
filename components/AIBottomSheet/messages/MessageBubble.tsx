import { FileText } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { DocumentCard } from '@/components/DocumentCard';

import { AIMessage } from './AIMessage';
import { UserMessage } from './UserMessage';
import { ActionableCard, CardData } from './rich-content/ActionableCard';
import { ListMessage, ListData } from './rich-content/ListMessage';
import { TableMessage, TableData } from './rich-content/TableMessage';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  qrCode?: string;
  pdfData?: string;
  pdfUrl?: string;
  documentData?: any;
  navigationAction?: string;
  // Rich content types
  table?: TableData;
  list?: ListData;
  card?: CardData;
}

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: () => void;
  onFavorite?: () => void;
  onViewPDF?: (message: Message) => void;
  isFavorite?: boolean;
}

export function MessageBubble({
  message,
  onRegenerate,
  onFavorite,
  onViewPDF,
  isFavorite = false,
}: MessageBubbleProps) {
  if (message.role === 'user') {
    return (
      <View style={styles.container}>
        <UserMessage content={message.content} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AIMessage
        content={message.content}
        onRegenerate={onRegenerate}
        onFavorite={onFavorite}
        isFavorite={isFavorite}
      />

      {/* QR Code */}
      {message.qrCode && (
        <View style={styles.qrCodeContainer}>
          <Image
            source={{ uri: `data:image/png;base64,${message.qrCode}` }}
            style={styles.qrCodeImage}
            resizeMode="contain"
          />
          <Text style={styles.qrCodeLabel}>Scan to Pay</Text>
        </View>
      )}

      {/* PDF/Document */}
      {(message.pdfData || message.pdfUrl || message.documentData) && (
        <View style={styles.documentContainer}>
          {message.documentData ? (
            <DocumentCard
              documentData={message.documentData}
              onGenerate={() => onViewPDF?.(message)}
            />
          ) : (
            <TouchableOpacity
              style={styles.pdfButton}
              onPress={() => onViewPDF?.(message)}
            >
              <FileText size={20} color="#E53935" />
              <Text style={styles.pdfButtonText}>View & Share PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Rich Content Types */}
      {message.table && (
        <View style={styles.richContentContainer}>
          <TableMessage data={message.table} />
        </View>
      )}

      {message.list && (
        <View style={styles.richContentContainer}>
          <ListMessage data={message.list} />
        </View>
      )}

      {message.card && (
        <View style={styles.richContentContainer}>
          <ActionableCard data={message.card} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  qrCodeContainer: {
    alignItems: 'center',
    padding: 12,
    marginTop: 8,
    marginLeft: 32, // Offset for AI avatar
  },
  qrCodeImage: {
    width: 150,
    height: 150,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
  },
  qrCodeLabel: {
    marginTop: 8,
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  documentContainer: {
    marginTop: 8,
    marginLeft: 32, // Offset for AI avatar
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  pdfButtonText: {
    color: '#D32F2F',
    fontWeight: '600',
    fontSize: 13,
  },
  richContentContainer: {
    marginTop: 8,
    marginLeft: 32, // Offset for AI avatar
    marginRight: 8,
  },
});
