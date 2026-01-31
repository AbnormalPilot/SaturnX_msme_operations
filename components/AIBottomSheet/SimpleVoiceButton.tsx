/**
 * Simple Voice Recording Button - Works in Expo Go
 * Records audio that can be sent to any STT service
 * Compatible with Expo Go (no native modules required)
 */

import { Mic, MicOff } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  Alert,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

import { Colors } from '@/constants/theme';

interface SimpleVoiceButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function SimpleVoiceButton({
  onTranscript,
  disabled = false,
}: SimpleVoiceButtonProps) {
  console.log('[SimpleVoiceButton] Component rendering');

  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const startRecording = async () => {
    try {
      setError(null);

      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow microphone access to use voice input',
          [{ text: 'OK' }]
        );
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      console.log('[Voice] Starting recording...');

      // Create and start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      console.log('[Voice] Recording started');
    } catch (err) {
      console.error('[Voice] Failed to start recording:', err);
      setError('Failed to start recording');
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      console.log('[Voice] Stopping recording...');
      setIsRecording(false);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        throw new Error('No recording URI');
      }

      console.log('[Voice] Recording stopped, file:', uri);

      // For now, show a placeholder message
      // In production, you would send this audio file to an STT service
      const demoTranscript = await simulateTranscription(uri);
      onTranscript(demoTranscript);

      // Clean up the file
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch (err) {
      console.error('[Voice] Failed to stop recording:', err);
      setError('Failed to process recording');
      setRecording(null);
      setIsRecording(false);
    }
  };

  /**
   * Transcribe audio using ElevenLabs Speech-to-Text API
   */
  const simulateTranscription = async (audioUri: string): Promise<string> => {
    const apiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.warn('[Voice] ElevenLabs API key not configured');
      return "Voice recorded! (Add EXPO_PUBLIC_ELEVENLABS_API_KEY to enable transcription)";
    }

    try {
      console.log('[Voice] Transcribing with ElevenLabs...');

      // Create form data with file URI (React Native way)
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('model_id', 'scribe_v2');
      formData.append('language_code', 'hi'); // Hindi (auto-detects English/Hinglish)
      formData.append('tag_audio_events', 'false');
      formData.append('diarize', 'false');

      // Call ElevenLabs STT API
      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          `ElevenLabs STT error: ${response.status} ${JSON.stringify(error)}`
        );
      }

      const result = await response.json();
      console.log('[Voice] Transcription complete:', result.text);

      return result.text || '';
    } catch (error) {
      console.error('[Voice] Transcription error:', error);
      return "Could not transcribe audio. Please try again.";
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={isRecording ? pulseStyle : undefined}>
        <TouchableOpacity
          style={[
            styles.button,
            isRecording && styles.recordingButton,
            disabled && styles.disabledButton,
          ]}
          onPress={toggleRecording}
          disabled={disabled}
          activeOpacity={0.7}
        >
          {isRecording ? (
            <MicOff size={20} color="#FFF" />
          ) : (
            <Mic size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </Animated.View>

      {isRecording && (
        <Text style={styles.statusText}>Recording... Tap to stop</Text>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4285F4', // Bright blue - easy to see
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000', // Black border to stand out
  },
  recordingButton: {
    backgroundColor: '#EA4335',
  },
  disabledButton: {
    backgroundColor: '#CCC',
    opacity: 0.5,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: '#EA4335',
  },
});
