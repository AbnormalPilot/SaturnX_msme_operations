/**
 * Voice Assistant Component for React Native
 * Integrates ElevenLabs TTS with agentic voice selection
 * Supports Hindi, English, and Hinglish
 */

import { Mic, Volume2, VolumeX, User } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Text as RNText,
} from 'react-native';
import { elevenlabs } from '../utils/elevenlabs-client';

interface VoiceAssistantProps {
  lastAssistantMessage?: string;
  autoSpeak?: boolean;
  voiceGender?: 'male' | 'female';
  onSpeakingChange?: (isSpeaking: boolean) => void;
  style?: any;
}

/**
 * Voice Assistant Component - Agentic Multilingual
 * - Text-to-Speech: Uses ElevenLabs with agentic voice selection
 * - Automatically detects language and selects appropriate Indian voice
 */
export function VoiceAssistant({
  lastAssistantMessage,
  autoSpeak = false,
  voiceGender = 'female',
  onSpeakingChange,
  style,
}: VoiceAssistantProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>(voiceGender);
  const [error, setError] = useState<string | null>(null);
  const [showGenderMenu, setShowGenderMenu] = useState(false);

  // Reference to track last spoken message to avoid repeats
  const [lastSpokenMessage, setLastSpokenMessage] = useState<string>('');

  // Auto-speak assistant messages
  useEffect(() => {
    if (
      autoSpeak &&
      !isMuted &&
      lastAssistantMessage &&
      lastAssistantMessage !== lastSpokenMessage
    ) {
      setLastSpokenMessage(lastAssistantMessage);
      speakText(lastAssistantMessage);
    }
  }, [lastAssistantMessage, autoSpeak, isMuted]);

  // Speak text using ElevenLabs with agentic voice selection
  const speakText = async (text: string) => {
    if (isMuted || !text) return;

    setError(null);
    setIsSpeaking(true);
    onSpeakingChange?.(true);

    try {
      await elevenlabs.speak(text, {
        gender,
        autoDetect: true, // Enable agentic voice selection
        onStart: () => {
          setIsSpeaking(true);
          onSpeakingChange?.(true);
        },
        onEnd: () => {
          setIsSpeaking(false);
          onSpeakingChange?.(false);
        },
        onError: (err) => {
          console.error('TTS error:', err);
          setError('Voice playback failed');
          setIsSpeaking(false);
          onSpeakingChange?.(false);
        },
      });
    } catch (error) {
      console.error('TTS error:', error);
      setError('Voice playback failed');
      setIsSpeaking(false);
      onSpeakingChange?.(false);
    }
  };

  // Stop speaking
  const stopSpeaking = async () => {
    await elevenlabs.stop();
    setIsSpeaking(false);
    onSpeakingChange?.(false);
  };

  // Toggle mute
  const toggleMute = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      setIsMuted(!isMuted);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Speaker button */}
      <TouchableOpacity
        style={[
          styles.button,
          isSpeaking && styles.speakingButton,
        ]}
        onPress={toggleMute}
      >
        {isSpeaking ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : isMuted ? (
          <VolumeX size={20} color={isMuted ? '#999' : '#FFF'} />
        ) : (
          <Volume2 size={20} color="#FFF" />
        )}
      </TouchableOpacity>

      {/* Voice Gender Selection */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowGenderMenu(!showGenderMenu)}
      >
        <User size={20} color="#FFF" />
      </TouchableOpacity>

      {/* Gender selection menu */}
      {showGenderMenu && (
        <View style={styles.genderMenu}>
          <TouchableOpacity
            style={[
              styles.genderOption,
              gender === 'female' && styles.genderOptionActive,
            ]}
            onPress={() => {
              setGender('female');
              setShowGenderMenu(false);
            }}
          >
            <RNText style={styles.genderIcon}>👩</RNText>
            <RNText style={styles.genderText}>Female Voice</RNText>
            {gender === 'female' && <RNText style={styles.checkmark}>✓</RNText>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderOption,
              gender === 'male' && styles.genderOptionActive,
            ]}
            onPress={() => {
              setGender('male');
              setShowGenderMenu(false);
            }}
          >
            <RNText style={styles.genderIcon}>👨</RNText>
            <RNText style={styles.genderText}>Male Voice</RNText>
            {gender === 'male' && <RNText style={styles.checkmark}>✓</RNText>}
          </TouchableOpacity>
        </View>
      )}

      {/* Error display */}
      {error && <RNText style={styles.errorText}>{error}</RNText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  speakingButton: {
    backgroundColor: '#34A853',
  },
  genderMenu: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    minWidth: 160,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  genderOptionActive: {
    backgroundColor: '#F0F7FF',
  },
  genderIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  genderText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  checkmark: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 12,
    color: '#EA4335',
    marginLeft: 8,
  },
});
