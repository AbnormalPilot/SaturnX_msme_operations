import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Keyboard,
  StyleSheet,
  AppState,
} from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  SharedValue,
  runOnJS,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { BorderRadius, Colors } from '../constants/theme';
import { formatConversationHistory, sendMessage } from '../utils/ai-service';
import { generatePDFFromDocumentData, sharePDF } from '../utils/client-pdf-generator';
import { AIEmptyState } from './AIBottomSheet/AIEmptyState';
import { AIInputBar } from './AIBottomSheet/AIInputBar';
import { AIMessageList } from './AIBottomSheet/AIMessageList';
import { AISheetHeader } from './AIBottomSheet/AISheetHeader';
import { SlashCommands } from './AIBottomSheet/commands/SlashCommands';
import { ConversationList, saveConversation } from './AIBottomSheet/conversation/ConversationList';
import { Message } from './AIBottomSheet/messages/MessageBubble';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SNAP_POINT = -SCREEN_HEIGHT;
const THRESHOLD = SNAP_POINT / 3;

interface AIBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onOpen: () => void;
  translateY: SharedValue<number>;
}

export default function AIBottomSheet({
  isVisible,
  onClose,
  onOpen,
  translateY,
}: AIBottomSheetProps) {
  const router = useRouter();
  const context = useSharedValue({ y: 0 });
  const keyboard = useAnimatedKeyboard();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingText, setLoadingText] = useState('Thinking...');
  const [showHistory, setShowHistory] = useState(false);

  const handleClose = useCallback(async () => {
    // Save conversation if there are messages
    if (messages.length > 0) {
      await saveConversation(messages);
    }
    Keyboard.dismiss();
    onClose();
  }, [onClose, messages]);

  // Handle hardware back press
  useEffect(() => {
    if (!isVisible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });

    return () => backHandler.remove();
  }, [isVisible, handleClose]);

  // App state handler - ensures UI is responsive after returning from share sheet
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Force a small delay to ensure share sheet is fully dismissed
        setTimeout(() => {
          // Dismiss any lingering keyboard
          Keyboard.dismiss();
        }, 100);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboard.height.value,
  }));

  // Pan and tap gestures
  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      const newY = event.translationY + context.value.y;
      translateY.value = Math.max(Math.min(newY, 0), -SCREEN_HEIGHT + 50);
    })
    .onEnd((event) => {
      if (event.velocityY > 500) {
        translateY.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        runOnJS(onClose)();
      } else if (event.velocityY < -500 || translateY.value < THRESHOLD) {
        translateY.value = withTiming(SNAP_POINT, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        runOnJS(onOpen)();
      } else {
        translateY.value = withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        runOnJS(onClose)();
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(Keyboard.dismiss)();
  });

  const handleViewPDF = async (message: Message) => {
    try {
      console.log('[PDF Handler] Starting PDF processing');

      // Priority 1: Check for PDF URL
      if (message.pdfUrl) {
        console.log('[PDF Handler] Opening PDF URL');
        const { Linking } = await import('react-native');
        await Linking.openURL(message.pdfUrl);
        return;
      }

      // Priority 2: Check for base64 PDF data
      let pdfData = message.pdfData;
      if (!pdfData && message.documentData) {
        pdfData = message.documentData.pdf_base64 || message.documentData.pdfData || message.documentData.pdf;
      }

      if (pdfData && typeof pdfData === 'string' && pdfData.length > 100) {
        console.log('[PDF Handler] Found base64 PDF, saving');
        const fileName = `document_${message.id}.pdf`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, pdfData, {
          encoding: 'base64' as FileSystem.EncodingType,
        });

        await sharePDF(fileUri, 'Document');
        return;
      }

      // Priority 3: Generate PDF from documentData
      if (message.documentData && message.documentData.docType) {
        console.log('[PDF Handler] Generating PDF from documentData');

        const pdfUri = await generatePDFFromDocumentData(message.documentData);
        await sharePDF(pdfUri, message.documentData.title || 'Document');
        return;
      }

      // No PDF data available
      const { Alert } = await import('react-native');
      Alert.alert(
        'PDF Not Available',
        'This message doesn\'t contain PDF data. Try asking the AI to create a report.'
      );

    } catch (error) {
      console.error('[PDF Handler] Error:', error);
      const { Alert } = await import('react-native');
      Alert.alert('Error', 'Failed to process PDF');
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    if (messageText.toLowerCase().includes('invoice') || messageText.toLowerCase().includes('pdf')) {
      setLoadingText('Generating PDF...');
    } else {
      setLoadingText('Thinking...');
    }

    try {
      const history = formatConversationHistory(
        messages.map((m) => ({ role: m.role, content: m.content }))
      );

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
        navigationAction: response.navigationAction,
      };

      setMessages((prev) => [...prev, aiResponse]);

      if (response.navigationAction) {
        onClose();
        setTimeout(() => {
          const navData = response.navigationData;

          if (response.navigationAction === 'scanner') {
            router.push('/scanner');
          } else if (response.navigationAction === 'settings') {
            router.push('/(tabs)/settings');
          } else if (response.navigationAction === 'inventory') {
            router.push('/(tabs)/inventory');
          } else if (response.navigationAction === 'sales') {
            router.push('/(tabs)/sales');
          } else if (response.navigationAction === 'create_invoice') {
            // Pass data as query params if available
            if (navData) {
              router.push({
                pathname: '/create',
                params: navData
              } as any);
            } else {
              router.push('/create');
            }
          } else if (response.navigationAction === 'home') {
            router.push('/(tabs)');
          } else if (response.navigationAction === 'instant-invoice') {
            router.push('/instant-invoice');
          } else if (response.navigationAction === 'notes') {
            router.push('/notes');
          } else if (response.navigationAction === 'voice-modal') {
            router.push('/voice-modal');
          } else if (response.navigationAction === 'ask-ai') {
            router.push('/ask-ai');
          }
        }, 300);
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your internet connection and try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <AISheetHeader
        panGesture={panGesture}
        tapGesture={tapGesture}
        onHistoryPress={() => setShowHistory(true)}
      />

      <Animated.View style={[styles.content, contentStyle]}>
        {showHistory ? (
          <ConversationList
            onSelect={(conversation) => {
              setMessages(conversation.messages);
              setShowHistory(false);
            }}
            onClose={() => setShowHistory(false)}
          />
        ) : (
          <>
            {messages.length === 0 ? (
              <AIEmptyState onActionPress={handleSend} />
            ) : (
              <AIMessageList
                messages={messages}
                isTyping={isTyping}
                loadingText={loadingText}
                onViewPDF={handleViewPDF}
              />
            )}

            {/* Slash Commands */}
            {inputText.startsWith('/') && (
              <SlashCommands
                inputValue={inputText}
                onSelectCommand={(command) => setInputText(command + ' ')}
              />
            )}

            <AIInputBar
              value={inputText}
              onChangeText={setInputText}
              onSend={() => handleSend()}
              disabled={isTyping}
            />
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: SCREEN_HEIGHT,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    zIndex: 100,
    elevation: 20,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  content: {
    flex: 1,
  },
});
