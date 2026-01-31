import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Sparkles, Send, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  Platform,
  AppState,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { GlassColors, GlassRadius, GlassShadow, GlassSpacing } from '../constants/glass-theme';
import { formatConversationHistory, sendMessage } from '../utils/ai-service';
import { Message } from './AIBottomSheet/messages/MessageBubble';
import { GlassMessageList } from './AIBottomSheetGlass/GlassMessageList';
import { SimpleVoiceButton } from './AIBottomSheet/SimpleVoiceButton';
import { GlassQuickActions } from './AIBottomSheetGlass/GlassQuickActions';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SNAP_POINT = -SCREEN_HEIGHT * 0.85; // 85% of screen
const THRESHOLD = SNAP_POINT / 3;

interface AIBottomSheetGlassProps {
  isVisible: boolean;
  onClose: () => void;
  onOpen: () => void;
  translateY: any;
}

export default function AIBottomSheetGlass({
  isVisible,
  onClose,
  onOpen,
  translateY,
}: AIBottomSheetGlassProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<any>(null);
  const keyboard = useAnimatedKeyboard();

  const glowOpacity = useSharedValue(0);

  // Pulsing glow animation
  useEffect(() => {
    if (isVisible) {
      glowOpacity.value = withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      });
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isVisible]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Auto-scroll to bottom
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd?.({ animated: true });
        }, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd?.({ animated: true });
    }, 100);
  }, [messages.length]);

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    translateY.value = withSpring(0, { damping: 50, stiffness: 400 });
    onClose();
  }, [onClose, translateY]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const conversationHistory = formatConversationHistory(messages);
      const response = await sendMessage(inputValue.trim(), conversationHistory);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content || 'No response',
        timestamp: new Date(),
        qrCode: response.qrCode,
        pdfData: response.pdfData,
        pdfUrl: response.pdfUrl,
        documentData: response.documentData,
        navigationAction: response.navigationAction,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Handle navigation
      if (response.navigationAction) {
        handleClose();
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
      console.error('[AI] Error:', error);
      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboard.height.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value * 0.6,
  }));

  // Back handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isVisible) {
        handleClose();
        return true;
      }
      return false;
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

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop - Static overlay */}
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
      </View>

      {/* Main Glass Sheet */}
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
          {/* Glow effect */}
          <Animated.View style={[styles.glow, glowStyle]}>
            <LinearGradient
              colors={GlassColors.gradient.primary}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>

          {/* Glass container - Solid White */}
          <View style={styles.glassContainer}>
            {/* Header with safe area */}
            <View style={styles.headerContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={GlassColors.gradient.primary}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                    <Sparkles size={20} color="#fff" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.headerTitle}>BusinessAI</Text>
                </View>

                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                  <X size={24} color={GlassColors.text.secondary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Actions */}
            <GlassQuickActions onActionPress={(query) => setInputValue(query)} />

            {/* Messages */}
            <View style={[styles.messagesContainer, { marginBottom: keyboardHeight }]}>
              <GlassMessageList
                messages={messages}
                isLoading={isLoading}
                scrollViewRef={scrollViewRef}
              />
            </View>

            {/* Input Bar */}
            <Animated.View style={[styles.inputContainer, inputAnimatedStyle]}>
              <View style={styles.inputBlur}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    ref={inputRef}
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder="Ask me anything..."
                    placeholderTextColor={GlassColors.text.tertiary}
                    style={styles.input}
                    multiline
                    maxLength={500}
                    onSubmitEditing={handleSend}
                    blurOnSubmit={false}
                  />

                  <View style={styles.inputActions}>
                    {/* Voice Input Button */}
                    <SimpleVoiceButton
                      onTranscript={(text) => setInputValue(text)}
                      disabled={isLoading}
                    />

                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        !inputValue.trim() && styles.sendButtonDisabled,
                      ]}
                      onPress={handleSend}
                      disabled={!inputValue.trim() || isLoading}
                    >
                      <LinearGradient
                        colors={
                          inputValue.trim()
                            ? GlassColors.gradient.primary
                            : ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.05)']
                        }
                        style={styles.sendGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Send
                          size={18}
                          color={inputValue.trim() ? '#fff' : GlassColors.text.tertiary}
                          strokeWidth={2.5}
                        />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GlassColors.surface.overlay,
    zIndex: 1,
  },

  container: {
    position: 'absolute',
    top: SCREEN_HEIGHT,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    zIndex: 2,
  },

  glow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    height: 200,
    borderRadius: GlassRadius.xxl,
    ...GlassShadow.glow,
  },

  glassContainer: {
    flex: 1,
    borderTopLeftRadius: GlassRadius.xxl,
    borderTopRightRadius: GlassRadius.xxl,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF', // Solid white
    borderWidth: 0,
    borderBottomWidth: 0,
    ...GlassShadow.lg,
  },

  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // Safe area for notch/status bar
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GlassSpacing.xl,
    paddingTop: GlassSpacing.sm,
    paddingBottom: GlassSpacing.lg,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GlassSpacing.md,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: GlassRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...GlassShadow.md,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: GlassColors.text.primary,
    letterSpacing: -0.5,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: GlassRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GlassColors.glass.medium,
  },

  messagesContainer: {
    flex: 1,
    paddingHorizontal: GlassSpacing.lg,
  },

  inputContainer: {
    paddingHorizontal: GlassSpacing.lg,
    paddingBottom: Platform.OS === 'ios' ? GlassSpacing.xxxl : GlassSpacing.xl,
  },

  inputBlur: {
    borderRadius: GlassRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...GlassShadow.sm,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: GlassSpacing.lg,
    paddingVertical: GlassSpacing.md,
    gap: GlassSpacing.sm,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: GlassColors.text.primary,
    maxHeight: 100,
    paddingVertical: GlassSpacing.sm,
  },

  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GlassSpacing.sm,
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: GlassRadius.md,
    overflow: 'hidden',
    ...GlassShadow.sm,
  },

  sendButtonDisabled: {
    opacity: 0.5,
  },

  sendGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
