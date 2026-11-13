import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_600SemiBold,
  Archivo_700Bold,
  Archivo_800ExtraBold,
  Archivo_900Black,
  useFonts,
} from '@expo-google-fonts/archivo';
import { NotoColorEmoji_400Regular } from '@expo-google-fonts/noto-color-emoji';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Colors } from '../constants/theme';
import { supabase } from '../lib/supabase';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isBypassed, setIsBypassed] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_600SemiBold,
    Archivo_700Bold,
    Archivo_800ExtraBold,
    Archivo_900Black,
    NotoColorEmoji_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Initial setup: Load session and initial bypass status
  useEffect(() => {
    async function setup() {
      // 1. Get session
      const { data } = await supabase.auth.getSession();
      setSession(data.session);

      // 2. Initial bypass check
      const bypass = await AsyncStorage.getItem('vamanos_waitlist_bypassed');
      if (bypass === 'true') {
        setIsBypassed(true);
      }

      setInitialized(true);
    }

    setup();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Navigation Guard logic
  useEffect(() => {
    if (!initialized || !fontsLoaded) return;

    async function evaluateNavigation() {
      // Re-verify bypass status in case it was just set in Another screen
      const bypass = await AsyncStorage.getItem('vamanos_waitlist_bypassed');
      const currentlyBypassed = bypass === 'true';
      if (currentlyBypassed !== isBypassed) {
        setIsBypassed(currentlyBypassed);
        // Effect will re-run after state update
        return;
      }

      const inAuthGroup = segments[0] === 'auth';
      const hasAccess = !!session || currentlyBypassed;

      if (!hasAccess && !inAuthGroup) {
        // Not logged in or bypassed? Send to signup
        router.replace('/auth');
      } else if (hasAccess && inAuthGroup) {
        // Logged in or bypassed? Go to the app
        router.replace('/');
      }
    }

    evaluateNavigation();
  }, [session, isBypassed, initialized, segments, fontsLoaded]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.ink, alignItems: 'center' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: Platform.OS === 'web' && segments[0] !== 'auth' ? 560 : undefined }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </View>
    </View>
  );
}
