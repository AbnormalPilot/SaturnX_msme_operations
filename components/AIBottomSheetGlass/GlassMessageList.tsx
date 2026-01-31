import { LinearGradient } from 'expo-linear-gradient';
import { FileText } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity, Linking, Share, Platform, Alert, Image } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { GlassColors, GlassRadius, GlassShadow, GlassSpacing } from '../../constants/glass-theme';
import { useUserStore } from '../../store/useUserStore';
import { Message } from '../AIBottomSheet/messages/MessageBubble';
import { GlassAvatar } from './GlassAvatar';
import { generatePDFFromDocumentData, sharePDF } from '../../utils/client-pdf-generator';

interface GlassMessageListProps {
  messages: Message[];
  isLoading: boolean;
  scrollViewRef?: React.RefObject<ScrollView>;
}

export function GlassMessageList({ messages, isLoading, scrollViewRef: externalScrollViewRef }: GlassMessageListProps) {
  const internalScrollViewRef = React.useRef<ScrollView>(null);
  const scrollViewRef = externalScrollViewRef || internalScrollViewRef;
  const { user } = useUserStore();
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('User');

  // Get user data
  useEffect(() => {
    if (user) {
      setUserAvatar(user.avatar_url || null);
      setUserName(user.name || user.shop_name || 'User');
    }
  }, [user]);

  const handleViewPDF = async (message: Message) => {
    try {
      // Priority 1: Check for direct PDF URL
      if (message.pdfUrl) {
        await Linking.openURL(message.pdfUrl);
        return;
      }

      // Priority 2: Check for base64 PDF data (direct or in documentData)
      let pdfData = message.pdfData;
      if (!pdfData && message.documentData) {
        const doc = message.documentData;
        pdfData = doc.pdf_base64 || doc.pdfData || doc.pdf || doc.base64;
      }

      if (pdfData && typeof pdfData === 'string' && pdfData.length > 100) {
        const fileName = `document_${Date.now()}.pdf`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, pdfData, {
          encoding: 'base64' as FileSystem.EncodingType,
        });

        await sharePDF(fileUri, 'Document');
        return;
      }

      // Priority 3: Generate PDF from documentData on-the-fly
      if (message.documentData && message.documentData.docType) {
        try {
          // Show generating message without blocking alert
          console.log('[PDF] Generating PDF from document data...');

          const pdfUri = await generatePDFFromDocumentData(message.documentData);

          // Share PDF without showing success alert (sharing dialog is confirmation enough)
          await sharePDF(pdfUri, message.documentData.title || 'Document');
        } catch (genError) {
          console.error('[PDF Generation] Error:', genError);
          Alert.alert(
            'PDF Generation Failed',
            genError instanceof Error ? genError.message : 'Unknown error occurred while generating PDF'
          );
        }
        return;
      }

      // If we reach here, we don't have enough data to create a PDF
      Alert.alert(
        'PDF Not Available',
        'This message doesn\'t contain enough data to generate a PDF. Try asking the AI to create a report or document.'
      );

    } catch (error) {
      console.error('[PDF Handler] Error:', error);
      console.error('[PDF Handler] Message data:', JSON.stringify(message));
      Alert.alert(
        'Error',
        'Failed to process PDF. ' + (error instanceof Error ? error.message : 'Unknown error. Please try again.')
      );
    }
  };

  React.useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  if (messages.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.emptyContent}>
          <View style={styles.emptyIconContainer}>
            <LinearGradient
              colors={GlassColors.gradient.neural}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.emptyIcon}>✨</Text>
          </View>
          <Text style={styles.emptyTitle}>Ready to help</Text>
          <Text style={styles.emptySubtitle}>Ask me anything about your business</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {messages.map((message, index) => (
        <View key={message.id} style={styles.messageWrapper}>
          <Animated.View
            entering={FadeInUp.duration(400).delay(index * 50)}
          >
          {message.role === 'user' ? (
            <View style={styles.userMessageContainer}>
              <LinearGradient
                colors={GlassColors.gradient.primary}
                style={styles.userMessage}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.userMessageText}>{message.content}</Text>
              </LinearGradient>
              <View style={styles.userAvatarContainer}>
                <GlassAvatar imageUrl={userAvatar} name={userName} size={32} />
              </View>
            </View>
          ) : (
            <View style={styles.aiMessageContainer}>
              <View style={styles.aiAvatarContainer}>
                <GlassAvatar isAI size={32} />
              </View>
              <View>
                <View style={styles.aiMessage}>
                  <Text style={styles.aiMessageText}>{message.content}</Text>
                </View>

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

                {/* PDF Button */}
                {(message.pdfData || message.pdfUrl || message.documentData) && (
                  <TouchableOpacity
                    style={styles.pdfButton}
                    onPress={() => handleViewPDF(message)}
                  >
                    <FileText size={18} color="#667eea" strokeWidth={2.5} />
                    <Text style={styles.pdfButtonText}>View & Share PDF</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          </Animated.View>
        </View>
      ))}

      {isLoading && (
        <Animated.View entering={FadeIn.duration(300)} style={styles.loadingContainer}>
          <View style={styles.aiAvatarContainer}>
            <GlassAvatar isAI size={32} />
          </View>
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={GlassColors.gradient.primary[0]} />
          </View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingVertical: GlassSpacing.lg,
    gap: GlassSpacing.md,
  },

  messageWrapper: {
    marginBottom: GlassSpacing.sm,
  },

  // User messages
  userMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: GlassSpacing.sm,
  },

  userMessage: {
    maxWidth: '75%',
    paddingHorizontal: GlassSpacing.lg,
    paddingVertical: GlassSpacing.md,
    borderRadius: GlassRadius.lg,
    borderBottomRightRadius: GlassSpacing.xs,
    ...GlassShadow.sm,
  },

  userMessageText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
    lineHeight: 22,
  },

  userAvatarContainer: {
    marginBottom: 2,
  },

  // AI messages
  aiMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: GlassSpacing.sm,
  },

  aiAvatarContainer: {
    marginTop: 2,
  },

  aiMessage: {
    maxWidth: '80%',
    paddingHorizontal: GlassSpacing.lg,
    paddingVertical: GlassSpacing.md,
    borderRadius: GlassRadius.lg,
    borderBottomLeftRadius: GlassSpacing.xs,
    backgroundColor: '#F5F5F5', // Solid light gray
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...GlassShadow.sm,
  },

  aiMessageText: {
    fontSize: 15,
    color: GlassColors.text.primary,
    lineHeight: 22,
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: GlassSpacing.sm,
  },

  loadingBubble: {
    paddingHorizontal: GlassSpacing.xl,
    paddingVertical: GlassSpacing.lg,
    borderRadius: GlassRadius.lg,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: GlassSpacing.xxl,
  },

  emptyContent: {
    alignItems: 'center',
    gap: GlassSpacing.md,
  },

  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: GlassRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: GlassSpacing.sm,
  },

  emptyIcon: {
    fontSize: 40,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: GlassColors.text.primary,
    letterSpacing: -0.3,
  },

  emptySubtitle: {
    fontSize: 15,
    color: GlassColors.text.secondary,
    textAlign: 'center',
  },

  // QR Code
  qrCodeContainer: {
    alignItems: 'center',
    padding: GlassSpacing.lg,
    marginTop: GlassSpacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: GlassRadius.lg,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...GlassShadow.sm,
  },

  qrCodeImage: {
    width: 180,
    height: 180,
    borderRadius: GlassRadius.md,
    backgroundColor: '#FFFFFF',
  },

  qrCodeLabel: {
    marginTop: GlassSpacing.sm,
    fontSize: 13,
    color: GlassColors.text.secondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // PDF Button
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GlassSpacing.sm,
    marginTop: GlassSpacing.sm,
    paddingHorizontal: GlassSpacing.lg,
    paddingVertical: GlassSpacing.md,
    backgroundColor: '#F3E5F5',
    borderRadius: GlassRadius.lg,
    borderWidth: 1,
    borderColor: '#E1BEE7',
    ...GlassShadow.sm,
  },

  pdfButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    letterSpacing: -0.2,
  },
});
