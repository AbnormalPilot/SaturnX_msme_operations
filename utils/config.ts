/**
 * Environment Configuration for BusinessAI
 *
 * CRITICAL: This file solves the production APK environment variable issue.
 *
 * Problem: process.env.EXPO_PUBLIC_* doesn't work in production APK builds
 * Solution: Use expo-constants to read from app.json extra field
 *
 * Build Process:
 * - Development: Reads from .env via process.env
 * - Production APK: Reads from app.json extra field via Constants.expoConfig
 */

import Constants from 'expo-constants';

/**
 * Get environment variable from multiple sources with fallback chain:
 * 1. expo-constants (app.json extra field) - works in production APK
 * 2. process.env (Expo env vars) - works in development
 * 3. Default value - safety fallback
 */
function getEnvVar(key: string, defaultValue: string = ''): string {
  // Try expo-constants first (production APK)
  const extraValue = Constants.expoConfig?.extra?.[key];
  if (extraValue) {
    console.log(`[Config] ✅ Loaded ${key} from app.json extra`);
    return extraValue;
  }

  // Try process.env (development)
  const processEnvKey = `EXPO_PUBLIC_${key}`;
  const envValue = (process.env as any)[processEnvKey];
  if (envValue) {
    console.log(`[Config] ✅ Loaded ${key} from process.env`);
    return envValue;
  }

  // Fallback
  if (defaultValue) {
    console.log(`[Config] ⚠️ Using default value for ${key}`);
    return defaultValue;
  }

  console.error(`[Config] ❌ Missing required config: ${key}`);
  return '';
}

/**
 * Centralized configuration object
 * All services should import from here instead of using process.env directly
 */
export const Config = {
  // AI Service (OpenRouter/Gemini)
  GEMMA_API_KEY: getEnvVar('GEMMA_API_KEY'),

  // Voice Service (ElevenLabs)
  ELEVENLABS_API_KEY: getEnvVar('ELEVENLABS_API_KEY'),

  // MCP Backend Server
  MCP_SERVER_URL: getEnvVar('MCP_SERVER_URL', 'https://mcp.felon.in'),

  // Supabase Database
  SUPABASE_URL: getEnvVar('SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('SUPABASE_ANON_KEY'),

  // Google OAuth (optional)
  GOOGLE_WEB_CLIENT_ID: getEnvVar('GOOGLE_WEB_CLIENT_ID', ''),
};

/**
 * Validation helper - call this at app startup
 * Returns true if all required config is present
 */
export function validateConfig(): boolean {
  const required: (keyof typeof Config)[] = [
    'GEMMA_API_KEY',
    'MCP_SERVER_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
  ];

  const missing = required.filter(key => !Config[key]);

  if (missing.length > 0) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ MISSING REQUIRED CONFIGURATION');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Missing:', missing.join(', '));
    console.error('');
    console.error('FOR DEVELOPMENT:');
    console.error('  1. Copy .env.example to .env');
    console.error('  2. Fill in your API keys');
    console.error('  3. Restart: npx expo start --clear');
    console.error('');
    console.error('FOR PRODUCTION APK:');
    console.error('  1. Add keys to app.json under "extra" field');
    console.error('  2. Rebuild: npx expo prebuild --clean');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return false;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ALL REQUIRED CONFIG LOADED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('GEMMA_API_KEY:', Config.GEMMA_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('ELEVENLABS_API_KEY:', Config.ELEVENLABS_API_KEY ? '✅ Set' : '⚠️ Optional');
  console.log('MCP_SERVER_URL:', Config.MCP_SERVER_URL);
  console.log('SUPABASE_URL:', Config.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return true;
}

/**
 * Check if we're running in development or production
 */
export function isDevelopment(): boolean {
  return __DEV__;
}

/**
 * Check if we're running in a standalone app (production APK)
 */
export function isStandaloneApp(): boolean {
  return Constants.appOwnership === 'standalone';
}

/**
 * Get build information
 */
export function getBuildInfo() {
  return {
    appOwnership: Constants.appOwnership,
    isDevice: Constants.isDevice,
    platform: Constants.platform,
    expoVersion: Constants.expoVersion,
    nativeAppVersion: Constants.nativeAppVersion,
    nativeBuildVersion: Constants.nativeBuildVersion,
  };
}
