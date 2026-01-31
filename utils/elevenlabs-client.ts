/**
 * ElevenLabs Text-to-Speech Integration for React Native
 * Agentic multilingual voice system for Indian MSME businesses
 * Supports Hindi, English, and Hinglish with intelligent voice selection
 */

import { Audio } from 'expo-av';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  description: string;
  language: string;
  gender: 'male' | 'female';
}

export type Language = 'hindi' | 'english' | 'hinglish';

export class ElevenLabsClient {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private currentSound: Audio.Sound | null = null;

  // Multilingual Indian voices optimized for business communication
  public readonly voices = {
    // Hindi voices
    hindi_female: {
      voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam (multilingual)
      name: 'Hindi Female',
      description: 'Warm, professional Hindi voice for customer service',
      language: 'hindi',
      gender: 'female' as const,
    },
    hindi_male: {
      voice_id: '21m00Tcm4TlvDq8ikWAM', // Rachel (multilingual)
      name: 'Hindi Male',
      description: 'Authoritative Hindi voice for business',
      language: 'hindi',
      gender: 'male' as const,
    },

    // English voices (Indian accent)
    english_female: {
      voice_id: 'EXAVITQu4vr4xnSDxMaL', // Bella (can do Indian accent)
      name: 'Indian English Female',
      description: 'Clear Indian English accent for professional communication',
      language: 'english',
      gender: 'female' as const,
    },
    english_male: {
      voice_id: 'TxGEqnHWrfWFTfGW9XjX', // Josh
      name: 'Indian English Male',
      description: 'Professional Indian English accent',
      language: 'english',
      gender: 'male' as const,
    },

    // Hinglish (default - bilingual)
    hinglish_female: {
      voice_id: 'pNInz6obpgDQGcFmaJgB', // Adam (multilingual)
      name: 'Hinglish Female',
      description: 'Bilingual voice for mixed Hindi-English',
      language: 'hinglish',
      gender: 'female' as const,
    },
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '';

    if (!this.apiKey) {
      console.warn('ElevenLabs API key not configured. TTS will not work.');
    }

    // Configure audio mode for playback
    this.configureAudio();
  }

  private async configureAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
    } catch (error) {
      console.error('Failed to configure audio mode:', error);
    }
  }

  /**
   * Detect language from text (simple heuristic)
   * Returns: 'hindi', 'english', or 'hinglish'
   */
  detectLanguage(text: string): Language {
    // Remove punctuation and convert to lowercase
    const cleanText = text.toLowerCase().replace(/[^\u0900-\u097Fa-z\s]/g, '');

    // Count Hindi characters (Devanagari script)
    const hindiChars = (cleanText.match(/[\u0900-\u097F]/g) || []).length;
    const totalChars = cleanText.replace(/\s/g, '').length;

    if (totalChars === 0) return 'english';

    const hindiPercentage = (hindiChars / totalChars) * 100;

    // > 60% Hindi chars = Hindi
    // 10-60% = Hinglish (mixed)
    // < 10% = English
    if (hindiPercentage > 60) return 'hindi';
    if (hindiPercentage > 10) return 'hinglish';
    return 'english';
  }

  /**
   * Select appropriate voice based on language and gender preference
   */
  selectVoice(
    language: Language,
    gender: 'male' | 'female' = 'female'
  ): ElevenLabsVoice {
    const voiceKey = `${language}_${gender}` as keyof typeof this.voices;
    return this.voices[voiceKey] || this.voices.hinglish_female;
  }

  /**
   * Intelligent voice selection based on text content
   */
  agenticVoiceSelection(
    text: string,
    userPreference?: 'male' | 'female'
  ): ElevenLabsVoice {
    const language = this.detectLanguage(text);
    const gender = userPreference || 'female'; // Default to female for friendly tone
    return this.selectVoice(language, gender);
  }

  /**
   * Convert text to speech with intelligent voice selection
   * Automatically detects language and selects appropriate Indian voice
   */
  async textToSpeech(
    text: string,
    options: {
      voiceId?: string;
      language?: Language;
      gender?: 'male' | 'female';
      autoDetect?: boolean; // Enable agentic voice selection
      stability?: number; // 0-1, lower = more expressive
      similarityBoost?: number; // 0-1, higher = more similar to original voice
      style?: number; // 0-1, exaggeration of style
      useSpeakerBoost?: boolean;
    } = {}
  ): Promise<ArrayBuffer> {
    const {
      autoDetect = true,
      gender = 'female',
      stability = 0.5,
      similarityBoost = 0.8,
      style = 0.0,
      useSpeakerBoost = true,
    } = options;

    // Agentic voice selection
    let voiceId = options.voiceId;

    if (!voiceId && autoDetect) {
      const selectedVoice = this.agenticVoiceSelection(text, gender);
      voiceId = selectedVoice.voice_id;
      console.log(
        `🎤 Auto-selected voice: ${selectedVoice.name} (${selectedVoice.language})`
      );
    } else if (!voiceId && options.language) {
      const selectedVoice = this.selectVoice(options.language, gender);
      voiceId = selectedVoice.voice_id;
    } else if (!voiceId) {
      voiceId = this.voices.hinglish_female.voice_id;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2', // Supports Indian English
            voice_settings: {
              stability,
              similarity_boost: similarityBoost,
              style,
              use_speaker_boost: useSpeakerBoost,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          `ElevenLabs API error: ${response.status} ${response.statusText} ${JSON.stringify(error)}`
        );
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw error;
    }
  }

  /**
   * Play text as speech using expo-av
   * This is the React Native equivalent of the web's Audio API
   */
  async speak(
    text: string,
    options: {
      voiceId?: string;
      language?: Language;
      gender?: 'male' | 'female';
      autoDetect?: boolean;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<void> {
    const { onStart, onEnd, onError } = options;

    try {
      // Stop any currently playing audio
      await this.stop();

      onStart?.();

      // Get audio data from ElevenLabs
      const audioBuffer = await this.textToSpeech(text, options);

      // Convert ArrayBuffer to base64
      const base64Audio = this.arrayBufferToBase64(audioBuffer);
      const uri = `data:audio/mpeg;base64,${base64Audio}`;

      // Create and play sound
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            onEnd?.();
            this.currentSound = null;
          }
        }
      );

      this.currentSound = sound;
    } catch (error) {
      console.error('TTS playback error:', error);
      onError?.(error as Error);
    }
  }

  /**
   * Stop currently playing audio
   */
  async stop(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      } catch (error) {
        console.error('Failed to stop audio:', error);
      }
    }
  }

  /**
   * Check if audio is currently playing
   */
  async isPlaying(): Promise<boolean> {
    if (!this.currentSound) return false;

    try {
      const status = await this.currentSound.getStatusAsync();
      return status.isLoaded && status.isPlaying;
    } catch {
      return false;
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Failed to get ElevenLabs voices:', error);
      return [];
    }
  }
}

// Export singleton instance
export const elevenlabs = new ElevenLabsClient();
