import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createAuthClient } from 'better-auth/react';
import { adminClient, emailOTPClient, inferAdditionalFields } from 'better-auth/client/plugins';
import { expoClient } from '@better-auth/expo/client';

function resolveBaseURL() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (metroHost) return `http://${metroHost}:3000`;

  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

export const API_URL = resolveBaseURL();

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: 'lucent',
      storagePrefix: 'lucent',
      storage: SecureStore,
    }),
    adminClient(),
    emailOTPClient(),
    inferAdditionalFields({
      user: {
        role: { type: 'string', required: false, defaultValue: 'customer' },
        skinType: { type: 'string', required: false },
        skinConcerns: { type: 'string', required: false },
        onboardingCompleted: { type: 'boolean', required: false, defaultValue: false },
      },
    }),
  ],
});

export type Session = typeof authClient.$Infer.Session;
export type User = Session['user'];
