import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
  ArrowLeft,
  FileText,
  HelpCircle,
  Mic,
  Package,
  Receipt,
  Send,
  Share,
  Sparkles,
  TrendingUp
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DocumentCard } from '../components/DocumentCard';

import { BorderRadius, Colors, Spacing } from '../constants/theme';
import { formatConversationHistory, sendMessage } from '../utils/ai-service';
import { generateGenericHTML, generateInvoiceHTML, generateMarkdownHTML, generateReportHTML } from '../utils/pdf-utils';
import { VoiceAssistant } from '../components/VoiceAssistant';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  qrCode?: string; // Base64 QR code image
  pdfData?: string; // Base64 PDF data (legacy)
  pdfUrl?: string; // URL to the generated PDF (legacy)
  documentData?: {
    docType: 'invoice' | 'report' | 'markdown';
    [key: string]: any;
  };
}

interface QuickAction {
  icon: typeof TrendingUp;
  label: string;
  query: string;
}

// DocumentCard moved to components/DocumentCard.tsx

const quickActions: QuickAction[] = [
  { icon: TrendingUp, label: 'Sales Report', query: 'Show me my sales report for this week' },
  { icon: Package, label: 'Low Stock', query: 'Which items are running low on stock?' },
  { icon: Receipt, label: 'GST Help', query: 'Help me calculate GST for my invoice' },
  { icon: HelpCircle, label: 'Business Tips', query: 'Give me tips to improve my business' },
];

export default function AskAIScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ query?: string }>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Handle initial query from params
  useEffect(() => {
    if (params.query) {
      handleSend(params.query);
    }
  }, [params.query]);

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isTyping) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Get conversation history for context
      const history = formatConversationHistory(
        messages.map(m => ({ role: m.role, content: m.content }))
      );

      // Call the real AI service
      const response = await sendMessage(messageText, history);

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        qrCode: response.qrCode,
        pdfData: response.pdfData,
        pdfUrl: response.pdfUrl,
        documentData: response.documentData,
      };

      setMessages(prev => [...prev, aiResponse]);
      console.log('[AskAI] Message received. ID:', aiResponse.id, 'Has Document:', !!aiResponse.documentData);
      if (aiResponse.documentData) {
        console.log('[AskAI] Document Details:', JSON.stringify(aiResponse.documentData).substring(0, 100));
      }

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('AI error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (query: string) => {
    handleSend(query);
  };

  const handleViewPDF = async (message: Message) => {
    try {
      if (message.documentData) {
        let uri = '';

        // Prioritize server-generated PDF data if available
        if (message.documentData.pdf_base64) {
          console.log('[AskAI] Using server-generated PDF base64');
          const fileName = message.documentData.filename || `document_${message.id}.pdf`;
          const fileUri = `${FileSystem.Paths!.cache.uri}/${fileName}`;

          await FileSystem.writeAsStringAsync(fileUri, message.documentData.pdf_base64, {
            encoding: 'base64',
          });
          uri = fileUri;
        } else {
          // Fallback to local generation
          let html = '';
          if (message.documentData.docType === 'invoice') {
            html = generateInvoiceHTML(
              message.documentData.invoice,
              message.documentData.user,
              message.documentData.customer
            );
          } else if (message.documentData.docType === 'report') {
            html = generateReportHTML(
              message.documentData.reportType,
              message.documentData.data,
              message.documentData.user
            );
          } else if (message.documentData.docType === 'markdown') {
            html = generateMarkdownHTML(
              message.documentData.title,
              message.documentData.content,
              message.documentData.user
            );
          } else {
            html = generateGenericHTML(
              message.documentData,
              message.documentData.user
            );
          }

          const printResult = await Print.printToFileAsync({ html });
          uri = printResult.uri;
        }

        console.log('PDF ready at:', uri);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'View/Share Document',
            UTI: 'com.adobe.pdf',
          });
        } else {
          alert('Sharing is not available on this device');
        }
        return;
      }

      if (message.pdfUrl) {
        const supported = await Linking.canOpenURL(message.pdfUrl);
        if (supported) {
          await Linking.openURL(message.pdfUrl);
        } else {
          alert('Cannot open PDF URL');
        }
        return;
      }

      if (message.pdfData) {
        console.log('[AskAI] Using message.pdfData (legacy)');
        const fileName = `document_${message.id}.pdf`;
        const fileUri = `${FileSystem.Paths!.cache.uri}/${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, message.pdfData, {
          encoding: 'base64',
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'View/Share Document',
            UTI: 'com.adobe.pdf',
          });
        } else {
          alert('Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Error opening/sharing PDF:', error);
      alert('Failed to open PDF document');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <View style={styles.aiIndicator}>
            <Sparkles size={16} color={Colors.askYellowDark} />
          </View>
          <Text style={styles.headerText}>BusinessAI</Text>
        </View>
        <View style={{ width: 44 }} />
      </Animated.View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.emptyState}
          >
            <View style={styles.emptyIcon}>
              <Sparkles size={40} color={Colors.askYellowDark} />
            </View>
            <Text style={styles.emptyTitle}>Ask me anything!</Text>
            <Text style={styles.emptySubtitle}>
              I can help with sales reports, inventory, GST calculations, and business insights.
            </Text>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                {quickActions.map((action, index) => (
                  <TouchableOpacity
                    key={action.label}
                    style={styles.quickActionButton}
                    onPress={() => handleQuickAction(action.query)}
                    activeOpacity={0.7}
                  >
                    <action.icon size={20} color={Colors.primary} />
                    <Text style={styles.quickActionLabel}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        ) : (
          messages.map((message, index) => (
            <Animated.View
              key={message.id}
              entering={FadeInUp.delay(index * 50).duration(300)}
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              {message.role === 'assistant' && (
                <View style={styles.aiAvatar}>
                  <Sparkles size={14} color={Colors.askYellowDark} />
                </View>
              )}
              <View style={message.role === 'user' ? styles.userTextContainer : styles.aiTextContainer}>
                <Text
                  style={[
                    styles.messageText,
                    message.role === 'user' ? styles.userText : styles.aiText,
                  ]}
                >
                  {message.content}
                  {message.pdfUrl && (
                    <Text
                      style={{ color: Colors.primary, textDecorationLine: 'underline', marginTop: 8 }}
                      onPress={() => Linking.openURL(message.pdfUrl!)}
                    >
                      {"\n\n"}📄 View PDF Report
                    </Text>
                  )}
                </Text>
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
                {(message.pdfData || message.pdfUrl || message.documentData) && (
                  <View style={styles.pdfActionContainer}>
                    {message.documentData ? (
                      <DocumentCard
                        documentData={message.documentData}
                        onGenerate={() => handleViewPDF(message)}
                      />
                    ) : (
                      <TouchableOpacity
                        style={styles.pdfButton}
                        onPress={() => handleViewPDF(message)}
                        activeOpacity={0.7}
                      >
                        <FileText size={18} color={Colors.primary} />
                        <Text style={styles.pdfButtonText}>
                          {message.pdfUrl ? 'Open PDF Report' : 'View & Share PDF'}
                        </Text>
                        {message.pdfUrl ? (
                          <TrendingUp size={16} color={Colors.textSecondary} />
                        ) : (
                          <Share size={16} color={Colors.textSecondary} />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </Animated.View>
          ))
        )}

        {isTyping && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={[styles.messageBubble, styles.aiBubble]}
          >
            <View style={styles.aiAvatar}>
              <Sparkles size={14} color={Colors.askYellowDark} />
            </View>
            <View style={styles.typingIndicator}>
              <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
              <View style={[styles.typingDot, { animationDelay: '150ms' }]} />
              <View style={[styles.typingDot, { animationDelay: '300ms' }]} />
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Input Area */}
      <Animated.View
        entering={FadeInUp.duration(300)}
        style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask a question..."
            placeholderTextColor={Colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          {/* Voice Assistant with ElevenLabs TTS */}
          <VoiceAssistant
            lastAssistantMessage={messages.filter(m => m.role === 'assistant').pop()?.content}
            autoSpeak={true}
            voiceGender="female"
            onSpeakingChange={setIsSpeaking}
          />
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={() => router.push('/voice-modal')}
            activeOpacity={0.7}
          >
            <Mic size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : {},
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
            activeOpacity={0.7}
          >
            <Send
              size={20}
              color={inputText.trim() ? '#FFFFFF' : Colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  aiIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.askYellow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },

  // Chat
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.askYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },

  // Quick Actions
  quickActions: {
    width: '100%',
    marginTop: Spacing.md,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },

  // Message Bubbles
  messageBubble: {
    maxWidth: '85%',
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiBubble: {
    alignSelf: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.askYellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  userTextContainer: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
  },
  aiTextContainer: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: 4,
    overflow: 'hidden',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    padding: Spacing.md,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: Colors.text,
  },
  qrCodeContainer: {
    alignItems: 'center',
    padding: Spacing.md,
    paddingTop: 0,
  },
  qrCodeImage: {
    width: 180,
    height: 180,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
  },
  qrCodeLabel: {
    marginTop: Spacing.sm,
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  pdfActionContainer: {
    padding: Spacing.md,
    paddingTop: 0,
    width: '100%',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pdfButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Document Card
  documentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  documentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentCardInfo: {
    flex: 1,
  },
  documentCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  documentCardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  documentCardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  documentCardActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Typing Indicator
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.lg,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textTertiary,
  },

  // Input Area
  inputArea: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
  },
});
